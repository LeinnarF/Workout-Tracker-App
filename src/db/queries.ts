import { SQLiteDatabase } from 'expo-sqlite';
import { Exercise, Session, SetRecord } from './types';

export async function getActiveSession(db: SQLiteDatabase): Promise<Session | null> {
  return await db.getFirstAsync<Session>(
    'SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1'
  );
}

export async function startSession(db: SQLiteDatabase): Promise<Session> {
  const result = await db.runAsync('INSERT INTO sessions (started_at) VALUES (?)', [
    new Date().toISOString(),
  ]);
  return (await db.getFirstAsync<Session>('SELECT * FROM sessions WHERE id = ?', [
    result.lastInsertRowId,
  ]))!;
}

export async function finishSession(db: SQLiteDatabase, sessionId: number): Promise<void> {
  await db.runAsync('UPDATE sessions SET ended_at = ? WHERE id = ?', [
    new Date().toISOString(),
    sessionId,
  ]);
}

export async function getExercises(db: SQLiteDatabase): Promise<Exercise[]> {
  return await db.getAllAsync<Exercise>('SELECT * FROM exercises WHERE archived = 0 ORDER BY name ASC');
}

export async function addExercise(
  db: SQLiteDatabase,
  name: string,
  repMin: number = 5,
  repMax: number = 10,
  targetSets: number = 3,
  incrementLb: number = 5,
  defaultWeightLb: number = 45
): Promise<Exercise> {
  const result = await db.runAsync(
    'INSERT INTO exercises (name, rep_min, rep_max, target_sets, increment_lb, default_weight_lb, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, repMin, repMax, targetSets, incrementLb, defaultWeightLb, new Date().toISOString()]
  );
  return (await db.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?', [
    result.lastInsertRowId,
  ]))!;
}

export async function updateExercise(
  db: SQLiteDatabase,
  id: number,
  name: string,
  repMin: number,
  repMax: number,
  targetSets: number,
  incrementLb: number = 5,
  defaultWeightLb?: number | null
): Promise<void> {
  if (defaultWeightLb !== undefined) {
    await db.runAsync(
      'UPDATE exercises SET name = ?, rep_min = ?, rep_max = ?, target_sets = ?, increment_lb = ?, default_weight_lb = ? WHERE id = ?',
      [name, repMin, repMax, targetSets, incrementLb, defaultWeightLb, id]
    );
  } else {
    await db.runAsync(
      'UPDATE exercises SET name = ?, rep_min = ?, rep_max = ?, target_sets = ?, increment_lb = ? WHERE id = ?',
      [name, repMin, repMax, targetSets, incrementLb, id]
    );
  }
}

export async function updateExerciseDefaultWeight(
  db: SQLiteDatabase,
  id: number,
  defaultWeightLb: number
): Promise<void> {
  await db.runAsync('UPDATE exercises SET default_weight_lb = ? WHERE id = ?', [
    defaultWeightLb,
    id,
  ]);
}

export async function deleteExercise(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE exercises SET archived = 1 WHERE id = ?', [id]);
}

export async function getSetsForSession(db: SQLiteDatabase, sessionId: number): Promise<(SetRecord & { exercise_name: string })[]> {
  return await db.getAllAsync<SetRecord & { exercise_name: string }>(
    `SELECT sets.*, exercises.name as exercise_name 
     FROM sets 
     JOIN exercises ON sets.exercise_id = exercises.id 
     WHERE sets.session_id = ? 
     ORDER BY sets.id ASC`,
    [sessionId]
  );
}

export async function addSet(
  db: SQLiteDatabase,
  sessionId: number,
  exerciseId: number,
  setIndex: number,
  weightLb: number,
  reps: number,
  isWarmup: boolean = false
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sets (session_id, exercise_id, set_index, weight_lb, reps, is_warmup) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, exerciseId, setIndex, weightLb, reps, isWarmup ? 1 : 0]
  );
}

export async function deleteSet(db: SQLiteDatabase, setId: number): Promise<void> {
  await db.runAsync('DELETE FROM sets WHERE id = ?', [setId]);
}

export async function ensurePresetExercises(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`ALTER TABLE exercises ADD COLUMN default_weight_lb REAL;`);
  } catch {
    // Column already exists
  }

  await db.execAsync(`
    INSERT OR IGNORE INTO exercises (name, default_weight_lb, created_at) VALUES 
      ('Dips', 0, CURRENT_TIMESTAMP),
      ('Pull ups', 0, CURRENT_TIMESTAMP),
      ('Overhead Press', 45, CURRENT_TIMESTAMP),
      ('Barbell Row', 65, CURRENT_TIMESTAMP),
      ('Farmer''s Carry', 50, CURRENT_TIMESTAMP),
      ('Bulgarian Split Squat', 25, CURRENT_TIMESTAMP),
      ('Romanian Deadlift', 95, CURRENT_TIMESTAMP);

    UPDATE exercises SET default_weight_lb = 0 
    WHERE name IN ('Dips', 'Pull ups') AND (default_weight_lb IS NULL OR default_weight_lb = 45);
  `);
}

export async function getLastSessionSetsForExercise(
  db: SQLiteDatabase,
  exerciseId: number,
  currentSessionId?: number | null
): Promise<SetRecord[]> {
  // Find the most recent session for this exercise before the current session by date
  const lastSession = currentSessionId
    ? await db.getFirstAsync<{ session_id: number }>(
        `SELECT sets.session_id 
         FROM sets 
         JOIN sessions ON sets.session_id = sessions.id
         WHERE sets.exercise_id = ? AND sets.session_id != ? 
         ORDER BY sessions.started_at DESC LIMIT 1`,
        [exerciseId, currentSessionId]
      )
    : await db.getFirstAsync<{ session_id: number }>(
        `SELECT sets.session_id 
         FROM sets 
         JOIN sessions ON sets.session_id = sessions.id
         WHERE sets.exercise_id = ? 
         ORDER BY sessions.started_at DESC LIMIT 1`,
        [exerciseId]
      );

  if (!lastSession) return [];

  return await db.getAllAsync<SetRecord>(
    'SELECT * FROM sets WHERE session_id = ? AND exercise_id = ? ORDER BY set_index ASC',
    [lastSession.session_id, exerciseId]
  );
}

