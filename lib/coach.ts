import { supabase } from '@/lib/supabase';

export interface CoachSet { weight: number; reps: number }
export interface CoachExercise { exercise_id: number; name: string; cue: string; sets: CoachSet[] }
export interface CoachState {
  goal: string | null;
  days_per_week: number;
  program: string | null;
  scorecard: string | null;
  notes: string | null;
  message: string | null;
  next_session: { name: string; exercises: CoachExercise[] } | null;
  updated_at: string;
}

export async function getCoachState(): Promise<CoachState | null> {
  const { data, error } = await supabase.from('coach_state').select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Takes 20-60s: Claude reads the goal, coach notes and full history.
export async function runCoach(body: { goal?: string; days_per_week?: number } = {}): Promise<CoachState> {
  const { data, error } = await supabase.functions.invoke('coach', { body });
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message);
  }
  return data;
}
