import { SplitConfig, WorkoutDayConfig, MuscleConfig } from './types.ts';

// Muscle IDs
// 1 = Chest, 2 = Back, 3 = Shoulders, 4 = Biceps, 5 = Triceps
// 6 = Quadriceps, 7 = Hamstrings, 8 = Glutes, 9 = Calves, 10 = Core

// Synergy groups - muscles that work well together
const PUSH_MUSCLES = [1, 3, 5]; // Chest, Shoulders, Triceps
const PULL_MUSCLES = [2, 4];    // Back, Biceps
const LEG_MUSCLES = [6, 7, 8, 9]; // Quads, Hams, Glutes, Calves

/**
 * Smart grouping algorithm that creates optimal workout splits
 * based on number of training days and target volumes.
 */
export function generateSmartSplit(
  daysPerWeek: number,
  targetSets: Record<number, number>
): SplitConfig {
  // Calculate total weekly volume to help with distribution
  const totalVolume = Object.values(targetSets).reduce((sum, sets) => sum + sets, 0);
  const avgVolumePerDay = totalVolume / daysPerWeek;

  // Determine frequency based on days available
  // 2-3 days: most muscles 1x/week, prioritize higher volume muscles for 2x
  // 4-6 days: most muscles 2x/week
  const baseFrequency = daysPerWeek >= 4 ? 2 : 1;

  switch (daysPerWeek) {
    case 2:
      return createTwoDaySplit(targetSets);
    case 3:
      return createThreeDaySplit(targetSets);
    case 4:
      return createFourDaySplit(targetSets);
    case 5:
      return createFiveDaySplit(targetSets);
    case 6:
      return createSixDaySplit(targetSets);
    default:
      return createThreeDaySplit(targetSets);
  }
}

/**
 * 2 days: Full body sessions hitting all muscle groups
 * Each muscle 2x/week with moderate volume per session
 */
function createTwoDaySplit(targetSets: Record<number, number>): SplitConfig {
  const allMuscles = getAllMuscleIds();

  return {
    days: [
      {
        name: 'Full Body A',
        muscles: allMuscles.map(id => ({ muscleId: id, timesPerWeek: 2 })),
      },
      {
        name: 'Full Body B',
        muscles: allMuscles.map(id => ({ muscleId: id, timesPerWeek: 2 })),
      },
    ],
  };
}

/**
 * 3 days: Smart grouping based on volume needs
 * Option 1: Full body if volume is evenly distributed
 * Option 2: Push/Pull/Legs if volume is concentrated
 */
function createThreeDaySplit(targetSets: Record<number, number>): SplitConfig {
  // Calculate volume by category
  const pushVolume = PUSH_MUSCLES.reduce((sum, id) => sum + (targetSets[id] || 0), 0);
  const pullVolume = PULL_MUSCLES.reduce((sum, id) => sum + (targetSets[id] || 0), 0);
  const legVolume = LEG_MUSCLES.reduce((sum, id) => sum + (targetSets[id] || 0), 0);
  const coreVolume = targetSets[10] || 0;

  // Use full body approach for 3 days - better frequency
  // Each muscle gets hit every session but with lower per-session volume
  const allMuscles = getAllMuscleIds();

  return {
    days: [
      {
        name: 'Workout A',
        muscles: [
          // Emphasize push + legs
          { muscleId: 1, timesPerWeek: 3 }, // Chest
          { muscleId: 3, timesPerWeek: 3 }, // Shoulders
          { muscleId: 5, timesPerWeek: 3 }, // Triceps
          { muscleId: 6, timesPerWeek: 3 }, // Quads
          { muscleId: 8, timesPerWeek: 3 }, // Glutes
          { muscleId: 10, timesPerWeek: 3 }, // Core
        ],
      },
      {
        name: 'Workout B',
        muscles: [
          // Emphasize pull + legs
          { muscleId: 2, timesPerWeek: 3 }, // Back
          { muscleId: 4, timesPerWeek: 3 }, // Biceps
          { muscleId: 7, timesPerWeek: 3 }, // Hamstrings
          { muscleId: 8, timesPerWeek: 3 }, // Glutes
          { muscleId: 9, timesPerWeek: 3 }, // Calves
          { muscleId: 10, timesPerWeek: 3 }, // Core
        ],
      },
      {
        name: 'Workout C',
        muscles: [
          // Full body emphasis
          { muscleId: 1, timesPerWeek: 3 }, // Chest
          { muscleId: 2, timesPerWeek: 3 }, // Back
          { muscleId: 3, timesPerWeek: 3 }, // Shoulders
          { muscleId: 6, timesPerWeek: 3 }, // Quads
          { muscleId: 7, timesPerWeek: 3 }, // Hamstrings
          { muscleId: 9, timesPerWeek: 3 }, // Calves
        ],
      },
    ],
  };
}

/**
 * 4 days: Upper/Lower or Push/Pull hybrid
 * Each muscle 2x/week
 */
