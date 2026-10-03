import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  try {
    const DATABASE_VERSION = 3;
    let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    ) ?? { user_version: 0 };

    if (currentDbVersion >= DATABASE_VERSION) {
      return;
    }
    if (currentDbVersion === 0) {
      await db.execAsync(`
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;

CREATE TABLE exercises (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  rep_min INTEGER NOT NULL DEFAULT 5,
  rep_max INTEGER NOT NULL DEFAULT 10,
  target_sets INTEGER NOT NULL DEFAULT 3,
  increment_lb REAL NOT NULL DEFAULT 5,
  default_weight_lb REAL,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  notes TEXT
);

CREATE TABLE sets (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  set_index INTEGER NOT NULL,
  weight_lb REAL NOT NULL,
  reps INTEGER NOT NULL,
  is_warmup INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sets_exercise ON sets(exercise_id, session_id);

INSERT INTO exercises (name, created_at) VALUES 
  ('Dips', CURRENT_TIMESTAMP),
  ('Pull ups', CURRENT_TIMESTAMP),
  ('Overhead Press', CURRENT_TIMESTAMP),
  ('Barbell Row', CURRENT_TIMESTAMP),
  ('Farmer''s Carry', CURRENT_TIMESTAMP),
  ('Bulgarian Split Squat', CURRENT_TIMESTAMP),
  ('Romanian Deadlift', CURRENT_TIMESTAMP);
`);
      currentDbVersion = 1;
    }
    if (currentDbVersion === 1) {
      await db.execAsync(`
        INSERT OR IGNORE INTO exercises (name, created_at) VALUES 
          ('Dips', CURRENT_TIMESTAMP),
          ('Pull ups', CURRENT_TIMESTAMP),
          ('Overhead Press', CURRENT_TIMESTAMP),
          ('Barbell Row', CURRENT_TIMESTAMP),
          ('Farmer''s Carry', CURRENT_TIMESTAMP),
          ('Bulgarian Split Squat', CURRENT_TIMESTAMP),
          ('Romanian Deadlift', CURRENT_TIMESTAMP);
      `);
      currentDbVersion = 2;
    }
    if (currentDbVersion === 2) {
      try {
        await db.execAsync(`ALTER TABLE exercises ADD COLUMN default_weight_lb REAL;`);
      } catch {
        // Column might already exist
      }
      currentDbVersion = 3;
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  } catch (error) {
    console.error('Database migration error:', error);
  }
}
