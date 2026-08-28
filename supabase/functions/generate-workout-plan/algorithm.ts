import {
  Exercise,
  TemplateExercise,
  WorkoutTemplate,
  GeneratedPlan,
  WorkoutDayConfig,
} from './types.ts';
import { generateSmartSplit, getAllMuscleIds } from './splits.ts';

// Algorithm constants
const MAX_SETS_PER_MUSCLE_PER_WORKOUT = 8; // Prevents excessive volume for any muscle in one session
const MIN_SETS_PER_MUSCLE_PER_WORKOUT = 2; // Minimum for effective stimulus
const TARGET_SETS_PER_WORKOUT = 22; // Aim for balanced workout lengths
const MIN_SETS_PER_WORKOUT = 16; // Add isolations if below this
const MAX_SETS_PER_WORKOUT = 28; // Hard cap on workout length
const VOLUME_CLAMP_MAX = 1.2; // 120% - stop adding volume when muscle reaches this
const VOLUME_CLAMP_MIN = 0.9; // 90% - try to at least hit this

// Sets per exercise by category
const COMPOUND_SETS = 4;
const ISOLATION_SETS = 3;

/**
 * Get the primary muscle ID (highest contribution) for an exercise
 */
function getPrimaryMuscleId(exercise: Exercise): number | null {
  if (!exercise.muscleContributions || exercise.muscleContributions.length === 0) {
    return null;
  }
  const sorted = [...exercise.muscleContributions].sort(
    (a, b) => b.contribution - a.contribution
  );
  return sorted[0].muscleId;
}

/**
 * Get exercises for a specific muscle, sorted by effectiveness
 * Prioritizes compounds for volume efficiency
 */
function getExercisesForMuscle(
  allExercises: Exercise[],
  muscleId: number
): Exercise[] {
  // Get exercises where this muscle is primary (highest contribution)
  const primaryExercises = allExercises.filter(
    (e) => getPrimaryMuscleId(e) === muscleId
  );

  // Sort: compounds first, then by contribution value
  return primaryExercises.sort((a, b) => {
    // Compounds before isolations
    if (a.category === 'compound' && b.category !== 'compound') return -1;
    if (a.category !== 'compound' && b.category === 'compound') return 1;

    // Higher contribution first within same category
    const aContrib = a.muscleContributions.find((mc) => mc.muscleId === muscleId)?.contribution || 0;
    const bContrib = b.muscleContributions.find((mc) => mc.muscleId === muscleId)?.contribution || 0;
    return bContrib - aContrib;
  });
}

/**
 * Calculate how much volume an exercise contributes to each muscle
 */
function calculateExerciseContributions(
  exercise: Exercise,
  sets: number
): Map<number, number> {
  const contributions = new Map<number, number>();
  for (const mc of exercise.muscleContributions) {
    contributions.set(mc.muscleId, sets * mc.contribution);
  }
  return contributions;
}

/**
 * Check if adding an exercise would exceed volume caps for any muscle
 */
