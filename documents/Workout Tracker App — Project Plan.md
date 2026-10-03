# Workout Tracker App — Project Plan

Personal Android app for logging lifts, getting progressive-overload suggestions, and seeing progress over time. Prepared for Leinnarf · October 3, 2026 · v1 plan

## 1. Overview

Tracking workouts on paper or in a notes app is tedious and gives no insight while you train. This app is built for one user (me) and one routine: a **full-body workout 3 times a week** centered on compound lifts. It replaces the notebook with fast set logging, tells me when it's time to add weight, shows progress graphs, and bundles a unit converter and a timer so I don't need to switch apps in the gym.

**Goals**

- Log a set in a few taps, with last session's numbers prefilled.
- Suggest a weight increase when I've earned it, while leaving the decision to me.
- Show clear stats on strength, volume, PRs, and consistency.
- Work fully offline, with my data backed up and exportable.

**Non-goals for v1**

- Accounts, cloud sync, or social features.
- iOS support.
- Workout templates, an automatic rest timer, deload logic, or system push notifications.

## 2. Decisions locked in

| Topic | Decision |
| --- | --- |
| Platform | Android only |
| Framework | React Native + Expo (TypeScript) |
| Weight unit | Pounds (lb) everywhere; kg/mi/km handled by the Convert tab |
| Exercises | I create my own; no preloaded library |
| Targets | A rep range per exercise, typically 3 sets of 5-10 |
| Progression trigger | Hit the top of the range (10 reps) on all 3 sets |
| Default increment | 5 lb (2.5 kg), editable per exercise and at suggestion time |
| Timer | Countdown only; alert shown inside the app, not as a system notification |
| Statistics | All of them (see section 5) |
| Backup/export | Included in v1 |

## 3. Modules

The app has four bottom tabs: **Log · Stats · Convert · Timer**. The overload helper is part of Log and Stats rather than a separate tab. Exercise management and Settings (backup) sit behind a menu.

### 3.1 Logging

- Start a workout, pick an exercise from a searchable list, or add a new one.
- Log **one set at a time**: weight and reps, with +/- steppers and tap-to-type. Weight and reps are prefilled from the last session of that exercise, so most sets are one tap to confirm.
- Each set can be marked as a **warm-up**; warm-ups are excluded from the overload helper and from stats.
- Edit or delete a set at any time during the session.
- "Finish workout" saves the session. Unfinished sessions survive the app being closed.
- A weight shown in the Log screen can be tapped to see its kg equivalent without leaving the screen.

### 3.2 Progressive overload helper

Each exercise stores a **rep range** (default 5-10), a **target set count** (default 3), and an **increment** (default 5 lb).

**Rule (double progression)**

1. Keep the same weight while working toward the top of the range.
2. When the most recent session had at least 3 working sets and **every one of them reached 10 reps** (the top of the range), suggest `current weight + increment`.
3. Otherwise, the suggestion is to stay at the current weight and aim for more reps.

**Behavior**

- The suggestion appears as an **"Ready to increase → 55 lb"** badge when I open the exercise in Log, and in Stats.
- I can **accept** (the new weight is prefilled in the next session), **edit** the amount, or **dismiss** it. The app never changes weight on its own.
- After an increase, reps naturally drop; the target goes back to working up from the bottom of the range.
- Rule is a pure function, `suggestNext(exercise, lastSessionSets)`, so it is easy to unit-test.

### 3.3 Statistics

All stats are computed from working sets (warm-ups excluded) and can be filtered by time range (4 weeks / 3 months / 1 year / all time).

- **Session history:** list of past sessions, with a detail view per session.
- **Per-exercise strength trend:** top-set weight over time, plus **estimated 1RM** (Epley: `weight × (1 + reps/30)`).
- **Volume:** total volume (weight × reps) per session and per week, overall and per exercise.
- **Personal records:** heaviest weight, most reps at a given weight, and best estimated 1RM per exercise, with the date.
- **Consistency:** sessions per week, current streak, and a calendar view of workout days.
- **Overload status:** which exercises are ready to increase.

### 3.4 Unit conversion

- Two-way converter: type in either field and the other updates.
  - Weight: lb ↔ kg
  - Distance: miles ↔ kilometers
- Reasonable rounding (weight to 0.1 or the nearest 2.5 lb plate step, distance to 2 decimals).
- "Use in Log" button: sends a converted weight (e.g., a 20 kg stack setting) straight into the current set.
- Pure functions with unit tests; no data storage needed.

### 3.5 Timer

