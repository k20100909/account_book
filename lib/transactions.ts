export type TransactionType = "expense" | "income";
export type TypeFilter = "all" | TransactionType;
export type LedgerView = "list" | "calendar";

export type Transaction = {
  id: number;
  created_at: string;
  date: string;
  amount: number;
  description: string;
  type?: TransactionType | null;
  category?: string | null;
  user_id?: string | null;
};

export const CATEGORY_OPTIONS = {
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

const UNCATEGORIZED = { value: "미분류", emoji: "🏷️" };

export const FILTER_CATEGORIES = [
  ...CATEGORY_OPTIONS.expense,
  ...CATEGORY_OPTIONS.income.filter((item) => item.value !== "기타"),
  UNCATEGORIZED,
];

export const getCategoryInfo = (category?: string | null) =>
  [...CATEGORY_OPTIONS.expense, ...CATEGORY_OPTIONS.income].find(
    (item) => item.value === category,
  ) ?? UNCATEGORIZED;

export const categoriesForType = (type: TypeFilter) => {
  if (type === "expense") return [...CATEGORY_OPTIONS.expense, UNCATEGORIZED];
  if (type === "income") return [...CATEGORY_OPTIONS.income, UNCATEGORIZED];
  return FILTER_CATEGORIES;
};

export const formatAmount = (amount: number) =>
  new Intl.NumberFormat("ko-KR").format(amount);

export const formatCompactAmount = (amount: number) => {
  if (Math.abs(amount) < 10000) return formatAmount(amount);
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
};

export const isIncome = (transaction: Transaction) =>
  transaction.type === "income";

export const padMonth = (month: number) => String(month).padStart(2, "0");

export const formatMonthLabel = (year: number, month: number) =>
  `${year}.${padMonth(month)}`;

export const shiftMonth = (year: number, month: number, delta: number) => {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
};

export const monthFromDate = (date: string) => {
  const [year, month] = date.split("-").map(Number);
  if (!year || !month) return null;
  return { year, month };
};

export const inMonth = (transaction: Transaction, year: number, month: number) =>
  transaction.date.startsWith(`${year}-${padMonth(month)}-`);

export const matchesFilters = (
  transaction: Transaction,
  filters: { query: string; type: TypeFilter; category: string },
) => {
  const query = filters.query.trim().toLowerCase();
  if (query && !transaction.description.toLowerCase().includes(query)) {
    return false;
  }
  if (filters.type === "income" && !isIncome(transaction)) return false;
  if (filters.type === "expense" && isIncome(transaction)) return false;
  if (
    filters.category !== "all" &&
    getCategoryInfo(transaction.category).value !== filters.category
  ) {
    return false;
  }
  return true;
};

export const summarize = (transactions: Transaction[]) => {
  const income = transactions
    .filter(isIncome)
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions
    .filter((item) => !isIncome(item))
    .reduce((sum, item) => sum + item.amount, 0);
  return { income, expense, net: income - expense };
};

export const getCalendarCells = (year: number, month: number) => {
  const leadingBlanks = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { date: string | null; day: number | null }[] = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push({ date: null, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: `${year}-${padMonth(month)}-${String(day).padStart(2, "0")}`,
      day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null });
  }

  return cells;
};

export const totalsByDate = (transactions: Transaction[]) => {
  const totals = new Map<string, { income: number; expense: number }>();

  for (const transaction of transactions) {
    const current = totals.get(transaction.date) ?? { income: 0, expense: 0 };
    if (isIncome(transaction)) current.income += transaction.amount;
    else current.expense += transaction.amount;
    totals.set(transaction.date, current);
  }

  return totals;
};
