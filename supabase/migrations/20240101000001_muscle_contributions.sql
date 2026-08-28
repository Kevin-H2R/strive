-- Migration: Add muscle contributions system
-- This replaces the deprecated primary_muscle_id and secondary_muscle_id columns
-- with a more flexible JSONB muscle_contributions column

-- Add new columns to exercises table
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('compound', 'isolation')) DEFAULT 'compound',
ADD COLUMN IF NOT EXISTS muscle_contributions jsonb DEFAULT '[]'::jsonb;

-- Add color column to muscle_groups (for UI)
ALTER TABLE public.muscle_groups
ADD COLUMN IF NOT EXISTS color text;

-- Update muscle group colors
UPDATE public.muscle_groups SET color = '#FF6B6B' WHERE name = 'Chest';
UPDATE public.muscle_groups SET color = '#4ECDC4' WHERE name = 'Back';
UPDATE public.muscle_groups SET color = '#45B7D1' WHERE name = 'Shoulders';
UPDATE public.muscle_groups SET color = '#96CEB4' WHERE name = 'Biceps';
UPDATE public.muscle_groups SET color = '#FFEAA7' WHERE name = 'Triceps';
UPDATE public.muscle_groups SET color = '#DDA0DD' WHERE name = 'Quadriceps';
UPDATE public.muscle_groups SET color = '#98D8C8' WHERE name = 'Hamstrings';
UPDATE public.muscle_groups SET color = '#F7DC6F' WHERE name = 'Glutes';
UPDATE public.muscle_groups SET color = '#BB8FCE' WHERE name = 'Calves';
UPDATE public.muscle_groups SET color = '#85C1E9' WHERE name = 'Core';

-- Update all exercises with muscle contributions based on EMG research
-- Format: [{"muscleId": X, "contribution": Y}, ...]

-- CHEST EXERCISES
UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 1, "contribution": 1.0}, {"muscleId": 3, "contribution": 0.35}, {"muscleId": 5, "contribution": 0.25}]'::jsonb
WHERE name = 'Barbell Bench Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 1, "contribution": 0.85}, {"muscleId": 3, "contribution": 0.45}, {"muscleId": 5, "contribution": 0.2}]'::jsonb
WHERE name = 'Incline Dumbbell Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 1, "contribution": 0.7}, {"muscleId": 3, "contribution": 0.15}]'::jsonb
WHERE name = 'Dumbbell Flyes' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 1, "contribution": 0.95}, {"muscleId": 3, "contribution": 0.15}]'::jsonb
WHERE name = 'Cable Crossover' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 1, "contribution": 0.85}, {"muscleId": 3, "contribution": 0.3}, {"muscleId": 5, "contribution": 0.3}, {"muscleId": 10, "contribution": 0.2}]'::jsonb
WHERE name = 'Push-ups' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 1, "contribution": 1.0}, {"muscleId": 3, "contribution": 0.2}, {"muscleId": 5, "contribution": 0.25}]'::jsonb
WHERE name = 'Decline Bench Press' AND is_custom = false;

-- BACK EXERCISES
UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 1.0}, {"muscleId": 4, "contribution": 0.6}, {"muscleId": 3, "contribution": 0.2}, {"muscleId": 10, "contribution": 0.15}]'::jsonb
WHERE name = 'Pull-ups' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 1.0}, {"muscleId": 4, "contribution": 0.4}, {"muscleId": 3, "contribution": 0.25}, {"muscleId": 10, "contribution": 0.2}]'::jsonb
WHERE name = 'Barbell Row' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 0.9}, {"muscleId": 4, "contribution": 0.5}, {"muscleId": 3, "contribution": 0.15}]'::jsonb
WHERE name = 'Lat Pulldown' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 0.9}, {"muscleId": 4, "contribution": 0.4}, {"muscleId": 3, "contribution": 0.2}]'::jsonb
WHERE name = 'Seated Cable Row' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 1.0}, {"muscleId": 4, "contribution": 0.4}, {"muscleId": 3, "contribution": 0.2}]'::jsonb
WHERE name = 'Dumbbell Row' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 1.0}, {"muscleId": 4, "contribution": 0.4}, {"muscleId": 3, "contribution": 0.2}, {"muscleId": 10, "contribution": 0.15}]'::jsonb
WHERE name = 'T-Bar Row' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 3, "contribution": 0.8}, {"muscleId": 2, "contribution": 0.5}]'::jsonb
WHERE name = 'Face Pulls' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 2, "contribution": 0.8}, {"muscleId": 8, "contribution": 0.7}, {"muscleId": 7, "contribution": 0.5}, {"muscleId": 6, "contribution": 0.4}, {"muscleId": 10, "contribution": 0.3}]'::jsonb
WHERE name = 'Deadlift' AND is_custom = false;

