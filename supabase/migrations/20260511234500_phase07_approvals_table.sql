create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  status text not null,
  note text not null default '',
  reason text not null default '',
  approved_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.approvals
  drop constraint if exists approvals_status_check;

alter table public.approvals
  add constraint approvals_status_check
  check (status in ('approved', 'rejected', 'published', 'saved_draft'));

create index if not exists approvals_user_created_idx
  on public.approvals (user_id, created_at desc);

create index if not exists approvals_generation_idx
  on public.approvals (generation_id, created_at desc);

create index if not exists approvals_status_idx
  on public.approvals (status);

alter table public.approvals enable row level security;

drop policy if exists "approvals_select_own" on public.approvals;
create policy "approvals_select_own"
  on public.approvals
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "approvals_insert_own" on public.approvals;
create policy "approvals_insert_own"
  on public.approvals
  for insert
  to authenticated
  with check (auth.uid() = user_id);
