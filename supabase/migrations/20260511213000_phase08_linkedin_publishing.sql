create extension if not exists pgcrypto;

create table if not exists public.linkedin_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  connection_status text not null default 'disconnected',
  oauth_state text,
  oauth_state_expires_at timestamptz,
  access_token text,
  access_token_expires_at timestamptz,
  linkedin_member_urn text,
  connected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.linkedin_connections
  drop constraint if exists linkedin_connections_status_check;

alter table public.linkedin_connections
  add constraint linkedin_connections_status_check
  check (connection_status in ('disconnected', 'pending', 'connected'));

create table if not exists public.linkedin_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  channel text not null default 'linkedin',
  status text not null,
  linkedin_post_urn text,
  linkedin_post_url text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.linkedin_publications
  drop constraint if exists linkedin_publications_status_check;

alter table public.linkedin_publications
  add constraint linkedin_publications_status_check
  check (status in ('published', 'failed'));

create index if not exists linkedin_connections_user_status_idx
  on public.linkedin_connections (user_id, connection_status);

create index if not exists linkedin_publications_user_created_idx
  on public.linkedin_publications (user_id, created_at desc);

create index if not exists linkedin_publications_generation_idx
  on public.linkedin_publications (generation_id, created_at desc);

alter table public.linkedin_connections enable row level security;
alter table public.linkedin_publications enable row level security;

drop policy if exists "linkedin_connections_select_own" on public.linkedin_connections;
create policy "linkedin_connections_select_own"
  on public.linkedin_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "linkedin_connections_insert_own" on public.linkedin_connections;
create policy "linkedin_connections_insert_own"
  on public.linkedin_connections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_connections_update_own" on public.linkedin_connections;
create policy "linkedin_connections_update_own"
  on public.linkedin_connections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "linkedin_publications_select_own" on public.linkedin_publications;
create policy "linkedin_publications_select_own"
  on public.linkedin_publications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "linkedin_publications_insert_own" on public.linkedin_publications;
create policy "linkedin_publications_insert_own"
  on public.linkedin_publications
  for insert
  to authenticated
  with check (auth.uid() = user_id);
