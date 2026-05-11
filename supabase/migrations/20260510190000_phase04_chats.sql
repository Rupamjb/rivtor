create extension if not exists pgcrypto;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  response text not null,
  agent_type text not null default 'executive',
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.chats
  add column if not exists query text not null default '';

alter table public.chats
  add column if not exists response text not null default '';

alter table public.chats
  add column if not exists agent_type text not null default 'executive';

alter table public.chats
  add column if not exists citations jsonb not null default '[]'::jsonb;

create index if not exists chats_user_created_idx
  on public.chats (user_id, created_at desc);

create index if not exists chats_agent_type_idx
  on public.chats (agent_type);

alter table public.chats enable row level security;

drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own"
  on public.chats
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chats_insert_own" on public.chats;
create policy "chats_insert_own"
  on public.chats
  for insert
  to authenticated
  with check (auth.uid() = user_id);
