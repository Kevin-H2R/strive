import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface TemplateExercise {
  exerciseId: number;
  sets: number;
  targets?: { weight: number; reps: number }[]; // prefilled per-set values (AI coach)
  cue?: string; // coach's technique note
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  created_at: string;
}

export interface PlannedWorkout {
  id: string;
  template_id: string;
  scheduled_date: string;
  completed: boolean;
  template?: WorkoutTemplate;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('workout_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [user]);

  return { templates, loading };
}

export function useTodaysPlannedWorkout() {
  const [plannedWorkout, setPlannedWorkout] = useState<PlannedWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const fetchTodaysWorkout = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('planned_workouts')
          .select(`
            *,
            template:workout_templates(*)
          `)
          .eq('user_id', user.id)
          .eq('scheduled_date', today)
          .eq('completed', false)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          throw error;
        }

        setPlannedWorkout(data || null);
      } catch (error) {
        console.error('Error fetching today\'s workout:', error);
        setPlannedWorkout(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysWorkout();
  }, [user]);

  return { plannedWorkout, loading };
}
