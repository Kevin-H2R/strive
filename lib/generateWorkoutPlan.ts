import { Exercise, getPrimaryMuscleId } from '@/constants/exercises';
import { MUSCLE_GROUPS } from '@/constants/muscles';

export interface TemplateExercise {
  exerciseId: number;
  exerciseName: string;
  sets: number;
  primaryMuscleId: number;
}

export interface WorkoutTemplate {
  name: string;
  exercises: TemplateExercise[];
}

export interface GeneratedPlan {
  templates: WorkoutTemplate[];
  weeklySetsByMuscle: Record<number, number>;
  warnings?: string[];
}

// Muscle groupings for different splits
const PUSH_MUSCLES = [1, 3, 5]; // Chest, Shoulders, Triceps
const PULL_MUSCLES = [2, 4];    // Back, Biceps
const LEG_MUSCLES = [6, 7, 8, 9]; // Quads, Hams, Glutes, Calves
const UPPER_MUSCLES = [1, 2, 3, 4, 5]; // Chest, Back, Shoulders, Biceps, Triceps
const LOWER_MUSCLES = [6, 7, 8, 9, 10]; // Quads, Hams, Glutes, Calves, Core

// Get exercises for a muscle, prioritizing compounds
const getExercisesForMuscle = (allExercises: Exercise[], muscleId: number): Exercise[] => {
  const primary = allExercises.filter(e => getPrimaryMuscleId(e) === muscleId);
  // Sort compounds first
  return primary.sort((a, b) => {
    if (a.category === 'compound' && b.category !== 'compound') return -1;
    if (a.category !== 'compound' && b.category === 'compound') return 1;
    return 0;
  });
};

// Calculate how many sets we need per muscle per workout
const calculateSetsDistribution = (
  targetSets: Record<number, number>,
  muscleIds: number[],
  workoutsPerWeek: number
): Record<number, number> => {
  const setsPerWorkout: Record<number, number> = {};

  muscleIds.forEach(muscleId => {
    const weeklyTarget = targetSets[muscleId] || 10;
    // Distribute across workouts, minimum 2 sets per session
    const setsPerSession = Math.max(2, Math.ceil(weeklyTarget / workoutsPerWeek));
    setsPerWorkout[muscleId] = setsPerSession;
  });

  return setsPerWorkout;
};

// Pick exercises for a muscle to hit target sets
const pickExercisesForMuscle = (
  allExercises: Exercise[],
  muscleId: number,
  targetSets: number,
  usedExercises: Set<number>
): TemplateExercise[] => {
  const exercises = getExercisesForMuscle(allExercises, muscleId);
  const result: TemplateExercise[] = [];
  let remainingSets = targetSets;

  for (const exercise of exercises) {
    if (remainingSets <= 0) break;
    if (usedExercises.has(exercise.id)) continue;

    // Assign 3-4 sets per exercise
    const setsForExercise = Math.min(remainingSets, exercise.category === 'compound' ? 4 : 3);

    result.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: setsForExercise,
      primaryMuscleId: getPrimaryMuscleId(exercise) || muscleId,
    });

    usedExercises.add(exercise.id);
    remainingSets -= setsForExercise;
  }

  return result;
};

// Generate a single workout template
const generateTemplate = (
  allExercises: Exercise[],
  name: string,
  muscleIds: number[],
  setsPerMuscle: Record<number, number>,
  usedExercises: Set<number>
): WorkoutTemplate => {
  const exercises: TemplateExercise[] = [];

  // Order muscles: larger muscle groups first
  const orderedMuscles = [...muscleIds].sort((a, b) => {
    const priority: Record<number, number> = {
      1: 1, 2: 1, 6: 1, 7: 2, 8: 2, // Chest, Back, Quads first
      3: 3, // Shoulders
      4: 4, 5: 4, // Arms
      9: 5, 10: 5, // Calves, Core
    };
    return (priority[a] || 5) - (priority[b] || 5);
  });

  orderedMuscles.forEach(muscleId => {
    const targetSets = setsPerMuscle[muscleId] || 0;
    if (targetSets > 0) {
      const muscleExercises = pickExercisesForMuscle(allExercises, muscleId, targetSets, usedExercises);
      exercises.push(...muscleExercises);
    }
  });

  return { name, exercises };
};

