import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  weightUnit: 'kg' | 'lbs';
  theme: 'light' | 'dark' | 'system';
  weeklySetTargets: Record<number, number>; // muscleId -> target sets
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setWeeklySetTarget: (muscleId: number, target: number) => void;
  convertWeight: (weight: number, to: 'kg' | 'lbs') => number;
}

const KG_TO_LBS = 2.20462;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      weightUnit: 'kg',
      theme: 'system',
      weeklySetTargets: {
        1: 12,  // Chest
        2: 15,  // Back
        3: 10,  // Shoulders
        4: 8,   // Biceps
        5: 8,   // Triceps
        6: 12,  // Quadriceps
        7: 10,  // Hamstrings
        8: 10,  // Glutes
        9: 8,   // Calves
        10: 8,  // Core
      },

      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setTheme: (theme) => set({ theme }),
      setWeeklySetTarget: (muscleId, target) =>
        set((state) => ({
          weeklySetTargets: { ...state.weeklySetTargets, [muscleId]: target },
        })),

      convertWeight: (weight, to) => {
        const current = get().weightUnit;
        if (current === to) return weight;
        return to === 'lbs' ? weight * KG_TO_LBS : weight / KG_TO_LBS;
      },
    }),
    {
      name: 'workout-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
