import { formatMonthLabel, shiftMonth } from "@/lib/transactions";

type MonthNavigatorProps = {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
};

export default function MonthNavigator({ year, month, onChange }: MonthNavigatorProps) {
  const move = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    onChange(next.year, next.month);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label="이전 달"
        onClick={() => move(-1)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-lg text-[#1d1d1f] transition-colors hover:bg-[#eeeeec]"
      >
        ‹
      </button>
      <p className="min-w-28 text-center font-mono text-xl font-semibold tabular-nums tracking-[-0.04em]">
        {formatMonthLabel(year, month)}
      </p>
      <button
        type="button"
        aria-label="다음 달"
        onClick={() => move(1)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-lg text-[#1d1d1f] transition-colors hover:bg-[#eeeeec]"
      >
        ›
      </button>
    </div>
  );
}