// Main function to generate the full workout plan
// Now accepts exercises as a parameter (fetched from DB)
export const generateWorkoutPlan = (
  exercises: Exercise[],
  daysPerWeek: number,
  targetSets: Record<number, number>
): GeneratedPlan => {
  const templates: WorkoutTemplate[] = [];
  const usedExercisesPerDay: Set<number>[] = [];

  // Initialize used exercises tracker for each day
  for (let i = 0; i < daysPerWeek; i++) {
    usedExercisesPerDay.push(new Set());
  }

  // Create exercise lookup map
  const exerciseMap = new Map<number, Exercise>();
  exercises.forEach(e => exerciseMap.set(e.id, e));

  if (daysPerWeek <= 2) {
    // Full body workouts
    const allMuscles = MUSCLE_GROUPS.map(m => m.id);
    const setsPerWorkout = calculateSetsDistribution(targetSets, allMuscles, daysPerWeek);

    for (let i = 0; i < daysPerWeek; i++) {
      templates.push(generateTemplate(
        exercises,
        `Full Body ${String.fromCharCode(65 + i)}`,
        allMuscles,
        setsPerWorkout,
        usedExercisesPerDay[i]
      ));
    }
  } else if (daysPerWeek === 3) {
    // Push/Pull/Legs
    const pushSets = calculateSetsDistribution(targetSets, PUSH_MUSCLES, 1);
    const pullSets = calculateSetsDistribution(targetSets, PULL_MUSCLES, 1);
    const legSets = calculateSetsDistribution(targetSets, [...LEG_MUSCLES, 10], 1);

    templates.push(generateTemplate(exercises, 'Push', PUSH_MUSCLES, pushSets, usedExercisesPerDay[0]));
    templates.push(generateTemplate(exercises, 'Pull', PULL_MUSCLES, pullSets, usedExercisesPerDay[1]));
    templates.push(generateTemplate(exercises, 'Legs', [...LEG_MUSCLES, 10], legSets, usedExercisesPerDay[2]));
  } else if (daysPerWeek === 4) {
    // Upper/Lower split x2
    const upperSets = calculateSetsDistribution(targetSets, UPPER_MUSCLES, 2);
    const lowerSets = calculateSetsDistribution(targetSets, LOWER_MUSCLES, 2);

    templates.push(generateTemplate(exercises, 'Upper A', UPPER_MUSCLES, upperSets, usedExercisesPerDay[0]));
    templates.push(generateTemplate(exercises, 'Lower A', LOWER_MUSCLES, lowerSets, usedExercisesPerDay[1]));
    templates.push(generateTemplate(exercises, 'Upper B', UPPER_MUSCLES, upperSets, usedExercisesPerDay[2]));
    templates.push(generateTemplate(exercises, 'Lower B', LOWER_MUSCLES, lowerSets, usedExercisesPerDay[3]));
  } else if (daysPerWeek === 5) {
    // Push/Pull/Legs/Upper/Lower
    const pushSets = calculateSetsDistribution(targetSets, PUSH_MUSCLES, 2);
    const pullSets = calculateSetsDistribution(targetSets, PULL_MUSCLES, 2);
    const legSets = calculateSetsDistribution(targetSets, [...LEG_MUSCLES, 10], 2);

    templates.push(generateTemplate(exercises, 'Push', PUSH_MUSCLES, pushSets, usedExercisesPerDay[0]));
    templates.push(generateTemplate(exercises, 'Pull', PULL_MUSCLES, pullSets, usedExercisesPerDay[1]));
    templates.push(generateTemplate(exercises, 'Legs', [...LEG_MUSCLES, 10], legSets, usedExercisesPerDay[2]));
    templates.push(generateTemplate(exercises, 'Upper', UPPER_MUSCLES, pushSets, usedExercisesPerDay[3]));
    templates.push(generateTemplate(exercises, 'Lower', LOWER_MUSCLES, legSets, usedExercisesPerDay[4]));
  } else {
    // 6 days: Push/Pull/Legs x2
    const pushSets = calculateSetsDistribution(targetSets, PUSH_MUSCLES, 2);
    const pullSets = calculateSetsDistribution(targetSets, PULL_MUSCLES, 2);
    const legSets = calculateSetsDistribution(targetSets, [...LEG_MUSCLES, 10], 2);

    templates.push(generateTemplate(exercises, 'Push A', PUSH_MUSCLES, pushSets, usedExercisesPerDay[0]));
    templates.push(generateTemplate(exercises, 'Pull A', PULL_MUSCLES, pullSets, usedExercisesPerDay[1]));
    templates.push(generateTemplate(exercises, 'Legs A', [...LEG_MUSCLES, 10], legSets, usedExercisesPerDay[2]));
    templates.push(generateTemplate(exercises, 'Push B', PUSH_MUSCLES, pushSets, usedExercisesPerDay[3]));
    templates.push(generateTemplate(exercises, 'Pull B', PULL_MUSCLES, pullSets, usedExercisesPerDay[4]));
    templates.push(generateTemplate(exercises, 'Legs B', [...LEG_MUSCLES, 10], legSets, usedExercisesPerDay[5]));
  }

  // Calculate actual weekly sets per muscle from generated templates
  // Using the new muscle contribution system for accurate volume tracking
  const weeklySetsByMuscle: Record<number, number> = {};
  MUSCLE_GROUPS.forEach(m => { weeklySetsByMuscle[m.id] = 0; });

  templates.forEach(template => {
    template.exercises.forEach(ex => {
      // Get the full exercise data to access muscle contributions
      const exercise = exerciseMap.get(ex.exerciseId);
      if (exercise) {
        // Use the new contribution system for precise volume calculation
        exercise.muscleContributions.forEach(mc => {
          const volumeCredit = ex.sets * mc.contribution;
          weeklySetsByMuscle[mc.muscleId] = (weeklySetsByMuscle[mc.muscleId] || 0) + volumeCredit;
        });
      } else {
        // Fallback for any exercises not found
        weeklySetsByMuscle[ex.primaryMuscleId] = (weeklySetsByMuscle[ex.primaryMuscleId] || 0) + ex.sets;
      }
    });
  });

  // Round the values for display
  MUSCLE_GROUPS.forEach(m => {
    weeklySetsByMuscle[m.id] = Math.round(weeklySetsByMuscle[m.id] * 10) / 10;
  });

  return { templates, weeklySetsByMuscle };
};
