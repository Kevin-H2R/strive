import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentWeekRange, getWeekRangeForDate, getLastNWeeks } from '@/lib/utils';
import { Exercise, MuscleContribution } from '@/constants/exercises';

export interface WorkoutWithSets {
  id: string;
  name: string | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  workout_sets: {
    id: string;
    exercise_id: number;
    set_number: number;
    weight: number;
    reps: number;
    volume: number;
  }[];
}

// Helper to transform DB exercise row to Exercise interface
const transformExercise = (row: any): Exercise => ({
  id: row.id,
  name: row.name,
  category: row.category || 'compound',
  muscleContributions: (row.muscle_contributions || []) as MuscleContribution[],
});

// Fetch all exercises and create a lookup map
async function fetchExerciseMap(): Promise<Map<number, Exercise>> {
  const { data } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_contributions');

  const map = new Map<number, Exercise>();
  if (data) {
    data.forEach((row) => {
      map.set(row.id, transformExercise(row));
    });
  }
  return map;
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutWithSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_sets (*)
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setWorkouts(data || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return { workouts, loading, error, refetch: fetchWorkouts };
}

export function useWeeklyWorkouts(weekDate?: Date) {
  const [workouts, setWorkouts] = useState<WorkoutWithSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useAuthStore((state) => state.user);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const fetchWeeklyWorkouts = async () => {
      if (!user) return;

      setLoading(true);
      const { start, end } = weekDate ? getWeekRangeForDate(weekDate) : getCurrentWeekRange();

      const { data } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_sets (*)
        `)
        .eq('user_id', user.id)
        .gte('started_at', start.toISOString())
        .lte('started_at', end.toISOString())
        .not('completed_at', 'is', null);

      setWorkouts(data || []);
      setLoading(false);
    };

    fetchWeeklyWorkouts();
  }, [user, refreshKey, weekDate?.getTime()]);

  return { workouts, loading, refetch };
}

export function useVolumeHistory(weeks: number = 8) {
  const [history, setHistory] = useState<{ week: string; volume: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchVolumeHistory = async () => {
      if (!user) return;

      const weekRanges = getLastNWeeks(weeks);
      const historyData: { week: string; volume: number }[] = [];

      for (const { start, end, label } of weekRanges) {
        const { data } = await supabase
          .from('workouts')
          .select(`
            workout_sets (volume)
          `)
          .eq('user_id', user.id)
          .gte('started_at', start.toISOString())
          .lte('started_at', end.toISOString())
          .not('completed_at', 'is', null);

        const weekVolume =
          data?.reduce((total, workout) => {
            const workoutVolume = (workout.workout_sets as any[])?.reduce(
              (sum, set) => sum + (set.volume || 0),
              0
            );
            return total + (workoutVolume || 0);
          }, 0) || 0;

        historyData.push({ week: label, volume: weekVolume });
      }

      setHistory(historyData);
      setLoading(false);
    };

    fetchVolumeHistory();
  }, [user, weeks]);

  return { history, loading };
}

export function useMuscleVolumeHistory(weeks: number = 8) {
  const [history, setHistory] = useState<Record<number, { week: string; volume: number }[]>>({});
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchMuscleVolumeHistory = async () => {
      if (!user) return;

      // First fetch all exercises to get muscle contributions
      const exerciseMap = await fetchExerciseMap();

      const weekRanges = getLastNWeeks(weeks);
      const muscleHistory: Record<number, { week: string; volume: number }[]> = {};

      // Initialize all muscle groups
      for (let muscleId = 1; muscleId <= 10; muscleId++) {
        muscleHistory[muscleId] = [];
      }

      for (const { start, end, label } of weekRanges) {
        const { data } = await supabase
          .from('workouts')
          .select(`
            workout_sets (exercise_id, volume)
          `)
          .eq('user_id', user.id)
          .gte('started_at', start.toISOString())
          .lte('started_at', end.toISOString())
          .not('completed_at', 'is', null);

        // Calculate volume per muscle for this week
        const weekMuscleVolumes: Record<number, number> = {};
        for (let muscleId = 1; muscleId <= 10; muscleId++) {
          weekMuscleVolumes[muscleId] = 0;
        }

        data?.forEach((workout) => {
          (workout.workout_sets as any[])?.forEach((set) => {
            const exercise = exerciseMap.get(set.exercise_id);
            if (!exercise) return;

            const setVolume = set.volume || 0;

            // Use the new muscle contribution system
            exercise.muscleContributions.forEach((mc) => {
              weekMuscleVolumes[mc.muscleId] =
                (weekMuscleVolumes[mc.muscleId] || 0) + setVolume * mc.contribution;
            });
          });
        });

        // Add this week's data to each muscle's history
        for (let muscleId = 1; muscleId <= 10; muscleId++) {
          muscleHistory[muscleId].push({
            week: label,
            volume: Math.round(weekMuscleVolumes[muscleId]),
          });
        }
      }

      setHistory(muscleHistory);
      setLoading(false);
    };

    fetchMuscleVolumeHistory();
  }, [user, weeks]);

  return { history, loading };
}

export async function saveWorkout(
  userId: string,
  workout: {
    name: string;
    startedAt: Date;
    notes?: string;
    exercises: {
      exerciseId: number;
      sets: { weight: number; reps: number }[];
    }[];
  }
) {
  const { data: workoutData, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name: workout.name,
      started_at: workout.startedAt.toISOString(),
      completed_at: new Date().toISOString(),
      notes: workout.notes || null,
    })
    .select()
    .single();

  if (workoutError || !workoutData) {
    throw new Error(workoutError?.message || 'Failed to save workout');
  }

  const sets = workout.exercises.flatMap((exercise) =>
    exercise.sets.map((set, index) => ({
      workout_id: workoutData.id,
      exercise_id: exercise.exerciseId,
      set_number: index + 1,
      weight: set.weight,
      reps: set.reps,
    }))
  );

  if (sets.length > 0) {
    const { error: setsError } = await supabase.from('workout_sets').insert(sets);

    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  return workoutData;
}
