"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthForm from "@/components/AuthForm";
import { supabase } from "@/lib/supabase";

type TransactionType = "expense" | "income";

type Transaction = {
  id: number;
  created_at: string;
  date: string;
  amount: number;
  description: string;
  type?: TransactionType | null;
  category?: string | null;
  user_id?: string | null;
};

const CATEGORY_OPTIONS = {
  expense: [
    { value: "식비", emoji: "🍽️" },
    { value: "교통비", emoji: "🚌" },
    { value: "쇼핑", emoji: "🛍️" },
    { value: "문화/여가", emoji: "🎬" },
    { value: "주거/통신", emoji: "🏠" },
    { value: "기타", emoji: "📌" },
  ],
  income: [
    { value: "급여", emoji: "💼" },
    { value: "용돈", emoji: "🎁" },
    { value: "금융소득", emoji: "📈" },
    { value: "기타", emoji: "📌" },
  ],
} satisfies Record<TransactionType, { value: string; emoji: string }[]>;

const ALL_CATEGORIES = [
  ...CATEGORY_OPTIONS.expense,
  ...CATEGORY_OPTIONS.income,
];

const getCategoryInfo = (category?: string | null) =>
  ALL_CATEGORIES.find((item) => item.value === category) ?? {
    value: "미분류",
    emoji: "🏷️",
  };

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("ko-KR").format(amount);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [category, setCategory] = useState("식비");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsAuthLoading(false);
    };

    void getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (session?.user) {
        setIsLoading(true);
      } else {
        setExpenses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let isActive = true;

    const loadExpenses = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!isActive) return;
      if (error) {
        setErrorMessage("지출 내역을 불러오지 못했습니다.");
      } else {
        setExpenses(data ?? []);
      }
      setIsLoading(false);
    };

    void loadExpenses();

    return () => {
      isActive = false;
    };
  }, [user]);

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setErrorMessage("");

    const values = {
      date,
      amount: Number(amount),
      description: description.trim(),
      type: transactionType,
      category,
      user_id: user.id,
    };

    const query = editingId
      ? supabase
          .from("expenses")
          .update(values)
          .eq("id", editingId)
          .eq("user_id", user.id)
      : supabase.from("expenses").insert(values);
    const { data, error } = await query.select().single();

    if (error) {
      setErrorMessage(
        editingId
          ? "수정하지 못했습니다. 잠시 후 다시 시도해 주세요."
          : "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } else {
      setExpenses((current) =>
        editingId
          ? current.map((expense) => (expense.id === data.id ? data : expense))
          : [
              data,
              ...current.filter((expense) => expense.id !== data.id),
            ],
      );
      setEditingId(null);
      setTransactionType("expense");
      setCategory("식비");
      setDate("");
      setAmount("");
      setDescription("");
    }
    setIsSaving(false);
  };

  const startEditing = (expense: Transaction) => {
    const savedType = expense.type ?? "expense";
    setEditingId(expense.id);
    setTransactionType(savedType);
    setCategory(expense.category ?? CATEGORY_OPTIONS[savedType][0].value);
    setDate(expense.date);
    setAmount(String(expense.amount));
    setDescription(expense.description);
    setErrorMessage("");
    document.getElementById("expense-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTransactionType("expense");
    setCategory("식비");
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setDescription("");
    setErrorMessage("");
  };

  const deleteExpense = async (expense: Transaction) => {
    if (!user) return;

    const confirmed = window.confirm(
      `"${expense.description}" 내역을 삭제할까요?`,
    );
    if (!confirmed) return;

    setDeletingId(expense.id);
    setErrorMessage("");
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expense.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } else {
      setExpenses((current) =>
        current.filter((item) => item.id !== expense.id),
      );
      if (editingId === expense.id) cancelEditing();
    }
    setDeletingId(null);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setErrorMessage("로그아웃하지 못했습니다. 다시 시도해 주세요.");
  };

  if (isAuthLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f5]">
        <p className="text-sm text-[#86868b]">로그인 정보를 확인하는 중...</p>
      </main>
    );
  }

  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f]">
      <header>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch justify-between gap-4 px-5 py-7 sm:flex-row sm:items-center sm:px-8 sm:py-9">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7.5h16M7 4v3.5M17 4v3.5M5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 18.5 5h-13A1.5 1.5 0 0 0 4 6.5v12A1.5 1.5 0 0 0 5.5 20Z" />
                <path d="M8 12h3v3H8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-[0.14em] text-[#86868b]">SMART MONEY NOTE</p>
              <h1 className="truncate text-lg font-semibold tracking-[-0.02em] sm:mt-0.5 sm:text-xl">기현이가 만든 AI 가계부</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-start">
            <p className="max-w-56 truncate text-sm text-[#6e6e73] sm:max-w-40">
              {user.email}
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="min-h-11 rounded-xl bg-white px-4 text-sm font-medium transition-colors hover:bg-[#eeeeec]"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-16">
        <div className="mb-12 sm:mb-16">
          <p className="text-sm font-medium text-[#2563eb]">오늘의 자금 기록</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.15] tracking-[-0.045em] sm:text-5xl">
            수입과 지출을<br className="sm:hidden" /> 기록해 보세요.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#6e6e73] sm:text-lg">작은 기록이 더 나은 금융 습관을 만듭니다.</p>
        </div>

        <section id="expense-form" className="w-full rounded-3xl bg-white p-6 sm:p-10">
          <form onSubmit={saveExpense} className="space-y-8">
            {editingId && (
              <div className="flex items-center justify-between rounded-2xl bg-[#eff4ff] px-4 py-3">
                <p className="text-sm font-medium text-[#2563eb]">내역을 수정하고 있어요</p>
                <button type="button" onClick={cancelEditing} className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#6e6e73] transition-colors hover:bg-white">
                  취소
                </button>
              </div>
            )}
            <fieldset>
              <legend className="mb-3 block text-base font-semibold">구분</legend>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f3f3f1] p-1.5">
                {([
                  ["expense", "지출"],
                  ["income", "수입"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={transactionType === value}
                    onClick={() => {
                      setTransactionType(value);
                      setCategory(CATEGORY_OPTIONS[value][0].value);
                    }}
                    className={`min-h-12 rounded-xl text-base font-medium transition-colors ${
                      transactionType === value
                        ? "bg-white text-[#2563eb]"
                        : "text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="category" className="mb-3 block text-base font-semibold">카테고리</label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                className="field cursor-pointer appearance-none"
              >
                {CATEGORY_OPTIONS[transactionType].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="mb-3 block text-base font-semibold">날짜</label>
              <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="field" />
            </div>

            <div>
              <label htmlFor="amount" className="mb-3 block text-base font-semibold">금액</label>
              <div className="relative">
                <input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={amount ? formatAmount(Number(amount)) : ""}
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  required
                  className="field pr-14 font-mono text-lg font-semibold tabular-nums"
                />
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#86868b]">원</span>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-3 block text-base font-semibold">내용</label>
              <input id="description" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="어디에 사용했나요?" required className="field" />
            </div>

            {errorMessage && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button disabled={isSaving} type="submit" className="flex h-16 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#2563eb] text-base font-semibold text-white transition-colors hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? "저장 중..." : editingId ? "수정 내용 저장하기" : "저장하기"}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </form>
        </section>

        <section className="mt-16 w-full sm:mt-20">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-[#86868b]">지출 내역을 불러오는 중...</p>
          ) : expenses.length > 0 ? (
            <>
            <div className="mb-7 flex items-end justify-between">
              <h3 className="text-xl font-semibold tracking-[-0.02em]">최근 내역</h3>
              <div className="text-right">
                <p className="text-xs text-[#86868b]">현재 잔액</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-[-0.04em]">
                  {formatAmount(expenses.reduce(
                    (sum, item) =>
                      sum + (item.type === "income" ? item.amount : -item.amount),
                    0,
                  ))}<span className="ml-1 font-sans text-sm">원</span>
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {expenses.map((expense) => {
                const categoryInfo = getCategoryInfo(expense.category);
                const isIncome = expense.type === "income";

                return (
                  <article key={expense.id} className="w-full rounded-2xl bg-white px-5 py-6 sm:px-7">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-base font-medium">{expense.description}</p>
                      <p className="mt-2 text-sm text-[#86868b]">{expense.date}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f3f3f1] px-2.5 py-1 text-xs font-medium text-[#6e6e73]">
                        <span aria-hidden="true">{categoryInfo.emoji}</span>
                        {categoryInfo.value}
                      </span>
                    </div>
                    <p className={`shrink-0 font-mono text-xl font-semibold tabular-nums tracking-[-0.04em] sm:text-2xl ${isIncome ? "text-[#2563eb]" : ""}`}>
                      {isIncome ? "+" : "-"}{formatAmount(expense.amount)}<span className="ml-1 font-sans text-sm font-medium">원</span>
                    </p>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(expense)}
                      className="min-h-11 flex-1 rounded-xl bg-[#f3f3f1] px-4 text-sm font-medium transition-colors hover:bg-[#e8e8e5]"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteExpense(expense)}
                      disabled={deletingId === expense.id}
                      className="min-h-11 flex-1 rounded-xl bg-[#f3f3f1] px-4 text-sm font-medium transition-colors hover:bg-[#e8e8e5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === expense.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
            </>
          ) : (
            <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-[#86868b]">
              아직 저장된 내역이 없습니다.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}