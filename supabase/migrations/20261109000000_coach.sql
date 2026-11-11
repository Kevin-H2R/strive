-- AI coach memory: one row per user
create table if not exists public.coach_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  goal text,
  days_per_week integer default 4,
  program text,
  notes text,
  message text,
  next_session jsonb,
  updated_at timestamp with time zone default now() not null
);

alter table public.coach_state enable row level security;

create policy "Users manage own coach state" on public.coach_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
