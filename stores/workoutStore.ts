import { create } from 'zustand';
import { Exercise, getPrimaryMuscleId } from '@/constants/exercises';
import { WorkoutTemplate, TemplateExercise } from '@/hooks/useTemplates';
import { supabase } from '@/lib/supabase';

export interface WorkoutSet {
  id: string;
  exerciseId: number;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseEntry {
  exerciseId: number;
  exercise: Exercise;
  sets: WorkoutSet[];
}

interface ActiveWorkout {
  id: string;
  name: string;
  startedAt: Date;
  exercises: ExerciseEntry[];
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  startWorkout: (name?: string, date?: Date) => void;
  startWorkoutFromTemplate: (template: WorkoutTemplate, exercises: Exercise[]) => void;
  setWorkoutDate: (date: Date) => void;
  endWorkout: () => ActiveWorkout | null;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: number) => void;
  addSet: (exerciseId: number) => void;
  updateSet: (exerciseId: number, setId: string, weight: number, reps: number) => void;
  completeSet: (exerciseId: number, setId: string) => void;
  removeSet: (exerciseId: number, setId: string) => void;
  getTotalVolume: () => number;
  getVolumeByMuscle: () => Record<number, number>;
  getSetsByMuscle: () => Record<number, number>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,

  startWorkout: (name?: string, date?: Date) => {
    const workoutDate = date || new Date();
    set({
      activeWorkout: {
        id: generateId(),
        name: name || `Workout ${workoutDate.toLocaleDateString()}`,
        startedAt: workoutDate,
        exercises: [],
      },
    });
  },

  startWorkoutFromTemplate: (template: WorkoutTemplate, exercises: Exercise[]) => {
    const workoutDate = new Date();
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    // Create exercise entries from template
    const exerciseEntries: ExerciseEntry[] = template.exercises
      .filter((te) => exerciseMap.has(te.exerciseId))
      .map((te) => {
        const exercise = exerciseMap.get(te.exerciseId)!;
        // Create the specified number of sets
        const sets: WorkoutSet[] = Array.from({ length: te.sets }, (_, i) => ({
          id: generateId(),
          exerciseId: te.exerciseId,
          setNumber: i + 1,
          // Coach prescription; extra sets added by hand repeat the last target.
          weight: (te.targets?.[i] ?? te.targets?.at(-1))?.weight ?? 0,
          reps: (te.targets?.[i] ?? te.targets?.at(-1))?.reps ?? 0,
          completed: false,
        }));

        return {
          exerciseId: te.exerciseId,
          exercise,
          sets,
        };
      });

    set({
      activeWorkout: {
        id: generateId(),
        name: template.name,
        startedAt: workoutDate,
        exercises: exerciseEntries,
      },
    });
    prefillFromHistory(
      template.exercises.filter((te) => !te.targets?.length).map((te) => te.exerciseId),
      set
    );
  },

