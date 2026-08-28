import { useState, useEffect, useMemo, useCallback } from 'react';
import { Exercise, MuscleContribution, groupExercisesByMuscle } from '@/constants/exercises';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// Transform database row to Exercise interface
const transformExercise = (row: any): Exercise => ({
  id: row.id,
  name: row.name,
  category: row.category || 'compound',
  muscleContributions: (row.muscle_contributions || []) as MuscleContribution[],
});

export function useExercises(searchQuery: string = '') {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all exercises (default + user's custom)
      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('id, name, category, muscle_contributions, is_custom')
        .or(`is_custom.eq.false,user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setExercises(data.map(transformExercise));
      }
    } catch (err: any) {
      console.error('Error fetching exercises:', err);
      setError(err.message || 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return exercises;
    }

    const query = searchQuery.toLowerCase();
    return exercises.filter((e) => e.name.toLowerCase().includes(query));
  }, [exercises, searchQuery]);

  const exercisesByMuscle = useMemo(() => {
    return groupExercisesByMuscle(filteredExercises);
  }, [filteredExercises]);

  return {
    exercises: filteredExercises,
    allExercises: exercises,
    exercisesByMuscle,
    loading,
    error,
    refetch: fetchExercises,
  };
}

// Hook to get a single exercise by ID
export function useExercise(exerciseId: number | null) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseId === null) {
      setExercise(null);
      return;
    }

    const fetchExercise = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, muscle_contributions')
        .eq('id', exerciseId)
        .single();

      if (data && !error) {
        setExercise(transformExercise(data));
      }
      setLoading(false);
    };

    fetchExercise();
  }, [exerciseId]);

  return { exercise, loading };
}

// Create a custom exercise
export async function createCustomExercise(
  userId: string,
  name: string,
  category: 'compound' | 'isolation',
  muscleContributions: MuscleContribution[]
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name,
      category,
      muscle_contributions: muscleContributions,
      is_custom: true,
      user_id: userId,
    })
    .select('id, name, category, muscle_contributions')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return transformExercise(data);
}

// Get exercise by ID (simple fetch, useful for one-off lookups)
export async function getExerciseById(exerciseId: number): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_contributions')
    .eq('id', exerciseId)
    .single();

  if (error || !data) {
    return null;
  }

  return transformExercise(data);
}
