import { formatAmount } from "@/lib/transactions";

type SummaryCardProps = {
  income: number;
  expense: number;
  net: number;
};

const items = [
  { key: "income", label: "총 수입" },
  { key: "expense", label: "총 지출" },
  { key: "net", label: "순수익" },
] as const;

export default function SummaryCard({ income, expense, net }: SummaryCardProps) {
  const values = { income, expense, net };

  return (
    <section className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl bg-white px-3 py-4 sm:px-5 sm:py-5">
          <p className="text-xs text-[#86868b]">{item.label}</p>
          <p
            className={`mt-2 font-mono text-sm font-semibold tabular-nums tracking-[-0.04em] sm:text-xl ${
              item.key === "income" || (item.key === "net" && net >= 0)
                ? "text-[#2563eb]"
                : item.key === "net"
                  ? "text-[#dc2626]"
                  : "text-[#1d1d1f]"
            }`}
          >
            {formatAmount(values[item.key])}
            <span className="ml-1 font-sans text-xs font-medium">원</span>
          </p>
        </article>
      ))}
    </section>
  );
}
