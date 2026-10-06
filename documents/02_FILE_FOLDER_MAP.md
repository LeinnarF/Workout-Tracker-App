# 02 - File and Folder Responsibility Map

This map outlines the project directory structure, highlighting the essential files that shape the architecture and stating the single core responsibility of each file.

---

## Codebase Tree Structure

```
Gym App/
├── app/
│   ├── _layout.tsx                     
│   └── (tabs)/
│       ├── _layout.tsx                 
│       ├── index.tsx                   
│       ├── stats.tsx                   
│       ├── timer.tsx                   
│       ├── convert.tsx                 
│       └── settings.tsx                
├── src/
│   ├── db/
│   │   ├── schema.ts                   
│   │   ├── types.ts                    
│   │   ├── queries.ts                  
│   │   ├── statsQueries.ts             
│   │   └── seedDemoData.ts             
│   ├── logic/
│   │   ├── suggestNext.ts              
│   │   └── conversions.ts              
│   ├── timer/
│   │   └── TimerContext.tsx            
│   ├── theme/
│   │   ├── tokens.ts                   
│   │   ├── ThemeContext.tsx            
│   │   └── useTheme.ts                 
│   └── components/
│       ├── ExerciseModal.tsx           
│       ├── ExerciseActionModal.tsx     
│       ├── FinishWorkoutModal.tsx      
│       └── ui/
│           ├── Screen.tsx              
│           ├── Button.tsx              
│           ├── Stepper.tsx             
│           ├── SetRow.tsx              
│           ├── Badge.tsx               
│           ├── Field.tsx               
│           ├── Rule.tsx                
│           ├── Text.tsx                
│           └── index.ts                
```

---

## Architectural Responsibility Map

### Navigation & Routes (`app/`)
- [`app/_layout.tsx`](file:///home/leinnarf/Project/Gym%20App/app/_layout.tsx): Bootstraps global application dependencies by loading custom fonts, applying the database migration schema, and wrapping the view tree in theme, SQLite, and timer providers.
- [`app/(tabs)/_layout.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx): Defines the bottom tab bar navigation layout and custom industrial tab bar component with tactile haptic feedback.
- [`app/(tabs)/index.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx): Serves as the primary workout screen where users select exercises, tune weights and reps with steppers, log sets, and view active workout progress.
- [`app/(tabs)/stats.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/stats.tsx): Displays lifetime workout statistics, personal records, progressive overload queue, interactive charts, and collapsible past session history.
- [`app/(tabs)/timer.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/timer.tsx): Provides an interactive rest timer featuring quick interval presets, custom duration entry, a +30s booster, and segmented progress bars.
- [`app/(tabs)/convert.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/convert.tsx): Translates weights between pounds and kilograms and calculates the required barbell plate breakdown per side.
- [`app/(tabs)/settings.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/settings.tsx): Manages application preferences including light/dark theme modes, accent color selection, rest timer chimes, and JSON/CSV backup exports.

---

### Database Layer (`src/db/`)
- [`src/db/schema.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/schema.ts): Manages SQLite database versioning, table creation, foreign key constraints, WAL configuration, and preset exercise seeding.
- [`src/db/types.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/types.ts): Declares TypeScript interfaces and types for database entities, statistical metrics, personal records, and overload statuses.
- [`src/db/queries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/queries.ts): Executes fundamental CRUD database queries for managing active workout sessions, exercise definitions, and logged sets.
- [`src/db/statsQueries.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/statsQueries.ts): Performs analytical aggregations to calculate lifetime workout volume, consecutive week streaks, PR thresholds, and chart data.
- [`src/db/seedDemoData.ts`](file:///home/leinnarf/Project/Gym%20App/src/db/seedDemoData.ts): Generates a realistic multi-week workout history across alternating training routines to facilitate development and testing.

---

### Domain Business Logic (`src/logic/`)
- [`src/logic/suggestNext.ts`](file:///home/leinnarf/Project/Gym%20App/src/logic/suggestNext.ts): Evaluates previous set performance against target sets and maximum reps to calculate whether an exercise is ready for a progressive overload weight increase.
- [`src/logic/conversions.ts`](file:///home/leinnarf/Project/Gym%20App/src/logic/conversions.ts): Houses pure mathematical functions for imperial and metric unit conversions and estimated 1-rep-max calculations.

---

### Ambient State & Providers (`src/theme/`, `src/timer/`)
- [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts): Centralizes typography specifications, spacing scales, border metrics, and theme palettes for light and dark modes across eight accent colors.
- [`src/theme/ThemeContext.tsx`](file:///home/leinnarf/Project/Gym%20App/src/theme/ThemeContext.tsx): Manages and persists theme mode and accent color state to the device filesystem.
- [`src/theme/useTheme.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/useTheme.ts): Exposes a convenient consumer hook for components to access current theme tokens and mode-switching functions.
- [`src/timer/TimerContext.tsx`](file:///home/leinnarf/Project/Gym%20App/src/timer/TimerContext.tsx): Coordinates global rest timer state, keep-awake screen locks, high-precision countdown intervals, and audio alerts.

---

### Domain Modals (`src/components/`)
- [`src/components/ExerciseModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseModal.tsx): Presents a form modal for creating or editing an exercise's name, target sets, rep boundaries, weight increments, default weights, and tags.
- [`src/components/ExerciseActionModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseActionModal.tsx): Displays an options sheet when an exercise item is long-pressed, enabling quick editing or soft-deletion.
- [`src/components/FinishWorkoutModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/FinishWorkoutModal.tsx): Summarizes total completed sets and lifted volume before confirming the finalization of an active workout session.

---

### UI Primitives (`src/components/ui/`)
- [`src/components/ui/Screen.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx): Provides a uniform screen container with safe-area handling, header titles, action buttons, and scroll support.
- [`src/components/ui/Button.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx): Renders primary or secondary industrial-style push buttons with haptic feedback and loading indicators.
- [`src/components/ui/Stepper.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx): Offers an interactive numeric control with increment/decrement steppers, direct keyboard editing, and repeating press support.
- [`src/components/ui/SetRow.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx): Renders a single set's index, weight, reps, PR tag, and delete action within a workout ticket.
- [`src/components/ui/Badge.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx): Renders status indicators for progressive overload readiness, PR tags, or completed set progress.
- [`src/components/ui/Field.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx): Renders a boxed monospace text input with focus outline styling and optional trailing unit tags.
- [`src/components/ui/Rule.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx): Draws a single-pixel horizontal divider line styled with the active theme outline color.
- [`src/components/ui/Text.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Text.tsx): Enforces consistent typography hierarchies across display numbers, titles, body text, labels, and micro tags.
- [`src/components/ui/index.ts`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/index.ts): Serves as a barrel export file providing a clean single import point for all UI primitives.
