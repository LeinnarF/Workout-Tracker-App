# 03 - User Flow Map

This document visually traces each major user journey through the Gym App, identifying the specific files, UI components, handlers, and database functions involved at every step.

---

## 1. Flow: Opening the App (Launch & Initialization)

```mermaid
flowchart TD
    A["User taps app icon"] --> B["RootLayout mounts<br/>app/_layout.tsx"]
    B --> C["SplashScreen.preventAutoHideAsync()"]
    B --> D["useFonts() loads IBM Plex Mono & Sans fonts"]
    B --> E["ThemeProvider mounts<br/>src/theme/ThemeContext.tsx"]
    E --> F["Load theme_preference.txt & accent_preference.txt<br/>from expo-file-system"]
    B --> G["SQLiteProvider connects to 'gym.db'<br/>Calls onInit: migrateDbIfNeeded()<br/>src/db/schema.ts"]
    G --> H["TimerProvider mounts<br/>src/timer/TimerContext.tsx"]
    H --> I["SplashScreen.hideAsync()"]
    I --> J["LogScreen mounts<br/>app/(tabs)/index.tsx"]
    J --> K["loadData() runs"]
    K --> L["ensurePresetExercises(db)<br/>src/db/queries.ts"]
    K --> M["getExercises(db)<br/>src/db/queries.ts"]
    K --> N["getActiveSession(db)<br/>src/db/queries.ts"]
    N --> O["UI renders exercise ticket list"]
```

