import { SQLiteDatabase } from 'expo-sqlite';
import { Session, Exercise, SetRecord } from './types';
import { calculateE1RM } from '../logic/conversions';

export async function getPastSessions(db: SQLiteDatabase): Promise<Session[]> {
  return await db.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE id IN (SELECT DISTINCT session_id FROM sets) ORDER BY started_at DESC'
  );
}

export async function getSessionSets(db: SQLiteDatabase, sessionId: number): Promise<(SetRecord & { exercise_name: string })[]> {
  return await db.getAllAsync<SetRecord & { exercise_name: string }>(
    `SELECT sets.*, exercises.name as exercise_name 
     FROM sets 
     JOIN exercises ON sets.exercise_id = exercises.id 
     WHERE sets.session_id = ? 
     ORDER BY sets.id ASC`,
    [sessionId]
  );
}

export async function getStatsForExercise(db: SQLiteDatabase, exerciseId: number) {
  const sets = await db.getAllAsync<SetRecord & { started_at: string }>(
    `SELECT sets.*, sessions.started_at 
     FROM sets 
     JOIN sessions ON sets.session_id = sessions.id 
     WHERE sets.exercise_id = ? AND sets.is_warmup = 0 AND sessions.ended_at IS NOT NULL
     ORDER BY sessions.started_at ASC`,
    [exerciseId]
  );
  
  // Compute e1rm and volume per session
  const statsBySession: Record<string, { volume: number, bestE1rm: number, bestWeight: number }> = {};
  
  for (const set of sets) {
    const date = set.started_at.split('T')[0]; // simple grouping by date
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
  }
  
  return Object.keys(statsBySession).map(date => ({
    date,
    ...statsBySession[date]
  }));
}
