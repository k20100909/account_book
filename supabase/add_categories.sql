-- 기존 자료는 지출로 유지하고, 카테고리가 없으면 앱에서 '미분류'로 표시합니다.
alter table public.expenses
  add column if not exists type text not null default 'expense',
  add column if not exists category text;
