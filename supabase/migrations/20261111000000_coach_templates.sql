-- Templates written by the AI coach (replaced on each re-plan; user templates untouched)
alter table public.workout_templates add column if not exists from_coach boolean default false not null;
