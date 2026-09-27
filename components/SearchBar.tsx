import { categoriesForType, TypeFilter } from "@/lib/transactions";

type SearchBarProps = {
  query: string;
  typeFilter: TypeFilter;
  categoryFilter: string;
  onQueryChange: (value: string) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onCategoryFilterChange: (value: string) => void;
};

export default function SearchBar({
  query,
  typeFilter,
  categoryFilter,
  onQueryChange,
  onTypeFilterChange,
  onCategoryFilterChange,
}: SearchBarProps) {
  const categories = categoriesForType(typeFilter);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="내용으로 검색"
        aria-label="내용 검색"
        className="field"
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          aria-label="유형"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
          className="field cursor-pointer appearance-none"
        >
          <option value="all">전체</option>
          <option value="income">수입</option>
          <option value="expense">지출</option>
        </select>
        <select
          aria-label="카테고리"
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          className="field cursor-pointer appearance-none"
        >
          <option value="all">전체 카테고리</option>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji} {option.value}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
