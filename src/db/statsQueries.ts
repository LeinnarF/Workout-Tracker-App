import { SQLiteDatabase } from 'expo-sqlite';
import {
  Session,
  SetRecord,
  WeeklyRepStat,
  DailyStat,
  TimeRange,
  ExercisePR,
  LifetimeStats,
  ExerciseOverloadStatus,
} from './types';
import { calculateE1RM } from '../logic/conversions';
import { getExercises } from './queries';
import { suggestNext } from '../logic/suggestNext';

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

export async function getStatsForExercise(
  db: SQLiteDatabase,
  exerciseId: number,
  timeRange: TimeRange = 'ALL'
) {
  let cutoffDate: string | null = null;
  const now = Date.now();
  if (timeRange === '4W') {
    cutoffDate = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();
  } else if (timeRange === '3M') {
    cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  } else if (timeRange === '1Y') {
    cutoffDate = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  let query = `
    SELECT sets.*, sessions.started_at 
    FROM sets 
    JOIN sessions ON sets.session_id = sessions.id 
    WHERE sets.exercise_id = ? AND sets.is_warmup = 0
  `;
  const params: (number | string)[] = [exerciseId];

  if (cutoffDate) {
    query += ' AND sessions.started_at >= ?';
    params.push(cutoffDate);
  }

  query += ' ORDER BY sessions.started_at ASC, sets.id ASC';

  const sets = await db.getAllAsync<SetRecord & { started_at: string }>(query, params);

  // Compute daily stats (volume, best e1rm, best weight, total reps, set reps per date)
  const statsBySession: Record<
    string,
    { volume: number; bestE1rm: number; bestWeight: number; totalReps: number; setReps: number[] }
  > = {};
  // Compute weekly stats (total reps and weight tracking per week)
  const weekGroups: Record<string, { totalReps: number; weights: number[] }> = {};

  for (const set of sets) {
    const date = set.started_at.split('T')[0];
    if (!statsBySession[date]) {
      statsBySession[date] = { volume: 0, bestE1rm: 0, bestWeight: 0, totalReps: 0, setReps: [] };
    }

    statsBySession[date].volume += set.weight_lb * set.reps;
    statsBySession[date].totalReps += set.reps;
    statsBySession[date].setReps.push(set.reps);

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

  const daily: DailyStat[] = Object.keys(statsBySession).map((date) => ({
    date,
    ...statsBySession[date],
  }));

  const sortedWeeks = Object.keys(weekGroups).sort();
  let prevMaxWeight: number | null = null;
  let prevTotalReps: number | null = null;

  const weekly: WeeklyRepStat[] = sortedWeeks.map((weekKey) => {
    const group = weekGroups[weekKey];
    const maxWeight = Math.max(...group.weights);

    // Intra-week increase: did any set in this week have higher weight than an earlier set
    let hasIntraWeekIncrease = false;
    let runningMax = group.weights[0];
    for (let i = 1; i < group.weights.length; i++) {
      if (group.weights[i] > runningMax) {
        hasIntraWeekIncrease = true;
        runningMax = group.weights[i];
      }
    }

    // Inter-week increase: this week's max weight is strictly greater than the previous logged week's max weight
    const hasInterWeekIncrease = prevMaxWeight !== null && maxWeight > prevMaxWeight;

    // Rep overload when weight is unchanged (e.g. bodyweight 0 lb or holding weight constant)
    const hasRepOverload =
      prevMaxWeight !== null &&
      maxWeight === prevMaxWeight &&
      prevTotalReps !== null &&
      group.totalReps > prevTotalReps;

    const hasWeightIncrease = hasInterWeekIncrease || hasIntraWeekIncrease || hasRepOverload;

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
    prevTotalReps = group.totalReps;
    return stat;
  });

  return { daily, weekly };
}

export async function getExercisePRs(
  db: SQLiteDatabase,
  exerciseId?: number
): Promise<ExercisePR[]> {
  const query = `
    SELECT 
      sets.exercise_id,
      exercises.name as exercise_name,
      sets.weight_lb,
      sets.reps,
      sessions.started_at
    FROM sets
    JOIN exercises ON sets.exercise_id = exercises.id
    JOIN sessions ON sets.session_id = sessions.id
    WHERE sets.is_warmup = 0 ${exerciseId ? 'AND sets.exercise_id = ?' : ''}
    ORDER BY sessions.started_at ASC, sets.id ASC
  `;
  const params = exerciseId ? [exerciseId] : [];
  const rows = await db.getAllAsync<{
    exercise_id: number;
    exercise_name: string;
    weight_lb: number;
    reps: number;
    started_at: string;
  }>(query, params);

  const byExercise: Record<
    number,
    {
      exerciseId: number;
      exerciseName: string;
      heaviestWeightLb: number;
      heaviestWeightDate: string;
      bestE1rm: number;
      bestE1rmDate: string;
      maxReps: number;
      maxRepsDate: string;
      sessionVolumes: Record<string, number>;
    }
  > = {};

  for (const r of rows) {
    const e1rm = calculateE1RM(r.weight_lb, r.reps);
    const dateStr = r.started_at.split('T')[0];
    const sessionKey = r.started_at;

    if (!byExercise[r.exercise_id]) {
      byExercise[r.exercise_id] = {
        exerciseId: r.exercise_id,
        exerciseName: r.exercise_name,
        heaviestWeightLb: r.weight_lb,
        heaviestWeightDate: dateStr,
        bestE1rm: e1rm,
        bestE1rmDate: dateStr,
        maxReps: r.reps,
        maxRepsDate: dateStr,
        sessionVolumes: {},
      };
    }

    const ex = byExercise[r.exercise_id];

    if (r.weight_lb >= ex.heaviestWeightLb) {
      ex.heaviestWeightLb = r.weight_lb;
      ex.heaviestWeightDate = dateStr;
    }

    if (e1rm >= ex.bestE1rm) {
      ex.bestE1rm = Math.round(e1rm);
      ex.bestE1rmDate = dateStr;
    }

    if (r.reps >= ex.maxReps) {
      ex.maxReps = r.reps;
      ex.maxRepsDate = dateStr;
    }

    ex.sessionVolumes[sessionKey] =
      (ex.sessionVolumes[sessionKey] || 0) + r.weight_lb * r.reps;
  }

  return Object.values(byExercise).map((ex) => {
    let maxSessionVolume = 0;
    let maxSessionVolumeDate = '';

    for (const [sessionDate, vol] of Object.entries(ex.sessionVolumes)) {
      if (vol >= maxSessionVolume) {
        maxSessionVolume = Math.round(vol);
        maxSessionVolumeDate = sessionDate.split('T')[0];
      }
    }

    return {
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      heaviestWeightLb: ex.heaviestWeightLb,
      heaviestWeightDate: ex.heaviestWeightDate,
      bestE1rm: ex.bestE1rm,
      bestE1rmDate: ex.bestE1rmDate,
      maxReps: ex.maxReps,
      maxRepsDate: ex.maxRepsDate,
      maxSessionVolume,
      maxSessionVolumeDate,
    };
  });
}

export async function getLifetimeStats(db: SQLiteDatabase): Promise<LifetimeStats> {
  const totals = await db.getFirstAsync<{
    total_workouts: number;
    total_sets: number;
    total_volume: number;
  }>(
    `SELECT 
       COUNT(DISTINCT session_id) as total_workouts,
       COUNT(*) as total_sets,
       COALESCE(SUM(weight_lb * reps), 0) as total_volume 
     FROM sets 
     WHERE is_warmup = 0`
  );

  const currentMonday = getMondayOfWeek(new Date().toISOString());

  const thisWeekRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT sessions.id) as count 
     FROM sessions 
     JOIN sets ON sessions.id = sets.session_id 
     WHERE sets.is_warmup = 0 AND sessions.started_at >= ?`,
    [currentMonday]
  );

  // Compute streak of consecutive weeks with workouts
  const pastSessionDates = await db.getAllAsync<{ started_at: string }>(
    `SELECT DISTINCT sessions.started_at 
     FROM sessions 
     JOIN sets ON sessions.id = sets.session_id 
     WHERE sets.is_warmup = 0 
     ORDER BY sessions.started_at DESC`
  );

  const weekSet = new Set(pastSessionDates.map((s) => getMondayOfWeek(s.started_at)));
  let streak = 0;
  let checkDate = new Date();
  let checkMonday = getMondayOfWeek(checkDate.toISOString());

  if (!weekSet.has(checkMonday)) {
    const prevWeek = new Date(checkDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevMonday = getMondayOfWeek(prevWeek.toISOString());
    if (weekSet.has(prevMonday)) {
      checkMonday = prevMonday;
    } else {
      checkMonday = '';
    }
  }

  if (checkMonday) {
    while (weekSet.has(checkMonday)) {
      streak++;
      const [y, m, d] = checkMonday.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      dObj.setDate(dObj.getDate() - 7);
      checkMonday = getMondayOfWeek(dObj.toISOString());
    }
  }

  return {
    totalWorkouts: totals?.total_workouts || 0,
    totalSets: totals?.total_sets || 0,
    totalVolumeLb: Math.round(totals?.total_volume || 0),
    currentStreakWeeks: streak,
    workoutsThisWeek: thisWeekRow?.count || 0,
    weeklyTarget: 3,
  };
}

export async function getAllExercisesOverloadStatus(
  db: SQLiteDatabase
): Promise<ExerciseOverloadStatus[]> {
  const exercises = await getExercises(db);
  if (exercises.length === 0) return [];

  // Fetch all sets from the most recent session for each exercise in a single query
  const recentSets = await db.getAllAsync<SetRecord>(
    `WITH RankedSessions AS (
       SELECT 
         sets.*,
         DENSE_RANK() OVER (PARTITION BY sets.exercise_id ORDER BY sessions.started_at DESC) as session_rank
       FROM sets 
       JOIN sessions ON sets.session_id = sessions.id
     )
     SELECT id, session_id, exercise_id, set_index, weight_lb, reps, is_warmup
     FROM RankedSessions 
     WHERE session_rank = 1 
     ORDER BY exercise_id ASC, set_index ASC`
  );

  const setsByExercise: Record<number, SetRecord[]> = {};
  for (const set of recentSets) {
    if (!setsByExercise[set.exercise_id]) {
      setsByExercise[set.exercise_id] = [];
    }
    setsByExercise[set.exercise_id].push(set);
  }

  const result: ExerciseOverloadStatus[] = [];

  for (const ex of exercises) {
    const history = setsByExercise[ex.id] || [];
    const sug = suggestNext(ex, history);
    const workingSets = history.filter((s) => s.is_warmup === 0);
    const currentWeight =
      ex.default_weight_lb != null
        ? ex.default_weight_lb
        : workingSets.length > 0
        ? workingSets[workingSets.length - 1].weight_lb
        : 45;

    result.push({
      exerciseId: ex.id,
      exerciseName: ex.name,
      isReadyForIncrease: sug.shouldIncrease && currentWeight < sug.suggestedWeightLb,
      suggestedWeightLb: sug.suggestedWeightLb,
      currentWeightLb: currentWeight,
      repMin: ex.rep_min,
      repMax: ex.rep_max,
      targetSets: ex.target_sets,
      lastSessionReps: workingSets.map((s) => s.reps),
    });
  }

  return result;
}
