<p align="center">
  <img src="assets/images/icon.png" width="128" height="128" alt="Workout Tracker Icon" />
</p>

# Workout Tracker App

A fast, clean, and **100% offline-first** mobile workout tracker built with **Expo (React Native)** and **SQLite**. Designed for streamlined gym logging, automated double-progression overload suggestions, and clear strength analytics without requiring internet, accounts, or cloud subscriptions.

---

## Key Features

### 1. Frictionless Set Logging
- **Accordion Workout View**: Clear exercise layout with exercise category tags (Upper, Lower, Core, Push, Pull, Legs) and bottom separators.
- **Smart Prefilling**: Working weights prefilled based on your last session or custom default weight.
- **Target Set Limits**: Automatically prevents over-logging once target sets are met (e.g., 3/3 sets completed), displaying a clear "Done" badge.
- **Persistent Progression Defaults**: Once a weight progression suggestion is applied, it immediately updates the default working weight for future sessions.
- **Exercise Management**: Long-press any exercise to edit target sets, rep ranges (min/max), weight increments, and default weights, or archive exercises.

### 2. Double-Progression Helper
- Built-in strength progression tracking:
  1. Train within your specified rep range (e.g. 5-10 reps).
  2. When all target sets hit the maximum rep ceiling, the app prompts a weight progression (e.g. `+5 lb`).
  3. One-tap acceptance updates the exercise default weight and tracks progression milestones.

### 3. Advanced Analytics & Stats
- **Three-Way View Switcher**: Quickly switch between **Overview**, **Charts**, and **History**.
- **Overview & PRs Dashboard**:
  - **Lifetime KPIs**: Total completed workouts, lifetime volume lifted (lb), and total sets logged.
  - **Consistency Goal Tracker**: Visual adherence indicators tailored for workout routines, plus active weekly streak tracking.
  - **Progression Radar**: Instant status of every exercise in your routine, indicating which lifts are ready to add weight vs currently in progress.
  - **Personal Records (PRs) Trophy Case**: Automatically logs all-time heaviest weights lifted, best estimated 1RM, and peak single-session volume with dates.
- **Deep-Dive Charts View**:
  - **Time-Range Filters**: Filter charts by `4W`, `3M`, `1Y`, or `All Time`.
  - **Exercise Dropdown**: Clean dropdown selector to filter charts by exercise.
  - **Weekly Total Reps (Bar Graph)**: Tracks total weekly volume in reps for each exercise, highlighting weeks where progression occurred.
  - **Estimated 1RM Trends**: Tracks calculated 1-Rep Max progress over time using the Epley formula: Weight * (1 + Reps / 30).
  - **Volume Progression**: Visualizes total workload (lb * reps) per workout.
- **Expandable Workout History**: View past sessions organized by clean calendar date, with concise rep lists (e.g. `4, 4, 4 reps`), top weights lifted, total volume, and full deletion controls.

### 4. Rest Timer
- **Circular Progress Dial**: High-resolution vector dial (`react-native-svg`) displaying remaining time, current status (`READY`, `RESTING`, `PAUSED`), and an active progress arc.
- **Transport Controls**: Intuitive square (stop/reset) and triangle/pause (start/resume/pause) controls.
- **Quick Rest Presets**: One-tap buttons for `30s`, `1:00`, `1:30`, `2:00`, `2:30`, and `3:00` to set rest periods instantly.
- **Custom Duration Input**: Direct input fields for Minutes and Seconds to customize any specific rest period.
- **Audio Chime & Haptics**: Plays a completion chime alert (`expo-audio`) and tactile haptic feedback when the timer expires. Keeps the display awake during active countdowns.

### 5. Weight Converter & Plate Calculator
- **Bi-directional Conversion**: Instant real-time conversion between Pounds (lb) and Kilograms (kg).
- **Plate-Only Breakdown**: Calculates plate loading per side without including barbell tare weight.
- **Quick Weight Presets**: Fast milestone buttons for common weight increments and dumbbell racks.

