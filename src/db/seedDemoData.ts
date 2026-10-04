import { SQLiteDatabase } from 'expo-sqlite';
import { ensurePresetExercises, getExercises } from './queries';

export async function seedDemoData(db: SQLiteDatabase): Promise<void> {
  await ensurePresetExercises(db);
  const exercises = await getExercises(db);

  const exMap: Record<string, number> = {};
  for (const ex of exercises) {
    exMap[ex.name] = ex.id;
  }

  // Clear existing sets and sessions first to give a fresh sample dataset
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM sets;
    DELETE FROM sessions;
    PRAGMA foreign_keys = ON;
  `);

  const now = new Date();

  // Helper to generate past ISO date strings (daysAgo at hour:minute)
  const getDate = (daysAgo: number, hour = 17, min = 30) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  // 13 sessions across the past 4.5 weeks:
  // Mon/Wed/Fri rhythm
  const workoutDays = [30, 28, 26, 23, 21, 19, 16, 14, 12, 9, 7, 5, 2];

  // Routine templates (Workout A and Workout B)
  // Workout A: Overhead Press, Romanian Deadlift, Pull ups, Farmer's Carry
  // Workout B: Barbell Row, Bulgarian Split Squat, Dips

  interface ExerciseLogPlan {
    name: string;
    weight: number;
    reps: [number, number, number];
  }

  const sessionPlans: ExerciseLogPlan[][] = [
    // Session 1 (Day 30) - A
    [
      { name: 'Overhead Press', weight: 75, reps: [6, 6, 5] },
      { name: 'Romanian Deadlift', weight: 185, reps: [8, 8, 8] },
      { name: 'Pull ups', weight: 0, reps: [5, 5, 4] },
    ],
    // Session 2 (Day 28) - B
    [
      { name: 'Barbell Row', weight: 115, reps: [8, 8, 7] },
      { name: 'Bulgarian Split Squat', weight: 30, reps: [8, 8, 8] },
      { name: 'Dips', weight: 0, reps: [8, 8, 8] },
    ],
    // Session 3 (Day 26) - A
    [
      { name: 'Overhead Press', weight: 75, reps: [7, 7, 6] },
      { name: 'Romanian Deadlift', weight: 195, reps: [8, 8, 7] },
      { name: "Farmer's Carry", weight: 50, reps: [10, 10, 10] },
    ],
    // Session 4 (Day 23) - B
    [
      { name: 'Barbell Row', weight: 115, reps: [8, 8, 8] },
      { name: 'Bulgarian Split Squat', weight: 35, reps: [8, 8, 7] },
      { name: 'Dips', weight: 10, reps: [6, 6, 6] },
    ],
    // Session 5 (Day 21) - A
    [
      { name: 'Overhead Press', weight: 75, reps: [8, 8, 8] },
      { name: 'Romanian Deadlift', weight: 195, reps: [8, 8, 8] },
      { name: 'Pull ups', weight: 0, reps: [6, 6, 5] },
    ],
    // Session 6 (Day 19) - B
    [
      { name: 'Barbell Row', weight: 125, reps: [6, 6, 6] },
      { name: 'Bulgarian Split Squat', weight: 35, reps: [8, 8, 8] },
      { name: 'Dips', weight: 10, reps: [8, 8, 7] },
    ],
    // Session 7 (Day 16) - A
    [
      { name: 'Overhead Press', weight: 80, reps: [6, 6, 5] },
      { name: 'Romanian Deadlift', weight: 205, reps: [6, 6, 6] },
      { name: "Farmer's Carry", weight: 55, reps: [10, 10, 10] },
    ],
    // Session 8 (Day 14) - B
    [
      { name: 'Barbell Row', weight: 125, reps: [7, 7, 7] },
      { name: 'Bulgarian Split Squat', weight: 40, reps: [6, 6, 6] },
      { name: 'Dips', weight: 10, reps: [8, 8, 8] },
    ],
    // Session 9 (Day 12) - A
    [
      { name: 'Overhead Press', weight: 80, reps: [7, 7, 6] },
      { name: 'Romanian Deadlift', weight: 205, reps: [8, 8, 7] },
      { name: 'Pull ups', weight: 0, reps: [7, 6, 6] },
    ],
    // Session 10 (Day 9) - B
    [
      { name: 'Barbell Row', weight: 125, reps: [8, 8, 8] },
      { name: 'Bulgarian Split Squat', weight: 40, reps: [8, 7, 7] },
      { name: 'Dips', weight: 15, reps: [6, 6, 6] },
    ],
    // Session 11 (Day 7) - A
    [
      { name: 'Overhead Press', weight: 80, reps: [8, 8, 8] }, // triggers double progression readiness!
      { name: 'Romanian Deadlift', weight: 205, reps: [8, 8, 8] }, // triggers double progression readiness!
      { name: "Farmer's Carry", weight: 60, reps: [10, 10, 10] },
    ],
    // Session 12 (Day 5) - B
    [
      { name: 'Barbell Row', weight: 135, reps: [6, 6, 5] },
      { name: 'Bulgarian Split Squat', weight: 40, reps: [8, 8, 8] },
      { name: 'Dips', weight: 15, reps: [8, 7, 7] },
    ],
    // Session 13 (Day 2) - A
    [
      { name: 'Overhead Press', weight: 85, reps: [6, 5, 5] },
      { name: 'Romanian Deadlift', weight: 215, reps: [6, 6, 5] },
      { name: 'Pull ups', weight: 0, reps: [8, 7, 7] },
    ],
  ];

  for (let sIdx = 0; sIdx < workoutDays.length; sIdx++) {
    const daysAgo = workoutDays[sIdx];
    const startedAt = getDate(daysAgo, 17, 30);
    const endedAt = getDate(daysAgo, 18, 25);
    const plan = sessionPlans[sIdx];

    const sessionRes = await db.runAsync(
      'INSERT INTO sessions (started_at, ended_at, notes) VALUES (?, ?, ?)',
      [startedAt, endedAt, `Completed training session ${sIdx + 1}`]
    );

    const sessionId = sessionRes.lastInsertRowId;
    let setIndexCounter = 0;

    for (const exPlan of plan) {
      const exId = exMap[exPlan.name];
      if (!exId) continue;

      for (const reps of exPlan.reps) {
        await db.runAsync(
          'INSERT INTO sets (session_id, exercise_id, set_index, weight_lb, reps, is_warmup) VALUES (?, ?, ?, ?, ?, 0)',
          [sessionId, exId, setIndexCounter, exPlan.weight, reps]
        );
        setIndexCounter++;
      }

      // Update default weight to the latest logged weight
      await db.runAsync(
        'UPDATE exercises SET default_weight_lb = ? WHERE id = ?',
        [exPlan.weight, exId]
      );
    }
  }
}
