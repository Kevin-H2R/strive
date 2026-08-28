// Muscle contribution represents how much an exercise targets a specific muscle
// Based on EMG research, where 1.0 = primary mover, and lower values indicate secondary involvement
export interface MuscleContribution {
  muscleId: number;
  contribution: number; // 0.0 to 1.0
}

export interface Exercise {
  id: number;
  name: string;
  category: 'compound' | 'isolation';
  muscleContributions: MuscleContribution[];
}

/**
 * Get the contribution factor for a specific muscle from an exercise.
 * Returns 0 if the muscle is not targeted by this exercise.
 */
export const getMuscleContribution = (exercise: Exercise, muscleId: number): number => {
  const contribution = exercise.muscleContributions.find(
    (mc) => mc.muscleId === muscleId
  );
  return contribution?.contribution || 0;
};

/**
 * Get the primary muscle ID (highest contribution) for an exercise.
 * Useful for grouping/categorizing exercises.
 */
export const getPrimaryMuscleId = (exercise: Exercise): number | null => {
  if (exercise.muscleContributions.length === 0) return null;
  const sorted = [...exercise.muscleContributions].sort((a, b) => b.contribution - a.contribution);
  return sorted[0].muscleId;
};

/**
 * Calculate volume credit for a muscle from a set.
 * e.g., 3 sets of bench press = 3 sets for chest, ~1 set for triceps (3 * 0.25)
 */
export const calculateMuscleVolume = (
  exercise: Exercise,
  muscleId: number,
  sets: number
): number => {
  const contribution = getMuscleContribution(exercise, muscleId);
  return sets * contribution;
};

/**
 * Search exercises by name (case-insensitive)
 */
export const searchExercises = (exercises: Exercise[], query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase();
  return exercises.filter((e) => e.name.toLowerCase().includes(lowerQuery));
};

/**
 * Get exercises that target a specific muscle, sorted by contribution.
 * Optionally filter by minimum contribution threshold.
 */
export const getExercisesForMuscle = (
  exercises: Exercise[],
  muscleId: number,
  minContribution: number = 0
): Array<{ exercise: Exercise; contribution: number }> => {
  return exercises
    .map((exercise) => ({
      exercise,
      contribution: getMuscleContribution(exercise, muscleId),
    }))
    .filter((item) => item.contribution >= minContribution)
    .sort((a, b) => b.contribution - a.contribution);
};

/**
 * Group exercises by their primary muscle
 */
export const groupExercisesByMuscle = (exercises: Exercise[]): Record<number, Exercise[]> => {
  const grouped: Record<number, Exercise[]> = {};

  exercises.forEach((exercise) => {
    const primaryMuscleId = getPrimaryMuscleId(exercise);
    if (primaryMuscleId !== null) {
      if (!grouped[primaryMuscleId]) {
        grouped[primaryMuscleId] = [];
      }
      grouped[primaryMuscleId].push(exercise);
    }
  });

  return grouped;
};
