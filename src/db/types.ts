export interface Exercise {
  id: number;
  name: string;
  rep_min: number;
  rep_max: number;
  target_sets: number;
  increment_lb: number;
  default_weight_lb?: number | null;
  archived: number;
  created_at: string;
}

export interface Session {
  id: number;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

export interface SetRecord {
  id: number;
  session_id: number;
  exercise_id: number;
  set_index: number;
  weight_lb: number;
  reps: number;
  is_warmup: number;
}

export interface WeeklyRepStat {
  weekStart: string;
  label: string;
  totalReps: number;
  maxWeight: number;
  prevMaxWeight: number | null;
  hasWeightIncrease: boolean;
  weights: number[];
}

export interface DailyStat {
  date: string;
  volume: number;
  bestE1rm: number;
  bestWeight: number;
  totalReps: number;
  setReps: number[];
}

export type TimeRange = '4W' | '3M' | '1Y' | 'ALL';

export interface ExercisePR {
  exerciseId: number;
  exerciseName: string;
  heaviestWeightLb: number;
  heaviestWeightDate: string;
  bestE1rm: number;
  bestE1rmDate: string;
  maxSessionVolume: number;
  maxSessionVolumeDate: string;
}

export interface LifetimeStats {
  totalWorkouts: number;
  totalSets: number;
  totalVolumeLb: number;
  currentStreakWeeks: number;
  workoutsThisWeek: number;
  weeklyTarget: number;
}

export interface ExerciseOverloadStatus {
  exerciseId: number;
  exerciseName: string;
  isReadyForIncrease: boolean;
  suggestedWeightLb: number;
  currentWeightLb: number;
  repMin: number;
  repMax: number;
  targetSets: number;
  lastSessionReps: number[];
}

