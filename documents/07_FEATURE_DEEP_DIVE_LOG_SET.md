# 07 - Feature Deep Dive: Logging a Workout Set

This deep dive traces the exact execution lifecycle of **logging a workout set**, from the user's touch on the "LOG SET" button down through SQLite disk persistence, double-progression calculation, and back to UI updates.

---

## 1. Feature Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Athlete Touch
    participant Btn as Button (LOG SET)<br/>src/components/ui/Button.tsx
    participant Screen as LogScreen<br/>app/(tabs)/index.tsx
    participant Logic as suggestNext<br/>src/logic/suggestNext.ts
    participant Queries as queries.ts<br/>src/db/queries.ts
    participant SQLite as SQLite (gym.db)<br/>expo-sqlite
    participant Haptics as expo-haptics
    participant TicketUI as Ticket Component<br/>app/(tabs)/index.tsx

    Athlete->>Btn: Press "LOG SET"
    Btn->>Haptics: impactAsync(Light)
    Btn->>Screen: handleLogSet(selectedExercise)
    
    Note over Screen: Step 1: Target Boundary Check<br/>sets.filter(s => s.exercise_id === ex.id)<br/>Verify count < ex.target_sets

    alt No active session exists
        Note over Screen: Step 2A: Lazy Session Creation
        Screen->>Queries: startSession(db)
        Queries->>SQLite: INSERT INTO sessions (started_at) VALUES (now.toISOString())
        SQLite-->>Queries: lastInsertRowId
        Queries->>SQLite: SELECT * FROM sessions WHERE id = lastInsertRowId
        SQLite-->>Queries: new Session
        Queries-->>Screen: session
        Note over Screen: setSession(session)
    end

    Note over Screen: Step 2B: Prepare Set Parameters<br/>weight: currentWeight (e.g. 185)<br/>reps: currentReps (e.g. 8)<br/>index: exerciseSets.length (e.g. 2)

    Screen->>Queries: addSet(db, session.id, ex.id, nextIndex, 185, 8, false)
    Queries->>SQLite: INSERT INTO sets (session_id, exercise_id, set_index, weight_lb, reps, is_warmup) VALUES (?, ?, ?, ?, ?, 0)
    SQLite-->>Queries: SQL execution complete
    Queries-->>Screen: Promise resolved

    Screen->>Haptics: impactAsync(Light)

    Note over Screen: Step 3: Refresh Active Session Sets
    Screen->>Queries: getSetsForSession(db, session.id)
    Queries->>SQLite: SELECT sets.*, exercises.name FROM sets JOIN exercises ... WHERE session_id = ?
    SQLite-->>Queries: rows array
    Queries-->>Screen: updatedSets
    Note over Screen: setSets(updatedSets)

    Note over Screen: Step 4: Sync Exercise Default Weight
    Screen->>Queries: updateExerciseDefaultWeight(db, ex.id, 185)
    Queries->>SQLite: UPDATE exercises SET default_weight_lb = 185 WHERE id = ex.id
    Note over Screen: setExercises(prev => prev.map(...))

    Note over Screen: Step 5: Double Progression Verification
    Screen->>Logic: suggestNext(ex, workingSets)
    Note over Logic: Check: workingSets.length >= ex.target_sets<br/>AND every working set reached rep_max (e.g. 8 >= 8)
    Logic-->>Screen: { shouldIncrease: true, suggestedWeightLb: 190 }
    
    alt Overload criteria met
        Note over Screen: setSuggestion({ shouldIncrease: true, suggestedWeightLb: 190 })
    end

    Note over Screen: Step 6: Reset Default Input Reps
    Note over Screen: setCurrentReps(Math.min(ex.rep_max, ex.rep_min))

    Screen->>TicketUI: Trigger React Re-render
    Note over TicketUI: - Appends new SetRow(index=03, 185 LB, 8 REPS)<br/>- Updates header badge to DONE or 3/3<br/>- If shouldIncrease: renders Overload Banner "+5 LB -> 190 LB"
    TicketUI-->>Athlete: Visual Confirmation on Screen
```

---

## 2. Step-by-Step Execution Breakdown

### Step 1: User Touch & Tactile Feedback
- **File**: [`src/components/ui/Button.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L37-L45)
- **Component / Function**: [`Button.handlePress()`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L37)
- **Data In**: Physical press event on the primary button.
- **Data Out**: Triggers `onPress()` callback passed down from `LogScreen`.
- **Responsibility**: Provides immediate hardware tactile feedback using `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` and invokes the screen-level handler without blocking the JS thread.

---

