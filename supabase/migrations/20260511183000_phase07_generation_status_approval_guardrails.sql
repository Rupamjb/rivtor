alter table public.generations
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.generations
  drop constraint if exists generations_status_check;

alter table public.generations
  add constraint generations_status_check
  check (status in ('completed', 'approval_required', 'approved', 'rejected', 'published'));

create index if not exists generations_user_status_created_idx
  on public.generations (user_id, status, created_at desc);
