import { Exercise, SetRecord } from '../db/types';

export interface ProgressionSuggestion {
  shouldIncrease: boolean;
  suggestedWeightLb: number;
}

export function suggestNext(
  exercise: Exercise,
  lastSessionSets: SetRecord[]
): ProgressionSuggestion {
  // Only consider working sets
  const workingSets = lastSessionSets.filter((s) => s.is_warmup === 0);

  if (workingSets.length === 0) {
    return { shouldIncrease: false, suggestedWeightLb: 0 }; // Or previous default
  }

  // Get the most recent weight used
  const currentWeight = workingSets[0].weight_lb;

  // We need at least 3 working sets (or whatever the target_sets is, but plan says "at least 3")
  // Actually, plan says "When the most recent session had at least 3 working sets..."
  if (workingSets.length < exercise.target_sets) {
    return { shouldIncrease: false, suggestedWeightLb: currentWeight };
  }

  // Check if *every* one of those sets reached the top of the rep range (rep_max)
  const allSetsHitTarget = workingSets.every((set) => set.reps >= exercise.rep_max);

  if (allSetsHitTarget) {
    return {
      shouldIncrease: true,
      suggestedWeightLb: currentWeight + exercise.increment_lb,
    };
  }

  return {
    shouldIncrease: false,
    suggestedWeightLb: currentWeight,
  };
}
