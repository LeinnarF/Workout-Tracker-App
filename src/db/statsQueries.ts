import { SQLiteDatabase } from 'expo-sqlite';
import { Session, SetRecord, WeeklyRepStat } from './types';
import { calculateE1RM } from '../logic/conversions';

export async function getPastSessions(db: SQLiteDatabase): Promise<Session[]> {
  return await db.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE id IN (SELECT DISTINCT session_id FROM sets) ORDER BY started_at DESC'
  );
}

export async function getSessionSets(
  db: SQLiteDatabase,
  sessionId: number
): Promise<(SetRecord & { exercise_name: string })[]> {
  return await db.getAllAsync<SetRecord & { exercise_name: string }>(
    `SELECT sets.*, exercises.name as exercise_name 
     FROM sets 
     JOIN exercises ON sets.exercise_id = exercises.id 
     WHERE sets.session_id = ? 
     ORDER BY sets.id ASC`,
    [sessionId]
  );
}

export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  // Adjust so Monday is first day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dateNum = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dateNum}`;
}

export function formatWeekLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return dateStr;
}

export async function getStatsForExercise(db: SQLiteDatabase, exerciseId: number) {
  const sets = await db.getAllAsync<SetRecord & { started_at: string }>(
    `SELECT sets.*, sessions.started_at 
     FROM sets 
     JOIN sessions ON sets.session_id = sessions.id 
     WHERE sets.exercise_id = ? AND sets.is_warmup = 0
     ORDER BY sessions.started_at ASC, sets.id ASC`,
    [exerciseId]
  );

  // Compute daily stats (volume and best e1rm per date)
  const statsBySession: Record<string, { volume: number; bestE1rm: number; bestWeight: number }> = {};
  // Compute weekly stats (total reps and weight tracking per week)
  const weekGroups: Record<string, { totalReps: number; weights: number[] }> = {};

  for (const set of sets) {
    const date = set.started_at.split('T')[0];
    if (!statsBySession[date]) {
      statsBySession[date] = { volume: 0, bestE1rm: 0, bestWeight: 0 };
    }

    statsBySession[date].volume += set.weight_lb * set.reps;

    const e1rm = calculateE1RM(set.weight_lb, set.reps);
    if (e1rm > statsBySession[date].bestE1rm) {
      statsBySession[date].bestE1rm = e1rm;
    }

    if (set.weight_lb > statsBySession[date].bestWeight) {
      statsBySession[date].bestWeight = set.weight_lb;
    }

    // Grouping by week starting Monday
    const weekStart = getMondayOfWeek(set.started_at);
    if (!weekGroups[weekStart]) {
      weekGroups[weekStart] = { totalReps: 0, weights: [] };
    }
    weekGroups[weekStart].totalReps += set.reps;
    weekGroups[weekStart].weights.push(set.weight_lb);
  }

  const daily = Object.keys(statsBySession).map((date) => ({
    date,
    ...statsBySession[date],
  }));

  const sortedWeeks = Object.keys(weekGroups).sort();
  let prevMaxWeight: number | null = null;

  const weekly: WeeklyRepStat[] = sortedWeeks.map((weekKey) => {
    const group = weekGroups[weekKey];
    const maxWeight = Math.max(...group.weights);

    // Intra-week increase: did any set in this week have higher weight than an earlier set
    let hasIntraWeekIncrease = false;
    let runningMax = group.weights[0];
    for (let i = 1; i < group.weights.length; i++) {
      if (group.weights[i] > runningMax) {
        hasIntraWeekIncrease = true;
      }
      if (group.weights[i] > runningMax) {
        runningMax = group.weights[i];
      }
    }

    // Inter-week increase: this week's max weight is strictly greater than the previous logged week's max weight
    const hasInterWeekIncrease = prevMaxWeight !== null && maxWeight > prevMaxWeight;

    const hasWeightIncrease = hasInterWeekIncrease || hasIntraWeekIncrease;

    const stat: WeeklyRepStat = {
      weekStart: weekKey,
      label: formatWeekLabel(weekKey),
      totalReps: group.totalReps,
      maxWeight,
      prevMaxWeight,
      hasWeightIncrease,
      weights: group.weights,
    };

    prevMaxWeight = maxWeight;
    return stat;
  });

  return { daily, weekly };
}
