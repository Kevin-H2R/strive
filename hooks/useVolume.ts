import { useMemo } from 'react';
import { useWeeklyWorkouts, WorkoutWithSets } from './useWorkouts';
import { useExercises } from './useExercises';
import { Exercise } from '@/constants/exercises';
import { MUSCLE_GROUPS } from '@/constants/muscles';
import { useSettingsStore } from '@/stores/settingsStore';

export interface MuscleVolume {
  muscleId: number;
  muscleName: string;
  volume: number;
  sets: number; // Effective sets based on contribution (e.g., 3 bench press sets = 3 chest sets, ~0.75 tricep sets)
  targetSets: number;
  percentage: number;
  color: string;
}

export function useWeeklyVolume(weekDate?: Date) {
  const { workouts, loading: workoutsLoading, refetch } = useWeeklyWorkouts(weekDate);
  const { allExercises, loading: exercisesLoading } = useExercises();
  const weeklySetTargets = useSettingsStore((state) => state.weeklySetTargets);

  // Create a lookup map for exercises
  const exerciseMap = useMemo(() => {
    const map = new Map<number, Exercise>();
    allExercises.forEach((ex) => map.set(ex.id, ex));
    return map;
  }, [allExercises]);

  const { volumeByMuscle, setsByMuscle } = useMemo(() => {
    const volumes: Record<number, number> = {};
    const sets: Record<number, number> = {};

    workouts.forEach((workout) => {
      workout.workout_sets.forEach((set) => {
        const exercise = exerciseMap.get(set.exercise_id);
        if (!exercise) return;

        const setVolume = set.volume || set.weight * set.reps;

        // Use the new muscle contribution system for accurate tracking
        exercise.muscleContributions.forEach((mc) => {
          // Volume is weighted by contribution
          volumes[mc.muscleId] = (volumes[mc.muscleId] || 0) + setVolume * mc.contribution;
          // Sets are also weighted by contribution (effective sets)
          sets[mc.muscleId] = (sets[mc.muscleId] || 0) + mc.contribution;
        });
      });
    });

    return { volumeByMuscle: volumes, setsByMuscle: sets };
  }, [workouts, exerciseMap]);

  const muscleVolumes: MuscleVolume[] = useMemo(() => {
    return MUSCLE_GROUPS.map((muscle) => {
      const volume = volumeByMuscle[muscle.id] || 0;
      // Round effective sets to 1 decimal place for display
      const sets = Math.round((setsByMuscle[muscle.id] || 0) * 10) / 10;
      const targetSets = weeklySetTargets[muscle.id] || 10;
      const percentage = targetSets > 0 ? Math.min((sets / targetSets) * 100, 100) : 0;

      return {
        muscleId: muscle.id,
        muscleName: muscle.name,
        volume: Math.round(volume),
        sets,
        targetSets,
        percentage,
        color: muscle.color,
      };
    });
  }, [volumeByMuscle, setsByMuscle, weeklySetTargets]);

  const totalVolume = useMemo(() => {
    return Object.values(volumeByMuscle).reduce((sum, v) => sum + v, 0);
  }, [volumeByMuscle]);

  const totalSets = useMemo(() => {
    return workouts.reduce((sum, w) => sum + w.workout_sets.length, 0);
  }, [workouts]);

  const workoutCount = workouts.length;

  return {
    muscleVolumes,
    totalVolume,
    totalSets,
    workoutCount,
    loading: workoutsLoading || exercisesLoading,
    refetch,
  };
}

export function calculateWorkoutVolume(
  workout: WorkoutWithSets,
  exerciseMap: Map<number, Exercise>
) {
  const volumeByMuscle: Record<number, number> = {};
  const setsByMuscle: Record<number, number> = {};

  workout.workout_sets.forEach((set) => {
    const exercise = exerciseMap.get(set.exercise_id);
    if (!exercise) return;

    const setVolume = set.volume || set.weight * set.reps;

    // Use the new muscle contribution system
    exercise.muscleContributions.forEach((mc) => {
      volumeByMuscle[mc.muscleId] = (volumeByMuscle[mc.muscleId] || 0) + setVolume * mc.contribution;
      setsByMuscle[mc.muscleId] = (setsByMuscle[mc.muscleId] || 0) + mc.contribution;
    });
  });

  const total = workout.workout_sets.reduce(
    (sum, set) => sum + (set.volume || set.weight * set.reps),
    0
  );

  return { volumeByMuscle, setsByMuscle, total };
}
