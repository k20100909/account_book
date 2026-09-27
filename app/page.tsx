"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthForm from "@/components/AuthForm";
import CalendarView from "@/components/CalendarView";
import ChatPanel, { ChatMessage } from "@/components/ChatPanel";
import EntryDrawer from "@/components/EntryDrawer";
import MonthNavigator from "@/components/MonthNavigator";
import SearchBar from "@/components/SearchBar";
import SummaryCard from "@/components/SummaryCard";
import TransactionForm from "@/components/TransactionForm";
import TransactionItem from "@/components/TransactionItem";
import { AssistantTransaction } from "@/lib/assistant";
import { supabase } from "@/lib/supabase";
import { useClientToday } from "@/lib/useClientToday";
import {
  CATEGORY_OPTIONS,
  categoriesForType,
  inMonth,
  LedgerView,
  matchesFilters,
  monthFromDate,
  summarize,
  Transaction,
  TransactionType,
  TypeFilter,
} from "@/lib/transactions";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "안녕하세요. 지출이나 수입을 말해 주세요. 예를 들어 “오늘 점심 8500원”이라고 적으면 가계부에 남길게요.",
};

export default function Home() {
  const today = useClientToday();
  const todayParts = monthFromDate(today) ?? { year: 1970, month: 1 };
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("식비");
  const [date, setDate] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [view, setView] = useState<LedgerView>("list");
  const [period, setPeriod] = useState<{ year: number; month: number } | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const year = period?.year ?? todayParts.year;
  const month = period?.month ?? todayParts.month;
  const formDate = date ?? today;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const openChat = useCallback(() => {
    setMenuOpen(false);
    setChatOpen(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(data.user);
      setIsAuthLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAuthLoading(false);
      if (!nextUser) {
        setExpenses([]);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadExpenses = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) {
        setErrorMessage("지출 내역을 불러오지 못했습니다.");
      } else {
        setExpenses(data ?? []);
      }
      setIsLoading(false);
    };

    void loadExpenses();
    return () => {
      active = false;
    };
  }, [user]);

  const monthTransactions = expenses.filter((expense) => inMonth(expense, year, month));
  const summary = summarize(monthTransactions);
  const visibleTransactions = monthTransactions.filter((expense) =>
    matchesFilters(expense, {
      query,
      type: typeFilter,
      category: categoryFilter,
    }),
  );

  const changeTypeFilter = (next: TypeFilter) => {
    setTypeFilter(next);
    const allowed = categoriesForType(next).map((item) => item.value);
    if (categoryFilter !== "all" && !allowed.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTransactionType("expense");
    setCategory("식비");
    setDate(null);
    setAmount("");
    setDescription("");
    setErrorMessage("");
  };

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setErrorMessage("");

    const values = {
      date: formDate,
      amount: Number(amount),
      description: description.trim(),
      type: transactionType,
      category,
      user_id: user.id,
    };

    const queryBuilder = editingId
      ? supabase.from("expenses").update(values).eq("id", editingId).eq("user_id", user.id)
      : supabase.from("expenses").insert(values);
    const { data, error } = await queryBuilder.select().single();

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
          : [data, ...current.filter((expense) => expense.id !== data.id)],
      );
      const savedMonth = monthFromDate(data.date);
      if (savedMonth) setPeriod(savedMonth);
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
    setMenuOpen(false);
    setChatOpen(false);
    document.getElementById("expense-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteExpense = async (expense: Transaction) => {
    if (!user) return;
    const confirmed = window.confirm(`"${expense.description}" 내역을 삭제할까요?`);
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
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      if (editingId === expense.id) resetForm();
    }
    setDeletingId(null);
  };

  const saveFromAssistant = async (transactions: AssistantTransaction[]) => {
    if (!user) return;
    const rows = transactions.map((item) => ({ ...item, user_id: user.id }));
    const { data, error } = await supabase.from("expenses").insert(rows).select();
    if (error || !data) throw new Error("save");
    setExpenses((current) =>
      [...data, ...current].sort((left, right) => right.created_at.localeCompare(left.created_at)),
    );
  };

  const sendChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending || !user) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setIsSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })),
          expenses: expenses.slice(0, 60).map((item) => ({
            date: item.date,
            amount: item.amount,
            description: item.description,
            type: item.type ?? "expense",
            category: item.category,
          })),
          today,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        transactions?: AssistantTransaction[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "응답을 받지 못했습니다.");

      let reply = payload.message?.trim() || "알겠습니다.";
      if (payload.transactions?.length) {
        try {
          await saveFromAssistant(payload.transactions);
        } catch {
          reply = "내용은 이해했지만 가계부에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        }
      }
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch (error) {
      const content =
        error instanceof Error && error.message
          ? error.message
          : "지금은 답변을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
        },
      ]);
    } finally {
      setIsSending(false);
    }
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
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em]">기현이가 만든 AI 가계부</h1>
            <p className="mt-1 truncate text-sm text-[#86868b]">{user.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="relative z-30">
              <button
                type="button"
                aria-label="메뉴"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full bg-white"
              >
                <span className="block h-[2px] w-[18px] rounded-full bg-[#1d1d1f]" />
                <span className="block h-[2px] w-[18px] rounded-full bg-[#1d1d1f]" />
                <span className="block h-[2px] w-[18px] rounded-full bg-[#1d1d1f]" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  aria-label="카테고리"
                  className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl bg-white p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                >
                  <p className="px-3 pb-1 pt-2 text-xs font-medium text-[#8e8e93]">카테고리</p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openChat}
                    className="flex w-full flex-col rounded-xl px-3 py-3 text-left hover:bg-[#f3f3f1]"
                  >
                    <span className="text-sm font-semibold">AI 대화</span>
                    <span className="mt-0.5 text-xs text-[#8e8e93]">말로 지출과 수입을 기록해요</span>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="min-h-11 rounded-full bg-white px-4 text-sm font-medium"
            >
              로그아웃
            </button>
          </div>
        </header>

        <TransactionForm
          editingId={editingId}
          transactionType={transactionType}
          category={category}
          date={formDate}
          amount={amount}
          description={description}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onTypeChange={(value) => {
            setTransactionType(value);
            setCategory(CATEGORY_OPTIONS[value][0].value);
          }}
          onCategoryChange={setCategory}
          onDateChange={setDate}
          onAmountChange={setAmount}
          onDescriptionChange={setDescription}
          onSubmit={(event) => void saveExpense(event)}
          onCancel={resetForm}
        />

        <section className="mt-10">
          <h2 className="mb-4 text-base font-semibold">월별 내역</h2>
          <MonthNavigator
            year={year}
            month={month}
            onChange={(nextYear, nextMonth) => setPeriod({ year: nextYear, month: nextMonth })}
          />
          <div className="mt-4">
            <SummaryCard income={summary.income} expense={summary.expense} net={summary.net} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#f3f3f1] p-1.5">
            {([
              ["list", "목록 보기"],
              ["calendar", "캘린더 보기"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`min-h-11 rounded-xl text-sm font-medium ${
                  view === value ? "bg-white text-[#2563eb]" : "text-[#6e6e73]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <SearchBar
              query={query}
              typeFilter={typeFilter}
              categoryFilter={categoryFilter}
              onQueryChange={setQuery}
              onTypeFilterChange={changeTypeFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>
          <div className="mt-4">
            {isLoading ? (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#86868b]">
                내역을 불러오는 중...
              </p>
            ) : view === "calendar" ? (
              <CalendarView
                key={`${year}-${month}`}
                year={year}
                month={month}
                transactions={visibleTransactions}
                deletingId={deletingId}
                onEdit={startEditing}
                onDelete={(expense) => void deleteExpense(expense)}
              />
            ) : visibleTransactions.length > 0 ? (
              <div className="space-y-3">
                {visibleTransactions.map((expense) => (
                  <TransactionItem
                    key={expense.id}
                    transaction={expense}
                    deletingId={deletingId}
                    onEdit={startEditing}
                    onDelete={(item) => void deleteExpense(item)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#86868b]">
                {monthTransactions.length > 0
                  ? "조건에 맞는 내역이 없습니다."
                  : "이 달에는 저장된 내역이 없습니다."}
              </p>
            )}
          </div>
        </section>
      </div>

      {menuOpen && (
        <button type="button" aria-label="메뉴 닫기" className="fixed inset-0 z-20" onClick={closeMenu} />
      )}

      <EntryDrawer open={chatOpen} onClose={closeChat} title="AI 대화">
        {errorMessage && (
          <p role="alert" className="mx-3 mb-2 shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-4">
            {errorMessage}
          </p>
        )}
        <ChatPanel
          messages={messages}
          draft={draft}
          isSending={isSending}
          onDraftChange={setDraft}
          onSubmit={(event) => void sendChat(event)}
        />
      </EntryDrawer>
    </div>
  );
}
