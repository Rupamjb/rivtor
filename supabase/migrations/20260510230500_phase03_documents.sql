create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  source_label text not null default 'Founder Notes',
  extracted_text text not null,
  vector_id text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.documents
  add column if not exists source_label text not null default 'Founder Notes';

alter table public.documents
  add column if not exists extracted_text text not null default '';

alter table public.documents
  add column if not exists vector_id text not null default '';

create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);

create index if not exists documents_vector_id_idx
  on public.documents (vector_id);

create index if not exists documents_source_label_idx
  on public.documents (source_label);

alter table public.documents enable row level security;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
  on public.documents
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents
  for insert
  to authenticated
  with check (auth.uid() = user_id);