-- SHOULDER EXERCISES
UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 3, "contribution": 1.0}, {"muscleId": 5, "contribution": 0.5}, {"muscleId": 10, "contribution": 0.2}]'::jsonb
WHERE name = 'Overhead Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 3, "contribution": 1.0}, {"muscleId": 5, "contribution": 0.4}, {"muscleId": 10, "contribution": 0.15}]'::jsonb
WHERE name = 'Dumbbell Shoulder Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 3, "contribution": 1.0}]'::jsonb
WHERE name = 'Lateral Raises' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 3, "contribution": 0.9}, {"muscleId": 1, "contribution": 0.15}]'::jsonb
WHERE name = 'Front Raises' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 3, "contribution": 1.0}, {"muscleId": 2, "contribution": 0.3}]'::jsonb
WHERE name = 'Rear Delt Flyes' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 3, "contribution": 1.0}, {"muscleId": 5, "contribution": 0.35}]'::jsonb
WHERE name = 'Arnold Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 3, "contribution": 0.9}, {"muscleId": 2, "contribution": 0.4}, {"muscleId": 4, "contribution": 0.25}]'::jsonb
WHERE name = 'Upright Row' AND is_custom = false;

-- BICEPS EXERCISES
UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 4, "contribution": 1.0}]'::jsonb
WHERE name = 'Barbell Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 4, "contribution": 0.95}]'::jsonb
WHERE name = 'Dumbbell Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 4, "contribution": 0.9}]'::jsonb
WHERE name = 'Hammer Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 4, "contribution": 1.0}]'::jsonb
WHERE name = 'Preacher Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 4, "contribution": 1.0}]'::jsonb
WHERE name = 'Cable Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 4, "contribution": 1.0}]'::jsonb
WHERE name = 'Incline Dumbbell Curl' AND is_custom = false;

-- TRICEPS EXERCISES
UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 5, "contribution": 1.0}]'::jsonb
WHERE name = 'Tricep Pushdown' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 5, "contribution": 0.95}]'::jsonb
WHERE name = 'Skull Crushers' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 5, "contribution": 1.0}, {"muscleId": 1, "contribution": 0.6}, {"muscleId": 3, "contribution": 0.25}]'::jsonb
WHERE name = 'Close Grip Bench Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 5, "contribution": 1.0}]'::jsonb
WHERE name = 'Overhead Tricep Extension' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 5, "contribution": 0.9}, {"muscleId": 1, "contribution": 0.6}, {"muscleId": 3, "contribution": 0.3}]'::jsonb
WHERE name = 'Dips' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 5, "contribution": 0.85}]'::jsonb
WHERE name = 'Tricep Kickbacks' AND is_custom = false;

-- QUADRICEPS EXERCISES
UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 6, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.7}, {"muscleId": 7, "contribution": 0.15}, {"muscleId": 10, "contribution": 0.3}]'::jsonb
WHERE name = 'Barbell Squat' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 6, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.5}, {"muscleId": 7, "contribution": 0.1}]'::jsonb
WHERE name = 'Leg Press' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 6, "contribution": 1.0}]'::jsonb
WHERE name = 'Leg Extension' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 6, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.5}, {"muscleId": 10, "contribution": 0.4}, {"muscleId": 7, "contribution": 0.1}]'::jsonb
WHERE name = 'Front Squat' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 6, "contribution": 0.9}, {"muscleId": 8, "contribution": 0.7}, {"muscleId": 7, "contribution": 0.2}, {"muscleId": 10, "contribution": 0.2}]'::jsonb
WHERE name = 'Lunges' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 6, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.8}, {"muscleId": 7, "contribution": 0.2}, {"muscleId": 10, "contribution": 0.25}]'::jsonb
WHERE name = 'Bulgarian Split Squat' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 6, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.4}]'::jsonb
WHERE name = 'Hack Squat' AND is_custom = false;