function wouldExceedVolumeCaps(
  exercise: Exercise,
  sets: number,
  currentVolume: Map<number, number>,
  targetSets: Record<number, number>
): boolean {
  for (const mc of exercise.muscleContributions) {
    const current = currentVolume.get(mc.muscleId) || 0;
    const target = targetSets[mc.muscleId] || 10;
    const newVolume = current + sets * mc.contribution;

    // Only check muscles that would get significant contribution
    if (mc.contribution >= 0.25) {
      if (newVolume > target * VOLUME_CLAMP_MAX) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculate penalty score for an exercise based on how close its target muscles are to their caps
 * Higher penalty = less desirable to add
 */
function calculatePenaltyScore(
  exercise: Exercise,
  currentVolume: Map<number, number>,
  targetSets: Record<number, number>
): number {
  let penalty = 0;

  for (const mc of exercise.muscleContributions) {
    const current = currentVolume.get(mc.muscleId) || 0;
    const target = targetSets[mc.muscleId] || 10;
    const ratio = current / target;

    // Penalize exercises that would over-contribute to muscles already at/near target
    if (ratio >= VOLUME_CLAMP_MAX) {
      penalty += mc.contribution * 100; // Heavy penalty for over-target muscles
    } else if (ratio >= 1.0) {
      penalty += mc.contribution * 50; // Medium penalty for at-target muscles
    } else if (ratio >= VOLUME_CLAMP_MIN) {
      penalty += mc.contribution * 10; // Light penalty for near-target muscles
    }
  }

  return penalty;
}

/**
 * Generate exercises for a single workout day
 */
function generateWorkoutDay(
  allExercises: Exercise[],
  dayConfig: WorkoutDayConfig,
  targetSets: Record<number, number>,
  globalUsedExercises: Set<number>,
  alternateVariant: boolean
): WorkoutTemplate {
  const selectedExercises: TemplateExercise[] = [];
  const dayVolume = new Map<number, number>(); // Track volume for this day
  const dayUsedExercises = new Set<number>();
  let totalSets = 0;

  // Initialize day volume tracking
  getAllMuscleIds().forEach((id) => dayVolume.set(id, 0));

  // Calculate per-day target for each muscle on this day
  const perDayTargets = new Map<number, number>();
  for (const muscleConfig of dayConfig.muscles) {
    const weeklyTarget = targetSets[muscleConfig.muscleId] || 10;
    // Divide weekly target by times per week, capped at max per workout
    const rawPerDay = weeklyTarget / muscleConfig.timesPerWeek;
    const perDay = Math.min(rawPerDay, MAX_SETS_PER_MUSCLE_PER_WORKOUT);
    perDayTargets.set(muscleConfig.muscleId, Math.max(perDay, MIN_SETS_PER_MUSCLE_PER_WORKOUT));
  }

  // Order muscles by priority (larger muscle groups first)
  const musclePriority: Record<number, number> = {
    1: 1, 2: 1, 6: 1, // Chest, Back, Quads (primary movers)
    7: 2, 8: 2, // Hamstrings, Glutes
    3: 3, // Shoulders
    4: 4, 5: 4, // Arms
    9: 5, 10: 5, // Calves, Core
  };

  const orderedMuscles = [...dayConfig.muscles].sort(
    (a, b) => (musclePriority[a.muscleId] || 5) - (musclePriority[b.muscleId] || 5)
  );

  // First pass: Add primary exercises for each muscle group
  for (const muscleConfig of orderedMuscles) {
    const muscleId = muscleConfig.muscleId;
    const muscleTarget = perDayTargets.get(muscleId) || 4;
    const currentMuscleVolume = dayVolume.get(muscleId) || 0;
    const remainingForMuscle = muscleTarget - currentMuscleVolume;

    if (remainingForMuscle <= 0) continue;
    if (totalSets >= MAX_SETS_PER_WORKOUT) break;

    const exercises = getExercisesForMuscle(allExercises, muscleId);

    // For alternate variants, skip the first exercise to get variation
    const startIndex = alternateVariant ? 1 : 0;

    for (let i = startIndex; i < exercises.length; i++) {
      const exercise = exercises[i];

      // Skip if already used today or globally (for variation across days)
      if (dayUsedExercises.has(exercise.id)) continue;
      if (globalUsedExercises.has(exercise.id)) continue;

      const currentMuscleVolumeNow = dayVolume.get(muscleId) || 0;
      const remainingNow = muscleTarget - currentMuscleVolumeNow;
      if (remainingNow <= 1) break;

      // Determine sets for this exercise
      const baseSets = exercise.category === 'compound' ? COMPOUND_SETS : ISOLATION_SETS;
      const sets = Math.min(baseSets, Math.ceil(remainingNow));

      // Check if this would exceed caps
      if (wouldExceedVolumeCaps(exercise, sets, dayVolume, targetSets)) {
        continue;
      }

      // Check total workout size
      if (totalSets + sets > MAX_SETS_PER_WORKOUT) {
        continue;
      }

      // Add exercise
      const primaryMuscle = getPrimaryMuscleId(exercise);
      selectedExercises.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets,
        primaryMuscleId: primaryMuscle || muscleId,
      });

      // Update tracking
      const contributions = calculateExerciseContributions(exercise, sets);
      contributions.forEach((volume, mId) => {
        dayVolume.set(mId, (dayVolume.get(mId) || 0) + volume);
      });

      dayUsedExercises.add(exercise.id);
      globalUsedExercises.add(exercise.id);
      totalSets += sets;

      // Check if we have enough for this muscle now
      const newMuscleVolume = dayVolume.get(muscleId) || 0;
      if (newMuscleVolume >= muscleTarget * VOLUME_CLAMP_MIN) {
        break; // Got enough for this muscle, move to next
      }
    }
  }

  // Second pass: If workout is too short, add isolation exercises
  if (totalSets < MIN_SETS_PER_WORKOUT) {
    for (const muscleConfig of orderedMuscles) {
      if (totalSets >= TARGET_SETS_PER_WORKOUT) break;

      const muscleId = muscleConfig.muscleId;
      const exercises = getExercisesForMuscle(allExercises, muscleId);

      // Look for isolations we haven't used
      for (const exercise of exercises) {
        if (exercise.category !== 'isolation') continue;
        if (dayUsedExercises.has(exercise.id)) continue;

        const sets = ISOLATION_SETS;

        // Check penalty - prefer muscles that are under-target
        const penalty = calculatePenaltyScore(exercise, dayVolume, targetSets);
        if (penalty > 50) continue; // Skip if would over-contribute

        if (totalSets + sets > MAX_SETS_PER_WORKOUT) continue;

        const primaryMuscle = getPrimaryMuscleId(exercise);
        selectedExercises.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets,
          primaryMuscleId: primaryMuscle || muscleId,
        });

        const contributions = calculateExerciseContributions(exercise, sets);
        contributions.forEach((volume, mId) => {
          dayVolume.set(mId, (dayVolume.get(mId) || 0) + volume);
        });

        dayUsedExercises.add(exercise.id);
        globalUsedExercises.add(exercise.id);
        totalSets += sets;

        if (totalSets >= TARGET_SETS_PER_WORKOUT) break;
      }
    }
  }

  return {
    name: dayConfig.name,
    exercises: selectedExercises,
  };
}