- **Countdown only.** Quick presets (e.g., 1:00, 1:30, 2:00, 3:00) plus a custom time. Start, pause, and reset are manual.
- The timer state lives at the app root, so it **keeps running while I switch to the Log or Stats tabs**.
- Timestamp-based: it stores the end time and computes the remaining time on each render, so it stays accurate even if the screen dims or the app is briefly backgrounded.
- **In-app alert only:** when the countdown ends while the app is open, show a banner or modal with a haptic buzz. The Timer tab keeps the screen awake while a countdown is running.
- Known limit: because there is no system notification, an alert will not fire if the app is fully closed or backgrounded; the finished state is shown the next time the app is opened. This is an accepted trade-off for keeping v1 simple, and a local notification can be added later if needed.

### 3.6 Backup and export

- **Export JSON:** full backup of exercises, sessions, and sets, saved or shared to Drive or Files.
- **Import JSON:** restore from a backup file (with a confirmation before it replaces current data).
- **Export CSV:** flat sets table, for analysis in Python or a spreadsheet.
- A reminder in Settings showing the date of the last backup.

## 4. Screens

| Screen | Contents |
| --- | --- |
| Log (tab) | Active session, exercise picker, set entry, overload badge, finish button |
| Stats (tab) | Time-range filter, exercise selector, charts, PR list, consistency view |
| Convert (tab) | lb↔kg and mi↔km fields, "Use in Log" |
| Timer (tab) | Countdown display, presets, custom time, start/pause/reset |
| Exercises | List, add, edit (rep range, sets, increment), archive |
| Session detail | Sets from one past session, edit or delete |
| Settings | Backup, export, import, default increment |

**Design principles:** minimalist; large tap targets (48 px or more); the primary action (log set) sits in the thumb zone at the bottom; haptic feedback on log; dark mode supported; no required typing for the common path.

## 5. Data model (SQLite)

Weights are stored in pounds.

```sql
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  rep_min INTEGER NOT NULL DEFAULT 5,
  rep_max INTEGER NOT NULL DEFAULT 10,
  target_sets INTEGER NOT NULL DEFAULT 3,
  increment_lb REAL NOT NULL DEFAULT 5,
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
```

Overload suggestions and all stats are **derived from these tables**, not stored, so they are always consistent with the data.

## 6. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React Native + Expo, TypeScript |
| Navigation | Expo Router (bottom tabs) |
| Storage | expo-sqlite |
| State | React state and context (timer state at the app root) |
| Charts | react-native-gifted-charts (or Victory Native) |
| Haptics | expo-haptics |
| Keep screen on | expo-keep-awake (Timer tab, while counting down) |
| Files | expo-file-system, expo-sharing, expo-document-picker (backup/import) |
| Tests | Jest for the progression rule, conversions, e1RM, and stats queries |

**Distribution:** develop with Expo Go, then build an installable APK with EAS Build (preview profile) and sideload it onto my Android phone.

**Suggested structure**

```
app/            routes and tabs (log, stats, convert, timer)
src/db/         schema, migrations, queries
src/logic/      suggestNext, e1rm, conversions (pure, tested)
src/components/ set row, stepper, charts, badge
src/timer/      timer context and hook
```

## 7. Build order

1. **Foundation:** Expo project, tabs, SQLite schema and migrations.
2. **Exercises and logging:** add exercises, start a session, log sets with prefill, finish and save.
3. **History:** session list and detail with edit/delete.
4. **Overload helper:** `suggestNext` with unit tests, then the badge, accept/edit/dismiss flow.
5. **Convert tab:** converter plus "Use in Log".
6. **Timer tab:** countdown, presets, root-level state, in-app alert, keep-awake.
7. **Statistics:** strength trend and e1RM, volume, PRs, consistency, time filters.
8. **Backup:** JSON export/import and CSV export.
9. **Polish and ship:** dark mode, empty states, edge cases, EAS APK build, and a real gym test week.

Steps 1-4 give a usable app for actual workouts; I can start using it after step 4 and let real use shape the rest.

## 8. Risks and edge cases

- **Data loss on phone reset or reinstall:** mitigated by JSON backup and the last-backup reminder.
- **Rep range vs. fixed target:** the helper triggers only at the top of the range; if I later want a different trigger, only `suggestNext` changes.
- **Mid-session app kill:** save each set to the database immediately so an unfinished session can resume.
- **Rounding when converting:** the kg-to-lb values (e.g., 20 kg = 44.09 lb) may not match real plate loads; "Use in Log" should allow editing before saving.
- **Timer without system notifications:** accepted limitation, noted in 3.5.

## 9. Possible later additions

- Deload suggestion after repeated missed targets.
- Workout templates for the three weekly full-body days.
- Optional automatic rest timer after each logged set.
- Local notification when the timer ends.
- A kg display mode if the lb-only approach becomes annoying.
- Home-screen widget or Wear OS logging.