  setWorkoutDate: (date: Date) => {
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          startedAt: date,
          name: `Workout ${date.toLocaleDateString()}`,
        },
      };
    });
  },

  endWorkout: () => {
    const workout = get().activeWorkout;
    set({ activeWorkout: null });
    return workout;
  },

  // Now accepts an Exercise object directly (fetched from DB)
  addExercise: (exercise: Exercise) => {
    set((state) => {
      if (!state.activeWorkout) return state;

      // Check if exercise already exists
      if (state.activeWorkout.exercises.some((e) => e.exerciseId === exercise.id)) {
        return state;
      }

      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: [
            ...state.activeWorkout.exercises,
            {
              exerciseId: exercise.id,
              exercise,
              sets: [
                {
                  id: generateId(),
                  exerciseId: exercise.id,
                  setNumber: 1,
                  weight: 0,
                  reps: 0,
                  completed: false,
                },
              ],
            },
          ],
        },
      };
    });
    prefillFromHistory([exercise.id], set);
  },

  removeExercise: (exerciseId: number) => {
    set((state) => {
      if (!state.activeWorkout) return state;

      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.filter(
            (e) => e.exerciseId !== exerciseId
          ),
        },
      };
    });
  },

  addSet: (exerciseId: number) => {
    set((state) => {
      if (!state.activeWorkout) return state;

      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((entry) => {
            if (entry.exerciseId !== exerciseId) return entry;

            const lastSet = entry.sets[entry.sets.length - 1];
            return {
              ...entry,
              sets: [
                ...entry.sets,
                {
                  id: generateId(),
                  exerciseId,
                  setNumber: entry.sets.length + 1,
                  weight: lastSet?.weight || 0,
                  reps: lastSet?.reps || 0,
                  completed: false,
                },
              ],
            };
          }),
        },
      };
    });
  },

  updateSet: (exerciseId: number, setId: string, weight: number, reps: number) => {
    set((state) => {
      if (!state.activeWorkout) return state;

      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((entry) => {
            if (entry.exerciseId !== exerciseId) return entry;

            return {
              ...entry,
              sets: entry.sets.map((s) =>
                s.id === setId ? { ...s, weight, reps } : s
              ),
            };
          }),
        },
      };
    });
  },

  completeSet: (exerciseId: number, setId: string) => {
    set((state) => {
      if (!state.activeWorkout) return state;

      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((entry) => {
            if (entry.exerciseId !== exerciseId) return entry;

            return {
              ...entry,
              sets: entry.sets.map((s) =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              ),
            };
          }),
        },
      };
    });
  },

  removeSet: (exerciseId: number, setId: string) => {
    set((state) => {
      if (!state.activeWorkout) return state;

      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((entry) => {
            if (entry.exerciseId !== exerciseId) return entry;

            const filteredSets = entry.sets.filter((s) => s.id !== setId);
            return {
              ...entry,
              sets: filteredSets.map((s, i) => ({ ...s, setNumber: i + 1 })),
            };
          }),
        },
      };
    });
  },

  getTotalVolume: () => {
    const workout = get().activeWorkout;
    if (!workout) return 0;

    return workout.exercises.reduce((total, entry) => {
      const exerciseVolume = entry.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
      return total + exerciseVolume;
    }, 0);
  },

  // Using new muscle contributions system
  getVolumeByMuscle: () => {
    const workout = get().activeWorkout;
    if (!workout) return {};

    const volumeByMuscle: Record<number, number> = {};

    workout.exercises.forEach((entry) => {
      const exerciseVolume = entry.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);

      // Distribute volume based on muscle contributions
      entry.exercise.muscleContributions.forEach((mc) => {
        volumeByMuscle[mc.muscleId] =
          (volumeByMuscle[mc.muscleId] || 0) + exerciseVolume * mc.contribution;
      });
    });

    return volumeByMuscle;
  },

  // Get effective sets per muscle (weighted by contribution)
  getSetsByMuscle: () => {
    const workout = get().activeWorkout;
    if (!workout) return {};

    const setsByMuscle: Record<number, number> = {};

    workout.exercises.forEach((entry) => {
      const completedSetCount = entry.sets.filter((s) => s.completed).length;

      // Distribute sets based on muscle contributions
      entry.exercise.muscleContributions.forEach((mc) => {
        setsByMuscle[mc.muscleId] =
          (setsByMuscle[mc.muscleId] || 0) + completedSetCount * mc.contribution;
      });
    });

    return setsByMuscle;
  },
}));

// Fill untouched sets with what you did last time on that exercise (no coach target).
async function prefillFromHistory(
  exerciseIds: number[],
  set: (fn: (state: WorkoutState) => Partial<WorkoutState>) => void
) {
  if (exerciseIds.length === 0) return;
  // ponytail: newest 500 sets cover the latest session of every exercise in a workout.
  const { data } = await supabase
    .from('workout_sets')
    .select('exercise_id, workout_id, set_number, weight, reps, workouts!inner(started_at)')
    .in('exercise_id', exerciseIds)
    .order('created_at', { ascending: false })
    .limit(500);
  if (!data?.length) return;

  // Rows aren't sorted by the joined column, so pick each exercise's latest workout explicitly.
  const latest = new Map<number, { workoutId: string; startedAt: string }>();
  for (const row of data as any[]) {
    const cur = latest.get(row.exercise_id);
    if (!cur || row.workouts.started_at > cur.startedAt) {
      latest.set(row.exercise_id, { workoutId: row.workout_id, startedAt: row.workouts.started_at });
    }
  }
  const lastSets = new Map<number, { weight: number; reps: number }[]>();
  for (const row of [...(data as any[])].sort((a, b) => a.set_number - b.set_number)) {
    if (latest.get(row.exercise_id)?.workoutId !== row.workout_id) continue;
    lastSets.set(row.exercise_id, [...(lastSets.get(row.exercise_id) ?? []), { weight: row.weight, reps: row.reps }]);
  }

  set((state) => {
    if (!state.activeWorkout) return {};
    return {
      activeWorkout: {
        ...state.activeWorkout,
        exercises: state.activeWorkout.exercises.map((entry) => {
          const prev = lastSets.get(entry.exerciseId);
          if (!prev) return entry;
          return {
            ...entry,
            sets: entry.sets.map((s, i) => {
              const p = prev[i] ?? prev[prev.length - 1];
              return s.completed || s.weight || s.reps ? s : { ...s, weight: Number(p.weight), reps: p.reps };
            }),
          };
        }),
      },
    };
  });
}
