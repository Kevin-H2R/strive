-- Workout Tracker Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  age integer,
  gender text check (gender in ('male', 'female')),
  height decimal, -- in cm
  weight decimal, -- in kg
  weight_unit text default 'kg' check (weight_unit in ('kg', 'lbs')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Muscle groups table
create table if not exists public.muscle_groups (
  id serial primary key,
  name text not null unique,
  icon text
);

-- Insert default muscle groups
insert into public.muscle_groups (name, icon) values
  ('Chest', 'fitness-center'),
  ('Back', 'fitness-center'),
  ('Shoulders', 'fitness-center'),
  ('Biceps', 'fitness-center'),
  ('Triceps', 'fitness-center'),
  ('Quadriceps', 'fitness-center'),
  ('Hamstrings', 'fitness-center'),
  ('Glutes', 'fitness-center'),
  ('Calves', 'fitness-center'),
  ('Core', 'fitness-center')
on conflict (name) do nothing;

-- Exercises table
create table if not exists public.exercises (
  id serial primary key,
  name text not null,
  primary_muscle_id integer references public.muscle_groups(id),
  secondary_muscle_id integer references public.muscle_groups(id),
  is_custom boolean default false,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default exercises (chest exercises - id 1)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Barbell Bench Press', 1, 5, false),
  ('Incline Dumbbell Press', 1, 3, false),
  ('Dumbbell Flyes', 1, null, false),
  ('Cable Crossover', 1, null, false),
  ('Push-ups', 1, 5, false),
  ('Decline Bench Press', 1, 5, false)
on conflict do nothing;

-- Insert back exercises (id 2)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Pull-ups', 2, 4, false),
  ('Barbell Row', 2, 4, false),
  ('Lat Pulldown', 2, 4, false),
  ('Seated Cable Row', 2, 4, false),
  ('Dumbbell Row', 2, 4, false),
  ('T-Bar Row', 2, 4, false),
  ('Face Pulls', 2, 3, false),
  ('Deadlift', 2, 7, false)
on conflict do nothing;

-- Insert shoulder exercises (id 3)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Overhead Press', 3, 5, false),
  ('Dumbbell Shoulder Press', 3, 5, false),
  ('Lateral Raises', 3, null, false),
  ('Front Raises', 3, null, false),
  ('Rear Delt Flyes', 3, 2, false),
  ('Arnold Press', 3, 5, false),
  ('Upright Row', 3, 4, false)
on conflict do nothing;

-- Insert biceps exercises (id 4)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Barbell Curl', 4, null, false),
  ('Dumbbell Curl', 4, null, false),
  ('Hammer Curl', 4, null, false),
  ('Preacher Curl', 4, null, false),
  ('Cable Curl', 4, null, false),
  ('Incline Dumbbell Curl', 4, null, false)
on conflict do nothing;

-- Insert triceps exercises (id 5)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Tricep Pushdown', 5, null, false),
  ('Skull Crushers', 5, null, false),
  ('Close Grip Bench Press', 5, 1, false),
  ('Overhead Tricep Extension', 5, null, false),
  ('Dips', 5, 1, false),
  ('Tricep Kickbacks', 5, null, false)
on conflict do nothing;

-- Insert leg exercises (quads id 6, hams id 7, glutes id 8, calves id 9)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Barbell Squat', 6, 8, false),
  ('Leg Press', 6, 8, false),
  ('Leg Extension', 6, null, false),
  ('Front Squat', 6, 10, false),
  ('Lunges', 6, 8, false),
  ('Bulgarian Split Squat', 6, 8, false),
  ('Hack Squat', 6, 8, false),
  ('Romanian Deadlift', 7, 8, false),
  ('Lying Leg Curl', 7, null, false),
  ('Seated Leg Curl', 7, null, false),
  ('Stiff Leg Deadlift', 7, 8, false),
  ('Good Mornings', 7, 2, false),
  ('Hip Thrust', 8, 7, false),
  ('Glute Bridge', 8, 7, false),
  ('Cable Kickbacks', 8, null, false),
  ('Sumo Deadlift', 8, 6, false),
  ('Standing Calf Raise', 9, null, false),
  ('Seated Calf Raise', 9, null, false),
  ('Leg Press Calf Raise', 9, null, false)
on conflict do nothing;

-- Insert core exercises (id 10)
insert into public.exercises (name, primary_muscle_id, secondary_muscle_id, is_custom) values
  ('Plank', 10, null, false),
  ('Crunches', 10, null, false),
  ('Leg Raises', 10, null, false),
  ('Cable Woodchops', 10, null, false),
  ('Ab Wheel Rollout', 10, null, false),
  ('Russian Twists', 10, null, false),
  ('Dead Bug', 10, null, false),
  ('Mountain Climbers', 10, null, false)
on conflict do nothing;

-- Workouts table
create table if not exists public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  name text,
  started_at timestamp with time zone not null,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout sets table
create table if not exists public.workout_sets (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id integer references public.exercises(id) not null,
  set_number integer not null,
  weight decimal not null,
  reps integer not null,
  volume decimal generated always as (weight * reps) stored,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout templates table
create table if not exists public.workout_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  exercises jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Planned workouts table
create table if not exists public.planned_workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  template_id uuid references public.workout_templates(id),
  scheduled_date date not null,
  completed boolean default false,
  workout_id uuid references public.workouts(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weekly targets table
create table if not exists public.weekly_targets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  muscle_group_id integer references public.muscle_groups(id) not null,
  target_volume decimal not null,
  unique(user_id, muscle_group_id)
);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;
alter table public.workout_templates enable row level security;
alter table public.planned_workouts enable row level security;
alter table public.weekly_targets enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Exercises policies (users can see all default exercises + their custom ones)
create policy "Users can view all default exercises" on public.exercises
  for select using (is_custom = false or user_id = auth.uid());

create policy "Users can create custom exercises" on public.exercises
  for insert with check (auth.uid() = user_id and is_custom = true);

create policy "Users can update own custom exercises" on public.exercises
  for update using (auth.uid() = user_id and is_custom = true);

create policy "Users can delete own custom exercises" on public.exercises
  for delete using (auth.uid() = user_id and is_custom = true);

-- Workouts policies
create policy "Users can view own workouts" on public.workouts
  for select using (auth.uid() = user_id);

create policy "Users can create own workouts" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts" on public.workouts
  for update using (auth.uid() = user_id);

create policy "Users can delete own workouts" on public.workouts
  for delete using (auth.uid() = user_id);

-- Workout sets policies
create policy "Users can view own workout sets" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can create own workout sets" on public.workout_sets
  for insert with check (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can update own workout sets" on public.workout_sets
  for update using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can delete own workout sets" on public.workout_sets
  for delete using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

-- Workout templates policies
create policy "Users can view own templates" on public.workout_templates
  for select using (auth.uid() = user_id);

create policy "Users can create own templates" on public.workout_templates
  for insert with check (auth.uid() = user_id);

create policy "Users can update own templates" on public.workout_templates
  for update using (auth.uid() = user_id);

create policy "Users can delete own templates" on public.workout_templates
  for delete using (auth.uid() = user_id);

-- Planned workouts policies
create policy "Users can view own planned workouts" on public.planned_workouts
  for select using (auth.uid() = user_id);

create policy "Users can create own planned workouts" on public.planned_workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own planned workouts" on public.planned_workouts
  for update using (auth.uid() = user_id);

create policy "Users can delete own planned workouts" on public.planned_workouts
  for delete using (auth.uid() = user_id);

-- Weekly targets policies
create policy "Users can view own targets" on public.weekly_targets
  for select using (auth.uid() = user_id);

create policy "Users can create own targets" on public.weekly_targets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own targets" on public.weekly_targets
  for update using (auth.uid() = user_id);

create policy "Users can delete own targets" on public.weekly_targets
  for delete using (auth.uid() = user_id);

-- Muscle groups is read-only for all users
create policy "Everyone can view muscle groups" on public.muscle_groups
  for select using (true);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, weight_unit)
  values (new.id, 'kg');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes for better query performance
create index if not exists idx_workouts_user_id on public.workouts(user_id);
create index if not exists idx_workouts_started_at on public.workouts(started_at);
create index if not exists idx_workout_sets_workout_id on public.workout_sets(workout_id);
create index if not exists idx_workout_sets_exercise_id on public.workout_sets(exercise_id);
create index if not exists idx_planned_workouts_user_date on public.planned_workouts(user_id, scheduled_date);
create index if not exists idx_exercises_primary_muscle on public.exercises(primary_muscle_id);