### 6. Theme Customization & Privacy
- **Accent Color Themes**: Personalize the interface with selectable accent themes (Neon Volt, Electric Crimson, Hyper Cyan, Sunset Amber, Emerald Forge, Deep Violet, Monolith White).
- **100% Offline & Private**: All workouts, sets, and progress data are stored strictly locally in an on-device SQLite database. Zero network access required.
- **Full Data Portability**:
  - **JSON Backup & Restore**: Export full database snapshots and restore them anytime.
  - **CSV Export**: Export clean CSV spreadsheets to analyze your training in external tools.

---

## Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev) with [React Native 0.86](https://reactnative.dev)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Database**: `expo-sqlite` (Local persistent SQLite engine)
- **Charts & Graphics**: `react-native-gifted-charts` & `react-native-svg`
- **Audio & Haptics**: `expo-audio`, `expo-haptics`, `expo-keep-awake`
- **File System & Sharing**: `expo-file-system`, `expo-sharing`
- **Language**: TypeScript

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/client) app installed on your physical mobile device (Android / iOS) or an Android/iOS emulator

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:LeinnarF/Workout-Tracker-App.git
   cd Workout-Tracker-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code using Expo Go (Android) or the Camera app (iOS) to run the app on your phone.

---

## Project Structure

```text
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Log Tab: Workout exercises, set logging, double progression
│   │   ├── stats.tsx          # Stats Tab: Overview KPIs, progression charts, workout history
│   │   ├── convert.tsx        # Convert Tab: Weight converter & plate calculator
│   │   ├── timer.tsx          # Timer Tab: Circular dial countdown timer with presets
│   │   ├── settings.tsx       # Settings Tab: Backup, restore, CSV export, & theme selector
│   │   └── _layout.tsx        # Bottom tab bar navigator configuration
│   ├── +html.tsx              # Web root template
│   ├── +not-found.tsx         # 404 handler
│   └── _layout.tsx            # Root layout, SQLite provider, Theme provider, Timer provider
├── assets/
│   ├── audio/                 # Timer completion sound assets
│   └── images/                # App icon, adaptive icon layers, splash icon, and favicon
├── src/
│   ├── components/
│   │   ├── ui/                # Reusable design system primitives (Badge, Button, Screen, Stepper, etc.)
│   │   ├── ExerciseActionModal.tsx # Exercise options modal (edit, archive, details)
│   │   ├── ExerciseModal.tsx  # Modal for adding and editing exercise parameters
│   │   └── FinishWorkoutModal.tsx  # Workout summary and completion prompt
│   ├── db/
│   │   ├── schema.ts          # SQLite schema migrations, tables, and preset seeds
│   │   ├── queries.ts         # Exercise, session, and set database CRUD queries
│   │   ├── statsQueries.ts    # Weekly rep counts, 1RM, KPIs, and history queries
│   │   ├── seedDemoData.ts    # Demo data generator for local testing
│   │   └── types.ts           # TypeScript interfaces (Exercise, SetRecord, Session)
│   ├── logic/
│   │   ├── conversions.ts     # Weight unit conversion and 1RM calculation helpers
│   │   └── suggestNext.ts     # Double progression overload recommendation logic
│   ├── theme/
│   │   ├── tokens.ts          # Color tokens, typography, and palette definitions
│   │   ├── ThemeContext.tsx   # Accent theme state provider
│   │   └── useTheme.ts        # Hook for consuming active theme colors
│   └── timer/
│       └── TimerContext.tsx   # Global rest timer provider, keep-awake, and audio alerts
└── package.json
```

---

## Verification Commands

```bash
# Typecheck
npx tsc --noEmit

# Lint
npx expo lint

# Doctor diagnostics
npx expo-doctor
```

---

## License
This project is licensed under the [MIT License](LICENSE).