-- HAMSTRINGS EXERCISES
UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 7, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.5}, {"muscleId": 2, "contribution": 0.4}]'::jsonb
WHERE name = 'Romanian Deadlift' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 7, "contribution": 1.0}]'::jsonb
WHERE name = 'Lying Leg Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 7, "contribution": 0.95}]'::jsonb
WHERE name = 'Seated Leg Curl' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 7, "contribution": 1.0}, {"muscleId": 8, "contribution": 0.5}, {"muscleId": 2, "contribution": 0.45}]'::jsonb
WHERE name = 'Stiff Leg Deadlift' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 7, "contribution": 0.9}, {"muscleId": 2, "contribution": 0.7}, {"muscleId": 8, "contribution": 0.4}]'::jsonb
WHERE name = 'Good Mornings' AND is_custom = false;

-- GLUTES EXERCISES
UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 8, "contribution": 1.0}, {"muscleId": 7, "contribution": 0.4}]'::jsonb
WHERE name = 'Hip Thrust' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 8, "contribution": 0.85}, {"muscleId": 7, "contribution": 0.3}]'::jsonb
WHERE name = 'Glute Bridge' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 8, "contribution": 0.9}]'::jsonb
WHERE name = 'Cable Kickbacks' AND is_custom = false;

UPDATE public.exercises SET
  category = 'compound',
  muscle_contributions = '[{"muscleId": 8, "contribution": 0.9}, {"muscleId": 6, "contribution": 0.6}, {"muscleId": 7, "contribution": 0.5}, {"muscleId": 2, "contribution": 0.5}]'::jsonb
WHERE name = 'Sumo Deadlift' AND is_custom = false;

-- CALVES EXERCISES
UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 9, "contribution": 1.0}]'::jsonb
WHERE name = 'Standing Calf Raise' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 9, "contribution": 0.85}]'::jsonb
WHERE name = 'Seated Calf Raise' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 9, "contribution": 0.95}]'::jsonb
WHERE name = 'Leg Press Calf Raise' AND is_custom = false;

-- CORE EXERCISES
UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 0.7}, {"muscleId": 3, "contribution": 0.15}]'::jsonb
WHERE name = 'Plank' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 1.0}]'::jsonb
WHERE name = 'Crunches' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 0.9}]'::jsonb
WHERE name = 'Leg Raises' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 0.9}, {"muscleId": 3, "contribution": 0.2}]'::jsonb
WHERE name = 'Cable Woodchops' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 1.0}, {"muscleId": 3, "contribution": 0.2}, {"muscleId": 2, "contribution": 0.15}]'::jsonb
WHERE name = 'Ab Wheel Rollout' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 0.85}]'::jsonb
WHERE name = 'Russian Twists' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 0.75}]'::jsonb
WHERE name = 'Dead Bug' AND is_custom = false;

UPDATE public.exercises SET
  category = 'isolation',
  muscle_contributions = '[{"muscleId": 10, "contribution": 0.7}, {"muscleId": 3, "contribution": 0.2}, {"muscleId": 6, "contribution": 0.2}]'::jsonb
WHERE name = 'Mountain Climbers' AND is_custom = false;

-- Set default contributions for any custom exercises (using old primary/secondary system)
UPDATE public.exercises
SET muscle_contributions = jsonb_build_array(
  jsonb_build_object('muscleId', primary_muscle_id, 'contribution', 1.0)
) || CASE
  WHEN secondary_muscle_id IS NOT NULL
  THEN jsonb_build_array(jsonb_build_object('muscleId', secondary_muscle_id, 'contribution', 0.5))
  ELSE '[]'::jsonb
END
WHERE is_custom = true AND muscle_contributions = '[]'::jsonb;

-- Create index for better query performance on muscle contributions
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_contributions ON public.exercises USING GIN (muscle_contributions);

-- Note: We keep primary_muscle_id and secondary_muscle_id for backwards compatibility
-- but they are now deprecated. New code should use muscle_contributions instead.
-- These columns can be dropped in a future migration once all code is updated.
