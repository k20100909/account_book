-- 1. 각 내역의 주인을 저장할 칼럼을 추가합니다.
alter table public.expenses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists expenses_user_id_created_at_idx
  on public.expenses (user_id, created_at desc);

-- 2. 로그인한 사용자가 자신의 자료만 다룰 수 있게 보호합니다.
alter table public.expenses enable row level security;

drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses"
  on public.expenses for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own expenses" on public.expenses;
create policy "Users can create own expenses"
  on public.expenses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
  on public.expenses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
  on public.expenses for delete
  to authenticated
  using ((select auth.uid()) = user_id);
