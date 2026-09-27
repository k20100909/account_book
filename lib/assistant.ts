import { CATEGORY_OPTIONS, TransactionType } from "@/lib/transactions";

export type AssistantTransaction = {
  type: TransactionType;
  date: string;
  amount: number;
  description: string;
  category: string;
};

export type AssistantReply = {
  message: string;
  transactions: AssistantTransaction[];
};

const CATEGORY_ALIASES: Record<string, string> = {
  교통: "교통비",
  여가: "문화/여가",
  문화: "문화/여가",
  주거: "주거/통신",
  통신: "주거/통신",
};

const allowedCategories = (type: TransactionType) =>
  new Set(CATEGORY_OPTIONS[type].map((item) => item.value));

const normalizeCategory = (type: TransactionType, category: unknown) => {
  const raw = typeof category === "string" ? category.trim() : "";
  const value = CATEGORY_ALIASES[raw] ?? raw;
  return allowedCategories(type).has(value) ? value : "기타";
};

const normalizeTransaction = (value: unknown): AssistantTransaction | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const type: TransactionType = item.type === "income" ? "income" : "expense";
  const date = typeof item.date === "string" ? item.date.trim() : "";
  const amount = typeof item.amount === "number" ? item.amount : Number(item.amount);
  const description = typeof item.description === "string" ? item.description.trim() : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!description) return null;

  return {
    type,
    date,
    amount: Math.round(amount),
    description: description.slice(0, 80),
    category: normalizeCategory(type, item.category),
  };
};

export const parseAssistantReply = (text: string): AssistantReply => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1]?.trim() || trimmed;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? source.slice(start, end + 1) : source;

  try {
    const parsed = JSON.parse(jsonText) as { message?: unknown; transactions?: unknown };
    const transactions = Array.isArray(parsed.transactions)
      ? parsed.transactions.flatMap((item) => {
          const transaction = normalizeTransaction(item);
          return transaction ? [transaction] : [];
        })
      : [];
    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : transactions.length > 0
          ? "가계부에 기록해 두었어요."
          : "무엇을 기록할까요?";
    return { message, transactions };
  } catch {
    return {
      message: trimmed || "무엇을 기록할까요?",
      transactions: [],
    };
  }
};
