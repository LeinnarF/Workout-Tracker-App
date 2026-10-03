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
