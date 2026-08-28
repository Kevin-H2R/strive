export interface MuscleGroup {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 1, name: 'Chest', icon: 'fitness-center', color: '#FF6B6B' },
  { id: 2, name: 'Back', icon: 'fitness-center', color: '#4ECDC4' },
  { id: 3, name: 'Shoulders', icon: 'fitness-center', color: '#45B7D1' },
  { id: 4, name: 'Biceps', icon: 'fitness-center', color: '#96CEB4' },
  { id: 5, name: 'Triceps', icon: 'fitness-center', color: '#FFEAA7' },
  { id: 6, name: 'Quadriceps', icon: 'fitness-center', color: '#DDA0DD' },
  { id: 7, name: 'Hamstrings', icon: 'fitness-center', color: '#98D8C8' },
  { id: 8, name: 'Glutes', icon: 'fitness-center', color: '#F7DC6F' },
  { id: 9, name: 'Calves', icon: 'fitness-center', color: '#BB8FCE' },
  { id: 10, name: 'Core', icon: 'fitness-center', color: '#85C1E9' },
];

export const getMuscleById = (id: number): MuscleGroup | undefined => {
  return MUSCLE_GROUPS.find((m) => m.id === id);
};

export const getMuscleByName = (name: string): MuscleGroup | undefined => {
  return MUSCLE_GROUPS.find((m) => m.name.toLowerCase() === name.toLowerCase());
};