- **Files Involved**:
  - [`app/_layout.tsx`](file:///home/leinnarf/Project/Gym%20App/app/_layout.tsx)
  - [`src/theme/ThemeContext.tsx`](file:///home/leinnarf/Project/Gym%20App/src/theme/ThemeContext.tsx)
  - [`src/db/schema.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/schema.ts) (`migrateDbIfNeeded`)
  - [`src/timer/TimerContext.tsx`](file:///home/leinnarf/Project/Gym%20App/src/timer/TimerContext.tsx)
  - [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx) (`loadData`)
  - [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts) (`ensurePresetExercises`, `getExercises`, `getActiveSession`)

---

## 2. Flow: Starting a Workout (Creating a Session)

> [!NOTE]
> Sessions in this codebase are **lazily created**. A user does not have to press an explicit "Start Workout" button; tapping an exercise and logging the very first set automatically creates the session.

```mermaid
flowchart TD
    A["User taps an exercise card"] --> B["handleSelectExercise(ex)<br/>app/(tabs)/index.tsx"]
    B --> C["getLastSessionSetsForExercise(db, ex.id, session?.id)<br/>src/db/queries.ts"]
    B --> D["Compute base weight & reps<br/>(from default_weight_lb or last set)"]
    B --> E["suggestNext(latestEx, history)<br/>src/logic/suggestNext.ts"]
    B --> F["Ticket expands showing Steppers and 'LOG SET' button"]
    F --> G["User taps 'LOG SET'"]
    G --> H["handleLogSet(ex)<br/>app/(tabs)/index.tsx"]
    H --> I{"Does session exist in state?"}
    I -- "No (First set of day)" --> J["startSession(db)<br/>src/db/queries.ts"]
    J --> K["INSERT INTO sessions (started_at) VALUES (now)"]
    K --> L["setSession(newSession)"]
    I -- "Yes (Workout in progress)" --> M["Use existing session.id"]
    L --> N["Proceed to set insertion"]
    M --> N
```

- **Files Involved**:
  - [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx) (`handleSelectExercise`, `handleLogSet`)
  - [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts) (`getLastSessionSetsForExercise`, `startSession`)
  - [`src/logic/suggestNext.ts`](file:///home/leinnarf/Project/Gym%20App/src/logic/suggestNext.ts) (`suggestNext`)

---

## 3. Flow: Adding a Custom Exercise

```mermaid
flowchart TD
    A["User taps '+' button in Log header"] --> B["setExerciseModalVisible(true)<br/>app/(tabs)/index.tsx"]
    B --> C["ExerciseModal opens<br/>src/components/ExerciseModal.tsx"]
    C --> D["User enters Name, Target Sets, Rep Min/Max, Increment, Default Weight, Tags"]
    D --> E["User taps 'CREATE' button"]
    E --> F["handleSave() in ExerciseModal validates input"]
    F --> G["handleSaveExerciseModal(data)<br/>app/(tabs)/index.tsx"]
    G --> H["addExercise(db, name, repMin, repMax, targetSets, incrementLb, defaultWeightLb, tags)<br/>src/db/queries.ts"]
    H --> I["INSERT INTO exercises (...) VALUES (...)"]
    I --> J["Haptics.notificationAsync(Success)"]
    J --> K["loadData() reloads exercise list"]
    K --> L["ExerciseModal closes; new exercise appears in ticket list"]
```

- **Files Involved**:
  - [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx) (`handleSaveExerciseModal`)
  - [`src/components/ExerciseModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseModal.tsx)
  - [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts) (`addExercise`)

---

## 4. Flow: Logging a Set & Double Progression Overload

```mermaid
flowchart TD
    A["User adjusts Steppers (Weight / Reps)"] --> B["setCurrentWeight() / setCurrentReps()"]
    B --> C["User taps 'LOG SET'"]
    C --> D["handleLogSet(ex)<br/>app/(tabs)/index.tsx"]
    D --> E{"Are target sets already reached?"}
    E -- "Yes" --> F["Show Alert: 'Target Reached'"]
    E -- "No" --> G["addSet(db, session.id, ex.id, nextIndex, weight, reps, false)<br/>src/db/queries.ts"]
    G --> H["INSERT INTO sets (...)"]
    H --> I["Haptics.impactAsync(Light)"]
    I --> J["getSetsForSession(db, session.id) refreshes sets state"]
    J --> K["updateExerciseDefaultWeight(db, ex.id, weight)"]
    K --> L{"Did exercise complete all target sets?"}
    L -- "Yes" --> M["suggestNext(ex, workingSets)<br/>src/logic/suggestNext.ts"]
    M --> N{"Did all sets reach rep_max?"}
    N -- "Yes" --> O["setSuggestion(curSug) -> Displays Overload Banner<br/>'READY +X LB -> Apply'"]
    N -- "No" --> P["No overload suggestion"]
    L -- "No" --> P
    P --> Q["SetRow renders in ticket table"]
    O --> Q
```

- **Files Involved**:
  - [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx) (`handleLogSet`, `handleAcceptSuggestion`)
  - [`src/components/ui/Stepper.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx)
  - [`src/components/ui/Button.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx)
  - [`src/components/ui/SetRow.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx)
  - [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts) (`addSet`, `getSetsForSession`, `updateExerciseDefaultWeight`)
  - [`src/logic/suggestNext.ts`](file:///home/leinnarf/Project/Gym%20App/src/logic/suggestNext.ts) (`suggestNext`)

---

## 5. Flow: Editing an Exercise vs Deleting a Set

```mermaid
flowchart TD
    subgraph S1["Action: Deleting / Re-logging a Set"]
        A1["User taps Trash icon on SetRow"] --> A2["handleDeleteSet(setId)<br/>app/(tabs)/index.tsx"]
        A2 --> A3["deleteSet(db, setId)<br/>src/db/queries.ts"]
        A3 --> A4["DELETE FROM sets WHERE id = ?"]
        A4 --> A5["getSetsForSession(db, session.id)"]
        A5 --> A6{"Any sets left in session?"}
        A6 -- "No" --> A7["DELETE FROM sessions WHERE id = ?<br/>setSession(null)"]
        A6 -- "Yes" --> A8["setSets(updatedSets)"]
    end

    subgraph S2["Action: Editing Exercise Target Parameters"]
        B1["User long-presses Exercise Header"] --> B2["handleExerciseLongPress(ex)<br/>app/(tabs)/index.tsx"]
        B2 --> B3["ExerciseActionModal mounts<br/>src/components/ExerciseActionModal.tsx"]
        B3 --> B4["User taps 'EDIT EXERCISE'"]
        B4 --> B5["ExerciseModal opens prefilled<br/>src/components/ExerciseModal.tsx"]
        B5 --> B6["User modifies target sets, rep boundaries, increments, or tags"]
        B6 --> B7["updateExercise(db, id, ...)<br/>src/db/queries.ts"]
        B7 --> B8["loadData() updates tickets in view"]
    end
```

- **Files Involved**:
  - [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx) (`handleDeleteSet`, `handleExerciseLongPress`)
  - [`src/components/ExerciseActionModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseActionModal.tsx)
  - [`src/components/ExerciseModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseModal.tsx)
  - [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts) (`deleteSet`, `updateExercise`)

---

## 6. Flow: Completing a Workout Session

```mermaid
flowchart TD
    A["User taps 'FINISH' in header"] --> B["handleFinishWorkout()<br/>app/(tabs)/index.tsx"]
    B --> C["Compute totalSets & totalVolumeLb from sets array"]
    C --> D["FinishWorkoutModal opens<br/>src/components/FinishWorkoutModal.tsx"]
    D --> E["User reviews metrics and taps 'FINISH WORKOUT'"]
    E --> F["handleConfirmFinish()<br/>app/(tabs)/index.tsx"]
    F --> G["finishSession(db, session.id)<br/>src/db/queries.ts"]
    G --> H["UPDATE sessions SET ended_at = ISO timestamp WHERE id = ?"]
    H --> I["Haptics.notificationAsync(Success)"]
    I --> J["Reset local states: setSession(null), setSets([]), setSelectedExerciseId(null)"]
    J --> K["FinishWorkoutModal closes; screen resets to clean idle state"]
```

- **Files Involved**:
  - [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx) (`handleFinishWorkout`, `handleConfirmFinish`)
  - [`src/components/FinishWorkoutModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/FinishWorkoutModal.tsx)
  - [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts) (`finishSession`)

---

## 7. Flow: Viewing Progress, Charts & Past Sessions

```mermaid
flowchart TD
    A["User taps 'Stats' Tab"] --> B["StatsScreen mounts<br/>app/(tabs)/stats.tsx"]
    B --> C["loadAll() fires via useFocusEffect"]
    
    subgraph V1["View 1: OVERVIEW Mode"]
        C --> D1["getLifetimeStats(db)<br/>src/db/statsQueries.ts"]
        C --> D2["getExercisePRs(db)<br/>src/db/statsQueries.ts"]
        C --> D3["getAllExercisesOverloadStatus(db)<br/>src/db/statsQueries.ts"]
        D1 & D2 & D3 --> D4["Renders: Total workouts, Volume, Consecutive Streak, Overload Queue, PRs"]
    end

    subgraph V2["View 2: CHARTS Mode"]
        E1["User switches tab to 'CHARTS'"] --> E2["User selects Exercise & TimeRange (4W, 3M, 1Y, ALL)"]
        E2 --> E3["getStatsForExercise(db, exerciseId, timeRange)<br/>src/db/statsQueries.ts"]
        E3 --> E4{"Selected metric?"}
        E4 -- "Weight" --> E5["Renders LineChart of Best Weight & E1RM"]
        E4 -- "Reps" --> E6["Renders BarChart of Weekly Reps with overload highlights"]
    end

    subgraph V3["View 3: HISTORY Mode"]
        F1["User switches tab to 'HISTORY'"] --> F2["getPastSessions(db)<br/>src/db/statsQueries.ts"]
        F2 --> F3["Renders list of past session cards"]
        F3 --> F4["User taps session card -> handleToggleSession(sessionId)"]
        F4 --> F5["getSessionSets(db, sessionId)<br/>src/db/statsQueries.ts"]
        F5 --> F6["groupSessionSets() consolidates sets"]
        F6 --> F7["Accordion expands showing exercise breakdown and 'DELETE' action"]
    end
```

- **Files Involved**:
  - [`app/(tabs)/stats.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/stats.tsx)
  - [`src/db/statsQueries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/statsQueries.ts) (`getLifetimeStats`, `getExercisePRs`, `getAllExercisesOverloadStatus`, `getStatsForExercise`, `getPastSessions`, `getSessionSets`)
  - [`src/logic/conversions.ts`](file:///home/leinnarf/Project/Gym%20App/src/logic/conversions.ts) (`calculateE1RM`)
