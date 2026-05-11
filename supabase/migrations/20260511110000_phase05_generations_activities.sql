create extension if not exists pgcrypto;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_type text not null,
  status text not null default 'completed',
  content text not null,
  output_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.generations
  add column if not exists status text not null default 'completed';

alter table public.generations
  add column if not exists content text not null default '';

alter table public.generations
  add column if not exists output_json jsonb not null default '{}'::jsonb;

alter table public.activities
  add column if not exists event_type text not null default 'activity';

alter table public.activities
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

create index if not exists generations_agent_type_idx
  on public.generations (agent_type);

create index if not exists activities_user_created_idx
  on public.activities (user_id, created_at desc);

create index if not exists activities_event_type_idx
  on public.activities (event_type);

alter table public.generations enable row level security;
alter table public.activities enable row level security;

drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own"
  on public.generations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "generations_insert_own" on public.generations;
create policy "generations_insert_own"
  on public.generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own"
  on public.activities
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own"
  on public.activities
  for insert
  to authenticated
  with check (auth.uid() = user_id);
