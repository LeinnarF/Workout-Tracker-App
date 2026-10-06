# 04 - Data Flow Map

This document tracks how data moves through the Gym App, showing the transformation of values from direct user interactions down through state, repositories, and SQLite persistence, and back up to UI re-renders.

---

## 1. End-to-End Data Pipeline Architecture

```mermaid
flowchart TD
    subgraph UIInput["1. User Interaction"]
        InputTouch["Physical Touch Gesture<br/>(Stepper press or 'LOG SET' tap)"]
    end

    subgraph ComponentLevel["2. Component Event Processing"]
        Comp["UI Component<br/>Stepper.tsx / Button.tsx"]
        CompHandler["Local Event Handlers<br/>handleStep() / handlePress()"]
    end

    subgraph StateLevel["3. Screen State Update"]
        ScreenState["React State (index.tsx)<br/>setCurrentWeight(val) / handleLogSet()"]
    end

    subgraph HookLevel["4. Context & Provider Hooks"]
        HookSQLite["useSQLiteContext()<br/>Active SQLiteDatabase connection"]
        HookTheme["useTheme()<br/>Theme tokens & color palettes"]
    end

    subgraph RepositoryLevel["5. Repository / Data Access"]
        RepoQuery["queries.ts<br/>addSet(db, sessionId, exerciseId, setIndex, weight, reps)"]
    end

    subgraph DatabaseLevel["6. SQLite Persistence"]
        DBEngine["SQLite Database (gym.db)<br/>INSERT INTO sets ..."]
    end

    subgraph ReturnPipeline["7. Return & State Synchronization"]
        FetchUpdated["queries.ts<br/>getSetsForSession(db, sessionId)"]
        StateCommit["React State Dispatch<br/>setSets(updatedSets)"]
    end

    subgraph RerenderPipeline["8. UI Re-render"]
        ReRender["Virtual DOM Diff & Re-render<br/>Appends SetRow, updates Badge, checks suggestNext()"]
    end

    InputTouch --> Comp
    Comp --> CompHandler
    CompHandler --> ScreenState
    ScreenState --> HookSQLite
    ScreenState --> HookTheme
    HookSQLite --> RepoQuery
    RepoQuery --> DBEngine
    DBEngine --> FetchUpdated
    FetchUpdated --> StateCommit
    StateCommit --> ReRender
```

---

## 2. Sequence Diagram: Data Pipeline for Logging a Set

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Athlete (User)
    participant StepperComp as Stepper (Weight)<br/>src/components/ui/Stepper.tsx
    participant BtnComp as Button (LOG SET)<br/>src/components/ui/Button.tsx
    participant Screen as LogScreen<br/>app/(tabs)/index.tsx
    participant Queries as queries.ts<br/>src/db/queries.ts
    participant SQLite as SQLiteDatabase<br/>gym.db
    participant Logic as suggestNext()<br/>src/logic/suggestNext.ts
    participant SetRowComp as SetRow<br/>src/components/ui/SetRow.tsx

    %% Phase 1: Input & State
    Athlete->>StepperComp: Tap '+' (current: 180 lb, step: 5)
    StepperComp->>StepperComp: handleStep(+1) -> clamps value
    StepperComp->>Screen: onChange(185)
    Note over Screen: setCurrentWeight(185)<br/>State: currentWeight = 185

    Athlete->>BtnComp: Tap "LOG SET"
    BtnComp->>BtnComp: handlePress() -> Haptics.impactAsync(Light)
    BtnComp->>Screen: onPress() -> handleLogSet(selectedExercise)

    %% Phase 2: Repository Dispatch
    Note over Screen: Check: sets.filter(s => s.exercise_id === ex.id)<br/>Length < ex.target_sets<br/>nextIndex = exSets.length (e.g. 2)
    Screen->>Queries: addSet(db, sessionId, ex.id, 2, 185, 8, false)
    
    %% Phase 3: Database Persistence
    Queries->>SQLite: db.runAsync('INSERT INTO sets ... VALUES (?, ?, ?, ?, ?, ?)', [sessionId, ex.id, 2, 185, 8, 0])
    SQLite-->>Queries: RunResult { lastInsertRowId, changes: 1 }
    Queries-->>Screen: Promise<void> resolved

    %% Phase 4: State Synchronization
    Screen->>Queries: updateExerciseDefaultWeight(db, ex.id, 185)
    Queries->>SQLite: UPDATE exercises SET default_weight_lb = 185 WHERE id = ex.id
    Screen->>Screen: setExercises(prev => prev.map(...))

    Screen->>Queries: getSetsForSession(db, sessionId)
    Queries->>SQLite: SELECT sets.*, exercises.name FROM sets JOIN exercises ... WHERE session_id = ?
    SQLite-->>Queries: Array of SetRecord objects
    Queries-->>Screen: updatedSets: (SetRecord & { exercise_name })[]
    Screen->>Screen: setSets(updatedSets)

    %% Phase 5: Overload Evaluation & Re-render
    Screen->>Logic: suggestNext(ex, exerciseWorkingSets)
    alt All working sets hit rep_max (e.g. 3 sets of 8)
        Logic-->>Screen: { shouldIncrease: true, suggestedWeightLb: 190 }
        Screen->>Screen: setSuggestion({ shouldIncrease: true, suggestedWeightLb: 190 })
    end

    Screen->>SetRowComp: Re-renders with new SetRow props: { index: 3, weight: 185, reps: 8 }
    SetRowComp-->>Athlete: Row appears with formatted "03 | 185 LB | 8 REPS"