### Step 2: Boundary Validation & Lazy Session Initialization
- **File**: [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L177-L196)
- **Component / Function**: [`LogScreen.handleLogSet(ex: Exercise)`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L177)
- **Data In**:
  - `ex`: Active [`Exercise`](file:///home/leinnarf/Project/Gym%20App/src/db/types.ts#L1) object (e.g. Romanian Deadlift, target_sets: 3).
  - `sets`: Current working set list in React state.
  - `session`: Current active session state (or `null`).
- **Data Out**:
  - Validates `exerciseSets.length < ex.target_sets`. If already at 3 sets, interrupts execution with an `Alert.alert('Target Reached')`.
  - If `session === null`, calls [`startSession(db)`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts#L10) which inserts a new session row and updates state via `setSession(currentSession)`.
- **Responsibility**: Enforces workout boundaries and ensures that an active session row exists before inserting set records.

---

### Step 3: SQLite Set Record Persistence
- **File**: [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts#L119-L132)
- **Component / Function**: [`addSet()`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts#L119)
- **Data In**:
  - `db`: Active `SQLiteDatabase` instance.
  - `sessionId`: `number` (e.g. `14`).
  - `exerciseId`: `number` (e.g. `7`).
  - `setIndex`: `number` (calculated as `exerciseSets.length`, e.g. `2` for the 3rd set).
  - `weightLb`: `number` (e.g. `205`).
  - `reps`: `number` (e.g. `8`).
  - `isWarmup`: `boolean` (`false`).
- **Data Out**: Resolves `Promise<void>`.
- **Responsibility**: Executes parameterized SQL insert:
  ```sql
  INSERT INTO sets (session_id, exercise_id, set_index, weight_lb, reps, is_warmup)
  VALUES (?, ?, ?, ?, ?, 0);
  ```
  Writes the record to disk with Write-Ahead Logging (`WAL`).

---

### Step 4: Synchronizing State & Updating Default Weight
- **File**: [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts#L93-L102) & [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L209-L218)
- **Component / Function**: [`updateExerciseDefaultWeight()`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts#L93) and `getSetsForSession()`
- **Data In**: `exerciseId`, `currentWeight` (205 lb), and `session.id`.
- **Data Out**:
  - SQLite: `UPDATE exercises SET default_weight_lb = 205 WHERE id = 7;`
  - React State: `setExercises` updates the cached in-memory exercise definition.
  - React State: `setSets` receives the full refreshed list of `SetRecord` entries for the active session.
- **Responsibility**: Guarantees that the app remembers the most recent working weight for future sessions and synchronizes the UI state with the database.

---

### Step 5: Double Progression Overload Calculation
- **File**: [`src/logic/suggestNext.ts`](file:///home/leinnarf/Project/Gym%20App/src/logic/suggestNext.ts#L8-L42)
- **Component / Function**: [`suggestNext(exercise: Exercise, lastSessionSets: SetRecord[])`](file:///home/leinnarf/Project/Gym%20App/src/logic/suggestNext.ts#L8)
- **Data In**:
  - `exercise`: `rep_min: 6`, `rep_max: 8`, `target_sets: 3`, `increment_lb: 5`.
  - `lastSessionSets`: Filtered working sets for this exercise:
    `[{ reps: 8, weight_lb: 205 }, { reps: 8, weight_lb: 205 }, { reps: 8, weight_lb: 205 }]`.
- **Data Out**: Returns `ProgressionSuggestion`:
  ```ts
  {
    shouldIncrease: true,
    suggestedWeightLb: 210
  }
  ```
- **Responsibility**: Evaluates the Double Progression rule: if every target working set completed all `rep_max` reps, calculate the next load (`currentWeight + increment_lb`). If triggered, `setSuggestion(curSug)` renders the prompt banner.

---

### Step 6: UI Ticket Re-render
- **File**: [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L463-L540) & [`src/components/ui/SetRow.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L18)
- **Component / Function**: `LogScreen` ticket view and `SetRow` component.
- **Data In**: Updated `sets` array and active `suggestion`.
- **Data Out**: Re-renders UI elements on screen:
  1. **New Set Row**: Displays `03 | 205 LB | 8 REPS | [Trash]`.
  2. **Exercise Badge**: Switches from `2/3` to `DONE` with overload styling.
  3. **Overload Banner**: Renders above steppers:
     `"READY +5 LB → 210 LB | TAP TO APPLY"`.
  4. **Rep Stepper**: Resets to base rep recommendation (`rep_min` or `rep_max`).
- **Responsibility**: Provides immediate visual feedback to the athlete so they know the set is logged and what weight to tackle next.
