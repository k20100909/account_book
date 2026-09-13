"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Expense = {
  id: number;
  created_at: string;
  date: string;
  amount: number;
  description: string;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("ko-KR").format(amount);

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadExpenses = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("지출 내역을 불러오지 못했습니다.");
      } else {
        setExpenses(data ?? []);
      }
      setIsLoading(false);
    };

    void loadExpenses();
  }, []);

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const values = {
      date,
      amount: Number(amount),
      description: description.trim(),
    };

    const query = editingId
      ? supabase.from("expenses").update(values).eq("id", editingId)
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
      setDate("");
      setAmount("");
      setDescription("");
    }
    setIsSaving(false);
  };

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
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
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setDescription("");
    setErrorMessage("");
  };

  const deleteExpense = async (expense: Expense) => {
    const confirmed = window.confirm(
      `"${expense.description}" 지출 내역을 삭제할까요?`,
    );
    if (!confirmed) return;

    setDeletingId(expense.id);
    setErrorMessage("");
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expense.id);

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

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f]">
      <header>
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563eb] text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7.5h16M7 4v3.5M17 4v3.5M5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 18.5 5h-13A1.5 1.5 0 0 0 4 6.5v12A1.5 1.5 0 0 0 5.5 20Z" />
              <path d="M8 12h3v3H8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-[#86868b]">SMART MONEY NOTE</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.02em]">기현이가 만든 AI 가계부</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-16">
        <div className="mb-12 sm:mb-16">
          <p className="text-sm font-medium text-[#2563eb]">오늘의 소비 기록</p>
          <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.15] tracking-[-0.045em] sm:text-5xl">
            지출 내역을<br className="sm:hidden" /> 기록해 보세요.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#6e6e73] sm:text-lg">작은 기록이 더 나은 소비 습관을 만듭니다.</p>
        </div>

        <section id="expense-form" className="w-full rounded-3xl bg-white p-6 sm:p-10">
          <form onSubmit={saveExpense} className="space-y-8">
            {editingId && (
              <div className="flex items-center justify-between rounded-2xl bg-[#eff4ff] px-4 py-3">
                <p className="text-sm font-medium text-[#2563eb]">지출 내역을 수정하고 있어요</p>
                <button type="button" onClick={cancelEditing} className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#6e6e73] transition-colors hover:bg-white">
                  취소
                </button>
              </div>
            )}
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
              <h3 className="text-xl font-semibold tracking-[-0.02em]">최근 지출</h3>
              <div className="text-right">
                <p className="text-xs text-[#86868b]">전체 지출</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-[-0.04em]">
                  {formatAmount(expenses.reduce((sum, item) => sum + item.amount, 0))}<span className="ml-1 font-sans text-sm">원</span>
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <article key={expense.id} className="w-full rounded-2xl bg-white px-5 py-6 sm:px-7">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-base font-medium">{expense.description}</p>
                      <p className="mt-2 text-sm text-[#86868b]">{expense.date}</p>
                    </div>
                    <p className="shrink-0 font-mono text-xl font-semibold tabular-nums tracking-[-0.04em] sm:text-2xl">
                      -{formatAmount(expense.amount)}<span className="ml-1 font-sans text-sm font-medium">원</span>
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
              ))}
            </div>
            </>
          ) : (
            <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-[#86868b]">
              아직 저장된 지출 내역이 없습니다.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}