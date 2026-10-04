# 🏋️‍♂️ Workout Tracker App

A fast, clean, and **100% offline-first** mobile workout tracker built with **Expo (React Native)** and **SQLite**. Designed for streamlined gym logging, automated double-progression overload suggestions, and clear strength analytics without requiring internet, accounts, or cloud subscriptions.

---

## 🌟 Key Features

### 1. 📝 Frictionless Set Logging
- **Instant Access**: Direct accordion layout with preset compound exercises ready to log immediately.
- **Smart Prefilling**: Working weights prefilled based on your last session or custom default weight (default rep count set to 4).
- **Target Set Limits**: Automatically prevents over-logging once target sets are met (e.g., 3/3 sets completed), displaying a clear "Done" badge.
- **Auto-Session Tracking**: Automatically manages active workouts in the background.
- **Exercise Management**: Long-press any exercise to edit target sets, rep ranges (min/max), weight increments, and default weights, or archive exercises.

### 2. ⚡ Double-Progression Helper
- Built-in strength progression tracking:
  1. Train within your specified rep range (e.g. 5–10 reps).
  2. When all target sets hit the maximum rep ceiling, the app prompts a weight progression (e.g. `+5 lb`).
  3. One-tap acceptance updates the exercise default weight and tracks progression milestones.

### 3. 📊 Advanced Analytics & Stats
- **Three-Way View Switcher**: Quickly switch between **`Overview`**, **`Charts`**, and **`History`**.
- **Overview & PRs Dashboard**:
  - **Lifetime KPIs**: Total completed workouts, lifetime volume lifted (lb), and total sets logged.
  - **3x/Week Consistency Goal Tracker**: Visual adherence indicators (`● ● ○`) tailored for a 3-day full-body routine, plus active weekly streak tracking (`🔥 X Week Streak`).
  - **Progression Radar**: Instant status of every exercise in your routine, indicating which lifts are ready to add weight (`Ready → 55 lb`) vs currently in progress.
  - **Personal Records (PRs) Trophy Case**: Automatically logs all-time heaviest weights lifted, best estimated 1RM, and peak single-session volume with dates.
- **Deep-Dive Charts View**:
  - **Time-Range Filters**: Filter charts by `4W`, `3M`, `1Y`, or `All Time`.
  - **Exercise Dropdown**: Clean dropdown selector to filter charts by exercise.
  - **Weekly Total Reps (Bar Graph)**: Tracks total weekly volume in reps for each exercise, dynamically turning **Green** on weeks where a weight increase occurred, and **Blue** on standard weeks.
  - **Estimated 1RM Trends**: Tracks calculated 1-Rep Max progress over time using the Epley formula: $\text{Weight} \times (1 + \frac{\text{Reps}}{30})$.
  - **Volume Progression**: Visualizes total workload (lb × reps) per workout.
- **Expandable Workout History**: View every past session with full set breakdown (`Set 1: 50 lb × 4`), top weights lifted, and total volume.

### 4. ⏱️ Rest Timer
- **Circular Progress Dial**: High-resolution vector dial (`react-native-svg`) displaying remaining time, current status (`READY`, `RESTING`, `PAUSED`), and an active progress arc.
- **Minimalist Transport Controls**: Intuitive square (■ stop/reset) and triangle/pause (▶ start/resume, ❚❚ pause) buttons.
- **Quick Rest Presets**: One-tap buttons for `30s`, `1:00`, `1:30`, `2:00`, `2:30`, and `3:00` to set rest periods instantly.
- **Custom Duration Input**: Direct input fields for Minutes and Seconds to customize any specific rest period.
- **Screen Keep-Awake & Haptics**: Keeps your phone awake while counting down and triggers tactile vibration alerts on completion.

### 5. ⚖️ Weight Converter & Plate Calculator
- **Bi-directional Conversion**: Instant real-time conversion between Pounds (lb) and Kilograms (kg).
- **Barbell Plate Calculator**: Automatically breaks down Olympic barbell loads (45 lb bar) into plates needed per side (`45`, `35`, `25`, `10`, `5`, `2.5` lb).
- **Quick Barbell Milestones**: Fast buttons for common barbell weights (`45`, `135`, `185`, `225`, `275`, `315`, `405` lb).
- **Dumbbell Presets**: Quick references for rack dumbbells (`15` to `100` lb).

### 6. 🔒 100% Offline & Private
- All workouts, sets, and progress data are stored strictly locally in an on-device SQLite database.
- **Zero internet connection required**; fully functional in airplane mode.
- **Full Data Portability**:
  - **JSON Backup & Restore**: Export full database snapshots and restore them anytime.
  - **CSV Export**: Export clean CSV spreadsheets to analyze your training in Excel, Google Sheets, or Python.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev) with [React Native 0.86](https://reactnative.dev)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Database**: `expo-sqlite` (Local persistent SQLite engine)
- **Charts & Graphics**: `react-native-gifted-charts` & `react-native-svg`
- **Haptics & Device**: `expo-haptics`, `expo-keep-awake`, `expo-file-system`, `expo-sharing`
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/client) app installed on your physical mobile device (Android / iOS)

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

## 📂 Project Structure

```text
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Log Tab: Workout exercises, set logging, double progression
│   │   ├── stats.tsx          # Stats Tab: Workout history and progression charts
│   │   ├── convert.tsx        # Convert Tab: Weight converter & barbell plate calculator
│   │   ├── timer.tsx          # Timer Tab: Circular dial countdown timer with presets
│   │   └── settings.tsx       # Settings Tab: Backup, restore, CSV export, & app settings
│   ├── modal.tsx              # Settings Modal: Backup & restore (legacy route)
│   └── _layout.tsx            # Root tab navigator & providers
├── src/
│   ├── db/
│   │   ├── schema.ts          # SQLite schema migrations & preset seeds
│   │   ├── queries.ts         # Exercise, session, and set database CRUD queries
│   │   ├── statsQueries.ts    # Weekly rep counts, 1RM, and history queries
│   │   └── types.ts           # TypeScript interfaces (Exercise, SetRecord, Session)
│   ├── timer/
│   │   └── TimerContext.tsx   # Global rest timer provider & keep-awake state
│   ├── logic/
│   │   ├── overload.ts        # Double progression overload helper pure functions
│   │   └── conversions.ts     # Weight and 1RM calculation helpers
│   └── components/
│       ├── ExerciseModal.tsx  # Modal for adding & editing exercises
│       └── Stepper.tsx        # Numeric stepper with tap-to-type input
└── package.json
```

---

## 🧪 Verification Commands

```bash
# Typecheck
npx tsc --noEmit

# Lint
npx expo lint
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
