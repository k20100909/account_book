import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { parseAssistantReply } from "@/lib/assistant";
import { CATEGORY_OPTIONS } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";

type IncomingMessage = {
  role?: string;
  content?: string;
};

type IncomingExpense = {
  date?: string;
  amount?: number;
  description?: string;
  type?: string;
  category?: string | null;
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const seoulToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

const readServerEnv = (name: string) => {
  const value = process.env[name];
  if (typeof value !== "string") return "";
  const compact = value.replace(/\s+/g, "").replace(/^['"]|['"]$/g, "");
  const embedded = compact.match(/AQ\.[A-Za-z0-9_-]+|AIza[A-Za-z0-9_-]+/);
  return embedded?.[0] ?? compact.replace(/^GEMINI_API_KEY=/i, "");
};

const keyShape = (apiKey: string) =>
  `${apiKey.startsWith("AQ.") ? "AQ.로 시작" : "AQ.로 시작하지 않음"}, ${apiKey.length}자`;

const systemInstruction = (today: string) => `당신은 가계부 도우미입니다. 한국어로 짧고 다정하게 답합니다.
오늘 날짜는 ${today}입니다.
지출 카테고리: ${CATEGORY_OPTIONS.expense.map((item) => item.value).join(", ")}
수입 카테고리: ${CATEGORY_OPTIONS.income.map((item) => item.value).join(", ")}
사용자가 지출이나 수입을 말하면 transactions에 기록할 항목을 넣습니다.
질문이면 transactions는 빈 배열로 두고, 아래 가계부 자료만 근거로 답합니다.
자료에 없는 금액은 만들지 않습니다.
반드시 JSON만 반환합니다.
{"message":"사용자에게 보여줄 문장","transactions":[{"type":"expense","date":"YYYY-MM-DD","amount":8500,"description":"점심","category":"식비"}]}
type은 expense 또는 income입니다. amount는 원 단위 숫자입니다.`;

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const apiKey = readServerEnv("GEMINI_API_KEY") || readServerEnv("Gemini_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "제미나이 API 키가 없습니다." }, { status: 500 });
  }
  if (!apiKey.startsWith("AQ.") || apiKey.length !== 53) {
    return NextResponse.json(
      {
        error: `Vercel에 저장된 키 형식이 로컬과 다릅니다. 로컬 키는 AQ.로 시작하고 53자인데, 서버는 ${keyShape(apiKey)}입니다. 환경 변수 값만 지우고 .env.local의 키를 다시 붙여 넣은 뒤 최신 배포를 Redeploy 해 주세요.`,
      },
      { status: 500 },
    );
  }

  let body: {
    messages?: IncomingMessage[];
    expenses?: IncomingExpense[];
    today?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청을 읽지 못했습니다." }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((item) => (item.role === "user" || item.role === "assistant") && item.content?.trim())
    .slice(-20)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      content: item.content!.trim().slice(0, 1000),
    }));
  const last = messages.at(-1);
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }

  const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today ?? "") ? body.today! : seoulToday();
  const ledger = (body.expenses ?? [])
    .slice(0, 60)
    .map((item) => {
      const type = item.type === "income" ? "수입" : "지출";
      const amount = Number(item.amount);
      return `${item.date ?? ""} | ${type} | ${item.category || "미분류"} | ${Number.isFinite(amount) ? amount : 0}원 | ${String(item.description ?? "").slice(0, 80)}`;
    })
    .join("\n");

  const history = messages.slice(0, -1);
  const firstUser = history.findIndex((item) => item.role === "user");
  const chatHistory = (firstUser >= 0 ? history.slice(firstUser) : []).map((item) => ({
    role: item.role as "user" | "model",
    parts: [{ text: item.content }],
  }));

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      systemInstruction: systemInstruction(today),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
    const chat = model.startChat({ history: chatHistory });
    const prompt = `${last.content}\n\n현재 가계부:\n${ledger || "저장된 내역 없음"}`;
    let result;
    try {
      result = await chat.sendMessage(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/\b(429|503)\b/.test(message)) throw error;
      result = await chat.sendMessage(prompt);
    }
    const reply = parseAssistantReply(result.response.text());
    return NextResponse.json(reply);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "";
    console.error("Gemini request failed", detail.slice(0, 300));
    const error = /API key not valid|API_KEY_INVALID/i.test(detail)
      ? `키 형식은 맞는데 Google이 거부했습니다 (${keyShape(apiKey)}). Vercel 값을 전부 지우고 .env.local의 키를 한 줄로 다시 붙여 넣은 다음, 최신 main 배포를 Redeploy 해 주세요.`
      : /quota|RESOURCE_EXHAUSTED|\b429\b/i.test(detail)
        ? "Gemini 사용 한도에 걸렸습니다. 잠시 후 다시 시도해 주세요."
        : "지금은 답변을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ error }, { status: 502 });
  }
}