```

---

## 3. Data Transformations: Type by Type

### Step A: Raw Input to Numerical State
- **Source**: [`src/components/ui/Stepper.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L59-L63)
- **Raw Input**: `value + direction * step` or string from `TextInput` (`"185"`).
- **Sanitized Value**: `parseFloat(cleanText)` clamped between `min: 0` and `max: undefined`.
- **Target State**: `currentWeight: number` (in [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L65)).

### Step B: Operational State to Database Schema Record
- **Source**: [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L197-L206)
- **Arguments to Repository**:
  ```ts
  addSet(
    db: SQLiteDatabase,
    sessionId: number,        // e.g. 4
    exerciseId: number,       // e.g. 2
    setIndex: number,         // e.g. 0, 1, 2
    weightLb: number,         // e.g. 185
    reps: number,             // e.g. 8
    isWarmup: boolean = false // 0
  )
  ```
- **SQL Execution**:
  ```sql
  INSERT INTO sets (session_id, exercise_id, set_index, weight_lb, reps, is_warmup)
  VALUES (?, ?, ?, ?, ?, ?);
  ```

### Step C: Database Record to UI ViewModel
- **Query Function**: [`getSetsForSession`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts#L108)
- **Returned Data Type**:
  ```ts
  interface SetRecordWithExerciseName {
    id: number;
    session_id: number;
    exercise_id: number;
    set_index: number;
    weight_lb: number;
    reps: number;
    is_warmup: number;
    exercise_name: string;
  }
  ```
- **UI Props Mapping**:
  ```tsx
  <SetRow
    key={s.id}
    index={i + 1}          // Formats to 2 digits: "01", "02", "03"
    weight={s.weight_lb}   // Numeric display: 185
    reps={s.reps}          // Numeric display: 8
    onDelete={() => handleDeleteSet(s.id)}
  />
  ```

### Step D: Analytical Transformation (Stats Screen)
- **Raw Sets in DB**: Set records with timestamps from joined sessions.
- **Transformed Daily Aggregation** ([`src/db/statsQueries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/statsQueries.ts#L99-L131)):
  ```ts
  interface DailyStat {
    date: string;         // 'YYYY-MM-DD'
    volume: number;       // SUM(weight_lb * reps)
    bestE1rm: number;     // MAX(weight_lb * (1 + reps / 30))
    bestWeight: number;   // MAX(weight_lb)
    totalReps: number;    // SUM(reps)
    setReps: number[];    // [8, 8, 8]
  }
  ```
- **Transformed Weekly Aggregation**:
  ```ts
  interface WeeklyRepStat {
    weekStart: string;          // ISO Date for Monday of that week
    label: string;              // e.g. "Oct 5"
    totalReps: number;
    maxWeight: number;
    hasWeightIncrease: boolean; // Triggers highlight styling in bar charts
  }
  ```
