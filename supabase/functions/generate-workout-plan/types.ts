// Types for the generate-workout-plan Edge Function

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

// API Request/Response types

export interface GeneratePlanRequest {
  daysPerWeek: number; // 2-6
  targetSets: Record<number, number>; // muscleId -> weekly sets
  saveTemplates?: boolean; // default false
}

export interface GeneratePlanResponse {
  templates: WorkoutTemplate[];
  weeklySetsByMuscle: Record<number, number>;
  warnings?: string[];
}

// Database exercise row type (from Supabase)
export interface DbExercise {
  id: number;
  name: string;
  category: 'compound' | 'isolation' | null;
  muscle_contributions: MuscleContribution[] | null;
  primary_muscle_id: number | null;
  is_custom: boolean;
}

// Split configuration types
export interface MuscleConfig {
  muscleId: number;
  timesPerWeek: number; // How many times this muscle is trained per week in this split
}

export interface WorkoutDayConfig {
  name: string;
  muscles: MuscleConfig[];
}

export interface SplitConfig {
  days: WorkoutDayConfig[];
}