/**
 * Main function to generate the workout plan
 */
export function generateWorkoutPlan(
  exercises: Exercise[],
  daysPerWeek: number,
  targetSets: Record<number, number>
): GeneratedPlan {
  // Use smart split that considers targets
  const splitConfig = generateSmartSplit(daysPerWeek, targetSets);
  const templates: WorkoutTemplate[] = [];
  const globalUsedExercises = new Set<number>();
  const warnings: string[] = [];

  // Generate each workout day
  splitConfig.days.forEach((dayConfig, index) => {
    // Alternate variants for A/B days
    const isAlternate = dayConfig.name.includes('B') || index >= splitConfig.days.length / 2;

    const template = generateWorkoutDay(
      exercises,
      dayConfig,
      targetSets,
      globalUsedExercises,
      isAlternate
    );
    templates.push(template);
  });

  // Calculate actual weekly volume per muscle
  const weeklySetsByMuscle: Record<number, number> = {};
  getAllMuscleIds().forEach((id) => {
    weeklySetsByMuscle[id] = 0;
  });

  // Build exercise lookup map
  const exerciseMap = new Map<number, Exercise>();
  exercises.forEach((e) => exerciseMap.set(e.id, e));

  // Sum up contributions from all templates
  templates.forEach((template) => {
    template.exercises.forEach((ex) => {
      const exercise = exerciseMap.get(ex.exerciseId);
      if (exercise) {
        exercise.muscleContributions.forEach((mc) => {
          const volumeCredit = ex.sets * mc.contribution;
          weeklySetsByMuscle[mc.muscleId] =
            (weeklySetsByMuscle[mc.muscleId] || 0) + volumeCredit;
        });
      } else {
        // Fallback
        weeklySetsByMuscle[ex.primaryMuscleId] =
          (weeklySetsByMuscle[ex.primaryMuscleId] || 0) + ex.sets;
      }
    });
  });

  // Round values for display
  getAllMuscleIds().forEach((id) => {
    weeklySetsByMuscle[id] = Math.round(weeklySetsByMuscle[id] * 10) / 10;
  });

  // Generate warnings for muscles that couldn't meet targets
  getAllMuscleIds().forEach((muscleId) => {
    const planned = weeklySetsByMuscle[muscleId];
    const target = targetSets[muscleId] || 10;

    if (planned < target * 0.7) {
      const muscleNames: Record<number, string> = {
        1: 'Chest',
        2: 'Back',
        3: 'Shoulders',
        4: 'Biceps',
        5: 'Triceps',
        6: 'Quadriceps',
        7: 'Hamstrings',
        8: 'Glutes',
        9: 'Calves',
        10: 'Core',
      };
      const name = muscleNames[muscleId] || `Muscle ${muscleId}`;
      warnings.push(
        `${name} target (${target} sets) may not be fully achievable with ${daysPerWeek}-day split (planned: ${planned.toFixed(1)} sets)`
      );
    }
  });

  return {
    templates,
    weeklySetsByMuscle,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
