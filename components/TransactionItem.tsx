import {
  formatAmount,
  getCategoryInfo,
  isIncome,
  Transaction,
} from "@/lib/transactions";

type TransactionItemProps = {
  transaction: Transaction;
  deletingId: number | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export default function TransactionItem({
  transaction,
  deletingId,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const categoryInfo = getCategoryInfo(transaction.category);
  const income = isIncome(transaction);

  return (
    <article className="w-full rounded-2xl bg-white px-5 py-6 sm:px-7">
      <div className="flex items-center justify-between gap-5">
        <div>
          <p className="text-base font-medium">{transaction.description}</p>
          <p className="mt-2 text-sm text-[#86868b]">{transaction.date}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f3f3f1] px-2.5 py-1 text-xs font-medium text-[#6e6e73]">
            <span aria-hidden="true">{categoryInfo.emoji}</span>
            {categoryInfo.value}
          </span>
        </div>
        <p className={`shrink-0 font-mono text-xl font-semibold tabular-nums tracking-[-0.04em] sm:text-2xl ${income ? "text-[#2563eb]" : ""}`}>
          {income ? "+" : "-"}
          {formatAmount(transaction.amount)}
          <span className="ml-1 font-sans text-sm font-medium">원</span>
        </p>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="min-h-11 flex-1 rounded-xl bg-[#f3f3f1] px-4 text-sm font-medium transition-colors hover:bg-[#e8e8e5]"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          disabled={deletingId === transaction.id}
          className="min-h-11 flex-1 rounded-xl bg-[#f3f3f1] px-4 text-sm font-medium transition-colors hover:bg-[#e8e8e5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingId === transaction.id ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </article>
  );
}