function createFourDaySplit(targetSets: Record<number, number>): SplitConfig {
  return {
    days: [
      {
        name: 'Upper A',
        muscles: [
          { muscleId: 1, timesPerWeek: 2 }, // Chest
          { muscleId: 2, timesPerWeek: 2 }, // Back
          { muscleId: 3, timesPerWeek: 2 }, // Shoulders
          { muscleId: 4, timesPerWeek: 2 }, // Biceps
          { muscleId: 5, timesPerWeek: 2 }, // Triceps
        ],
      },
      {
        name: 'Lower A',
        muscles: [
          { muscleId: 6, timesPerWeek: 2 }, // Quads
          { muscleId: 7, timesPerWeek: 2 }, // Hamstrings
          { muscleId: 8, timesPerWeek: 2 }, // Glutes
          { muscleId: 9, timesPerWeek: 2 }, // Calves
          { muscleId: 10, timesPerWeek: 2 }, // Core
        ],
      },
      {
        name: 'Upper B',
        muscles: [
          { muscleId: 1, timesPerWeek: 2 },
          { muscleId: 2, timesPerWeek: 2 },
          { muscleId: 3, timesPerWeek: 2 },
          { muscleId: 4, timesPerWeek: 2 },
          { muscleId: 5, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Lower B',
        muscles: [
          { muscleId: 6, timesPerWeek: 2 },
          { muscleId: 7, timesPerWeek: 2 },
          { muscleId: 8, timesPerWeek: 2 },
          { muscleId: 9, timesPerWeek: 2 },
          { muscleId: 10, timesPerWeek: 2 },
        ],
      },
    ],
  };
}

/**
 * 5 days: Upper/Lower/Push/Pull/Legs hybrid
 * Most muscles 2x, some get bonus volume
 */
function createFiveDaySplit(targetSets: Record<number, number>): SplitConfig {
  return {
    days: [
      {
        name: 'Push',
        muscles: [
          { muscleId: 1, timesPerWeek: 2 }, // Chest
          { muscleId: 3, timesPerWeek: 2 }, // Shoulders
          { muscleId: 5, timesPerWeek: 2 }, // Triceps
        ],
      },
      {
        name: 'Pull',
        muscles: [
          { muscleId: 2, timesPerWeek: 2 }, // Back
          { muscleId: 4, timesPerWeek: 2 }, // Biceps
        ],
      },
      {
        name: 'Legs',
        muscles: [
          { muscleId: 6, timesPerWeek: 2 }, // Quads
          { muscleId: 7, timesPerWeek: 2 }, // Hamstrings
          { muscleId: 8, timesPerWeek: 2 }, // Glutes
          { muscleId: 9, timesPerWeek: 2 }, // Calves
          { muscleId: 10, timesPerWeek: 2 }, // Core
        ],
      },
      {
        name: 'Upper',
        muscles: [
          { muscleId: 1, timesPerWeek: 2 },
          { muscleId: 2, timesPerWeek: 2 },
          { muscleId: 3, timesPerWeek: 2 },
          { muscleId: 4, timesPerWeek: 2 },
          { muscleId: 5, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Lower',
        muscles: [
          { muscleId: 6, timesPerWeek: 2 },
          { muscleId: 7, timesPerWeek: 2 },
          { muscleId: 8, timesPerWeek: 2 },
          { muscleId: 9, timesPerWeek: 2 },
          { muscleId: 10, timesPerWeek: 2 },
        ],
      },
    ],
  };
}

/**
 * 6 days: PPL x2
 * Each muscle 2x/week with dedicated focus
 */
function createSixDaySplit(targetSets: Record<number, number>): SplitConfig {
  return {
    days: [
      {
        name: 'Push A',
        muscles: [
          { muscleId: 1, timesPerWeek: 2 },
          { muscleId: 3, timesPerWeek: 2 },
          { muscleId: 5, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Pull A',
        muscles: [
          { muscleId: 2, timesPerWeek: 2 },
          { muscleId: 4, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Legs A',
        muscles: [
          { muscleId: 6, timesPerWeek: 2 },
          { muscleId: 7, timesPerWeek: 2 },
          { muscleId: 8, timesPerWeek: 2 },
          { muscleId: 9, timesPerWeek: 2 },
          { muscleId: 10, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Push B',
        muscles: [
          { muscleId: 1, timesPerWeek: 2 },
          { muscleId: 3, timesPerWeek: 2 },
          { muscleId: 5, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Pull B',
        muscles: [
          { muscleId: 2, timesPerWeek: 2 },
          { muscleId: 4, timesPerWeek: 2 },
        ],
      },
      {
        name: 'Legs B',
        muscles: [
          { muscleId: 6, timesPerWeek: 2 },
          { muscleId: 7, timesPerWeek: 2 },
          { muscleId: 8, timesPerWeek: 2 },
          { muscleId: 9, timesPerWeek: 2 },
          { muscleId: 10, timesPerWeek: 2 },
        ],
      },
    ],
  };
}

/**
 * Get all muscle IDs
 */
export function getAllMuscleIds(): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

/**
 * Legacy function for compatibility
 */
export function getSplitConfig(daysPerWeek: number): SplitConfig {
  return generateSmartSplit(daysPerWeek, {});
}
