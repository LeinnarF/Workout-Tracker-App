export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10;
}

export function kgToLb(kg: number): number {
  // Round to nearest 2.5 lb as per the requirements
  const rawLb = kg * 2.20462;
  return Math.round(rawLb / 2.5) * 2.5;
}

export function miToKm(mi: number): number {
  return Math.round(mi * 1.60934 * 100) / 100;
}

export function kmToMi(km: number): number {
  return Math.round((km / 1.60934) * 100) / 100;
}

export function calculateE1RM(weightLb: number, reps: number): number {
  if (reps === 0) return 0;
  if (reps === 1) return weightLb;
  return Math.round(weightLb * (1 + reps / 30));
}
