"use client";

import { useState } from "react";
import TransactionItem from "@/components/TransactionItem";
import {
  formatCompactAmount,
  getCalendarCells,
  totalsByDate,
  Transaction,
} from "@/lib/transactions";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type CalendarViewProps = {
  year: number;
  month: number;
  transactions: Transaction[];
  deletingId: number | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export default function CalendarView({
  year,
  month,
  transactions,
  deletingId,
  onEdit,
  onDelete,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const cells = getCalendarCells(year, month);
  const totals = totalsByDate(transactions);
  const selectedItems = selectedDate
    ? transactions.filter((transaction) => transaction.date === selectedDate)
    : [];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((weekday) => (
          <p key={weekday} className="pb-1 text-center text-xs font-medium text-[#86868b]">
            {weekday}
          </p>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date || cell.day === null) {
            return <div key={`blank-${index}`} className="min-h-16 sm:min-h-24" />;
          }

          const dayTotals = totals.get(cell.date) ?? { income: 0, expense: 0 };
          const selected = selectedDate === cell.date;

          return (
            <button
              key={cell.date}
              type="button"
              aria-pressed={selected}
              aria-label={`${cell.date} 내역 보기`}
              onClick={() =>
                setSelectedDate((current) => (current === cell.date ? null : cell.date))
              }
              className={`min-h-16 rounded-xl px-1 py-1.5 text-left transition-colors sm:min-h-24 sm:px-2 ${
                selected ? "bg-[#eff4ff]" : "bg-white hover:bg-[#f3f3f1]"
              }`}
            >
              <span className="text-xs font-medium sm:text-sm">{cell.day}</span>
              {dayTotals.income > 0 && (
                <p className="mt-1 truncate font-mono text-[10px] font-semibold leading-tight text-[#2563eb] sm:text-xs">
                  +{formatCompactAmount(dayTotals.income)}
                </p>
              )}
              {dayTotals.expense > 0 && (
                <p className="truncate font-mono text-[10px] font-semibold leading-tight text-[#dc2626] sm:text-xs">
                  -{formatCompactAmount(dayTotals.expense)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h3 className="mb-4 text-base font-semibold tracking-[-0.02em]">
            {selectedDate.split("-").join(".")} 내역
          </h3>
          {selectedItems.length > 0 ? (
            <div className="space-y-4">
              {selectedItems.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  deletingId={deletingId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-[#86868b]">
              이 날짜의 내역이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
