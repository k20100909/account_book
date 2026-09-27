import { FormEvent } from "react";
import { CATEGORY_OPTIONS, formatAmount, TransactionType } from "@/lib/transactions";

type TransactionFormProps = {
  editingId: number | null;
  transactionType: TransactionType;
  category: string;
  date: string;
  amount: string;
  description: string;
  isSaving: boolean;
  errorMessage: string;
  onTypeChange: (type: TransactionType) => void;
  onCategoryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  className?: string;
};

export default function TransactionForm({
  editingId,
  transactionType,
  category,
  date,
  amount,
  description,
  isSaving,
  errorMessage,
  onTypeChange,
  onCategoryChange,
  onDateChange,
  onAmountChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
  className = "mt-10 w-full rounded-3xl bg-white p-6 sm:p-10",
}: TransactionFormProps) {
  return (
    <section id="expense-form" className={className}>
      <form onSubmit={onSubmit} className="space-y-8">
        {editingId && (
          <div className="flex items-center justify-between rounded-2xl bg-[#eff4ff] px-4 py-3">
            <p className="text-sm font-medium text-[#2563eb]">내역을 수정하고 있어요</p>
            <button type="button" onClick={onCancel} className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#6e6e73] transition-colors hover:bg-[#f7f7f5]">
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
                onClick={() => onTypeChange(value)}
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
            onChange={(event) => onCategoryChange(event.target.value)}
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
          <input id="date" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} required className="field" />
        </div>

        <div>
          <label htmlFor="amount" className="mb-3 block text-base font-semibold">금액</label>
          <div className="relative">
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amount ? formatAmount(Number(amount)) : ""}
              onChange={(event) => onAmountChange(event.target.value.replace(/\D/g, ""))}
              placeholder="0"
              required
              className="field pr-14 font-mono text-lg font-semibold tabular-nums"
            />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#86868b]">원</span>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-3 block text-base font-semibold">내용</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="어디에 사용했나요?"
            required
            className="field"
          />
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
  );
}
