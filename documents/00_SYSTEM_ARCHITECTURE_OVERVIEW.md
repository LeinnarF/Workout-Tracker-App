# System Architecture Map & Directory Index

This directory contains the visual architectural blueprint and system map for the **Gym App** codebase. It is organized into 7 modular, easy-to-distinguish documents designed for visual learning and code study.

---

## Architecture Map Index

| Index | Document Title | Description |
| :--- | :--- | :--- |
| **01** | [`01_HIGH_LEVEL_ARCHITECTURE.md`](file:///home/leinnarf/Project/Gym%20App/documents/01_HIGH_LEVEL_ARCHITECTURE.md) | Full system map covering routes, presentation layer, component hierarchy, ambient contexts, domain business logic, data access, and native hardware services. |
| **02** | [`02_FILE_FOLDER_MAP.md`](file:///home/leinnarf/Project/Gym%20App/documents/02_FILE_FOLDER_MAP.md) | File tree of architecture-critical files with a single-sentence responsibility summary for every key file in the codebase. |
| **03** | [`03_USER_FLOW_MAP.md`](file:///home/leinnarf/Project/Gym%20App/documents/03_USER_FLOW_MAP.md) | Visual flowcharts tracing user journeys: app launch, lazy session initialization, exercise creation, set logging, set deletion, workout completion, and stats/charting. |
| **04** | [`04_DATA_FLOW_MAP.md`](file:///home/leinnarf/Project/Gym%20App/documents/04_DATA_FLOW_MAP.md) | End-to-end data pipeline showing how user touches convert into component state, repository calls, SQL writes, and UI re-renders. |
| **05** | [`05_DATABASE_MAP.md`](file:///home/leinnarf/Project/Gym%20App/documents/05_DATABASE_MAP.md) | Complete SQLite schema specification: ER diagram, table constraints, indices, WAL mode configuration, and table read/write matrix. |
| **06** | [`06_DEPENDENCY_MAP.md`](file:///home/leinnarf/Project/Gym%20App/documents/06_DEPENDENCY_MAP.md) | Module dependency graph illustrating strict unidirectional relationships across routing, UI components, state contexts, logic, and SQLite repositories. |
| **07** | [`07_FEATURE_DEEP_DIVE_LOG_SET.md`](file:///home/leinnarf/Project/Gym%20App/documents/07_FEATURE_DEEP_DIVE_LOG_SET.md) | Deep dive tracing "logging a workout set" from button press to SQLite persistence, progressive overload evaluation, and UI feedback. |
| **UI** | [`UI_SPECIFICATION.md`](file:///home/leinnarf/Project/Gym%20App/documents/UI_SPECIFICATION.md) | Comprehensive UI design system reference detailing font scales, color tokens, 8 accent palettes, geometry rules, component dimensions, and haptics. |

---

## Architectural Summary

- **Local-First & Offline**: There are no remote HTTP/GraphQL endpoints, cloud syncs, or user authentication. All persistence lives locally in SQLite (`gym.db`) using `expo-sqlite`.
- **Navigation**: Uses Expo Router (SDK 57) file-based routing within `app/`, featuring a custom industrial tab bar.
- **State Segregation**: High-level device and styling state is coordinated via React Contexts (`ThemeContext`, `TimerContext`), while operational workout and statistics states are kept strictly local to each screen.
- **Double Progression Logic**: Weight progression adheres to classic Double Progression: a user stays at a chosen weight until every target set hits the upper rep limit (`rep_max`), after which an overload prompt suggests applying the configured increment (`increment_lb`).
