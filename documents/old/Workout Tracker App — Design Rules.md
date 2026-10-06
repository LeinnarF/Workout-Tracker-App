# Workout Tracker App — Design Rules

Visual and interaction rules for the Android workout tracker. Prepared for Leinnarf · October 4, 2026 · v1

## 1. Design intent

The app should feel like a **gym logbook crossed with a shop-floor ticket**: hard edges, ruled lines, fixed-width numbers, and one loud accent. It is a tool, not a lifestyle brand. Every screen should read like an instrument you glance at between sets.

**Direction (decided)**

- Personality: industrial, logbook and ticket feel
- Shape: sharp, 0-2px corners
- Typography: monospace-forward, so numbers line up like entries in a log
- Color: warm neutrals plus one accent (see section 3)

**Principles**

1. **Numbers are the hero.** Weight, reps, and time are the largest things on screen. Labels are small and quiet.
2. **Lines, not shadows.** Structure comes from 1px rules, grids, and alignment. No shadows, gradients, or blur.
3. **One accent, one action.** The accent marks the single next action on a screen and nothing decorative.
4. **Fast over friendly.** Big tap targets, no animation that delays input, terse copy.
5. **Not a template.** If a screen could belong to any Expo starter app, it is wrong (see section 11).

## 2. Design tokens at a glance

| Area | Rule |
| --- | --- |
| Corner radius | Cards and inputs 0, buttons and badges 2px, nothing larger |
| Borders | 1px solid `outline`; focus 2px `accent` |
| Spacing grid | 4px base: 4, 8, 12, 16, 24, 32, 48 |
| Touch target | 48dp minimum, primary action 56dp |
| Fonts | IBM Plex Mono (primary), IBM Plex Sans (sentences only) |
| Shadows | None |
| Motion | 100-150ms, no springs or bounce |

## 3. Color

One accent plus warm neutrals, in light and dark. Colors are always referenced by token name, never by hex in a component.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `background` | `#F6F6F3` | `#0E0F0D` | Screen background |
| `surface` | `#FFFFFF` | `#171916` | Cards, rows, sheets |
| `raised` | `#ECECE7` | `#222421` | Inputs, steppers, secondary buttons |
| `outline` | `#DADAD3` | `#31342F` | All 1px rules and borders |
| `text` | `#141412` | `#F1F2EE` | Primary text, numbers |
| `textMuted` | `#5F5F58` | `#9A9D95` | Labels, units, hints |
| `accent` | `#2F7D32` | `#B6F24A` | The one primary action, active state, PRs, main chart line |
| `accentTint` | `#E3EFE0` | `#232E10` | Selected rows, overload badge fill |
| `onAccent` | `#FFFFFF` | `#10140A` | Text and icons on accent fill |

**Rules**

- Accent fill is allowed on **one element per screen** (Log set, Start timer, Save). Everything else is neutral.
- Accent as text or outline is allowed for PR markers, the overload badge, and the active tab.
- No second hue anywhere, including errors. Destructive actions use `text` color with a confirmation step.
- Follow the system light or dark setting (`useColorScheme`), with no in-app toggle in v1.
- Body text and muted text must stay at 4.5:1 or better on their background.

## 4. Typography

**Fonts**

- **IBM Plex Mono**: weights 400, 500, 700. Used for numbers, labels, buttons, tabs, headings, and table text.
- **IBM Plex Sans**: weight 400 only. Used for free-text notes and long sentences, which are rare.
- Load with `@expo-google-fonts/ibm-plex-mono` and `@expo-google-fonts/ibm-plex-sans`, and hold the splash screen until fonts are ready so nothing flashes in the system font.

**Scale**

| Style | Size / line | Weight | Case | Use |
| --- | --- | --- | --- | --- |
| `display` | 48 / 52 | 700 | as typed | Active set weight, timer digits |
| `numeral` | 28 / 32 | 500 | as typed | Weight and reps in rows, stat values |
| `title` | 18 / 24 | 500 | UPPERCASE, +0.5 tracking | Screen titles, exercise names |
| `body` | 15 / 22 | 400 | sentence | Notes, descriptions |
| `label` | 12 / 16 | 500 | UPPERCASE, +0.8 tracking | Field labels, column headers, units |
| `micro` | 11 / 14 | 500 | UPPERCASE, +0.8 tracking | Badges, tab labels |

**Rules**

- **All numbers are fixed-width.** Mono does this by default; never mix in a proportional font for digits.
- Right-align numeric columns so digits line up in the history table.
- Units follow the number in `label` style and `textMuted`: `185 LB`, `10 REPS`, `01:30`.
- Maximum two weights on one screen. Never use weight 300 or lighter.
- Do not use italics. Emphasis comes from size, weight, or the accent.
- Respect system font scaling up to 130%; layouts must not break at that size.

## 5. Shape, borders, and spacing

- **Radius:** 0 for cards, panels, inputs, and the tab bar. 2px for buttons, badges, and chips. Never round more than 2px, and never use pills or circles (except the radio dot).
- **Borders:** 1px `outline` around cards and inputs. Rows in lists are separated by a single 1px rule, not by gaps and cards.
- **Elevation:** none. A sheet or dialog is a `surface` block with a 1px `outline` border over a dimmed background (50% black).
- **Grid:** 4px base. Screen padding is 16. Space between sections is 24. Space between a label and its value is 4.
- **Alignment over decoration:** align everything to a visible column edge. Mismatched left edges look cheap in this style.

**Industrial motifs (use sparingly)**

- **Dashed rule** (`1px dashed outline`) as a perforation line between sections of a session summary, like a ticket stub. One use per screen.
- **Stamp badge:** rectangular, 1px border, uppercase `micro` text (e.g., `PR`, `READY +5 LB`). Outline style in `accent`, or filled `accentTint`.
- **Index numbers:** zero-padded counters like `01`, `02` for sets and sessions, like a log's line numbers.

## 6. Iconography

- One line-icon set (Lucide or Tabler) at a 1.75 stroke, 20px inline and 24px in the tab bar.
- Square line caps and miter joins where the library allows it. No filled icons, no duotone, no emoji.
- Icons always sit beside or above a label in navigation, never alone, except obvious controls (plus, minus, close, swap).
- Icon color is `text` by default, `accent` when active, `textMuted` when inert.

## 7. Component rules

**Primary button**

- Full-width, 56dp tall, `accent` fill, `onAccent` label in `title` style, radius 2.
- Pressed state: swap to `accentTint` fill with `accent` text and a 1px `accent` border. No scale or ripple.
- One per screen.

**Secondary button**

- 48dp tall, `raised` fill, 1px `outline` border, `text` label, radius 2. Pressed: border becomes `text`.

**Stepper (weight and reps)**

- Square 48dp minus and plus buttons flanking a tappable `numeral` value. Tapping the value opens the numeric keypad.
- Weight steps by the exercise's increment (default 5 lb); reps step by 1. Long-press repeats.
- Label above in `label` style (`WEIGHT LB`, `REPS`).

**Set row (the logbook line)**

- A table-style row: index (`01`), weight, reps, with a warm-up marker (`W`) when applicable.
- Columns are fixed width and right-aligned; a 1px rule below each row. Column headers use `label`.
- Editing a row uses the same stepper and a bordered `raised` field, never a modal.

**Inputs and fields**

- Boxed 48dp field, 1px `outline`, `raised` fill, radius 0. Focus: 2px `accent` border. Label above, never a floating label.
- Numeric fields use the number keypad and `numeral` style.

**Badges**

- Height 24, horizontal padding 8, radius 2, `micro` text.
- Overload badge: `accentTint` fill, `accent` text, up-arrow icon, `READY +5 LB`. PR badge: 1px `accent` outline, `accent` text.

**Bottom tab bar**

- 56dp tall, `background` fill, 1px `outline` top border. Four tabs: Log, Stats, Convert, Timer.
- Active tab shows a 2px `accent` bar at the top edge of the tab, `accent` icon, and `text` label. Inactive tabs use `textMuted`.

**Lists and history**

- Session list rows: date in `label`, session summary in `numeral`, chevron at the right, 1px rules between rows.
- Section headers are `label` style with a 1px rule beneath, not a filled bar.

**Dialogs and sheets**

- Bordered `surface` block, 0 radius, content left-aligned, buttons stacked full-width (primary on top). Confirmation copy is short and states the consequence.

## 8. Screen-level guidance

**Log**

- Top: exercise name (`title`) and the target line (`3 × 5-10`) in `label`.
- Middle: the current set shown as a `display` weight and reps with the two steppers. Previous sets list below as set rows.
- Bottom, in the thumb zone: the single primary button, **LOG SET**. The overload badge sits above the steppers when it applies.

**Stats**

- Controls (range filter, exercise picker) are segmented, square buttons in a single bordered strip.
- Stat blocks are bordered cells in a grid, each with a `label` caption and a `numeral` value, like a spec sheet.
- **Charts:** line width 2px; axis and grid lines 1px `outline`; axis labels in `label` style; square data markers. The main series uses `accent`, the second series uses `textMuted` and a dashed line. No gradients, no area fills, no animated draw-in.

**Convert**

- Two stacked bordered fields, each with a unit tag (`LB`, `KG`; `MI`, `KM`), and a square swap button between them. The result field has a copy-to-clipboard action and a `USE IN LOG` secondary button.

**Timer**

- Remaining time in `display` size, centered. Progress is a **segmented block bar** (a row of square cells that empty one by one), not a circular ring.
- Presets are a row of square chips. The single primary button toggles START and PAUSE; RESET is secondary.
- When the countdown ends, the card fills with `accentTint`, the digits flash in steps (no fade), and the device gives a haptic.

## 9. Motion and haptics

- Durations: 100ms for presses and toggles, 150ms for screen transitions. Easing is linear or ease-out. No springs, overshoot, or parallax.
- Screen transitions are a quick fade or a hard cut. No slide-over animations on tab changes.
- Numbers change instantly, with no count-up animation.
- Haptics: light impact on logging a set and on stepper taps, a success notification haptic when a PR is logged or the timer ends.
- Respect the OS reduce-motion setting by removing all transitions.

## 10. Voice and copy

- Terse and imperative. `LOG SET`, `FINISH WORKOUT`, `ADD EXERCISE`.
- No exclamation marks, no cheerleading, no emoji.
- Buttons and labels are uppercase in the app; sentences (notes, confirmations) use sentence case.
- Always show the unit with the number. Weights in lb by default.
- Empty states are one line with an action: `NO SETS YET. LOG YOUR FIRST SET.`
- Errors say what happened and what to do, in one sentence.

## 11. Avoiding the generic Expo look

A checklist of defaults to remove or replace:

- [ ] No default Expo template screens, tab icons, or `HelloWave`-style components.
- [ ] No rounded white cards with soft shadows.
- [ ] No system font anywhere; everything is IBM Plex.
- [ ] No default blue link or tint color; all interactive color comes from tokens.
- [ ] Custom splash screen using the `background` token, with the wordmark in IBM Plex Mono.
- [ ] Custom app icon: a flat square mark (for example a plate or a plus-five glyph) in `accent` on `background`, no gradients.
- [ ] Status bar and Android navigation bar colored to match `background`.
- [ ] Android press feedback is a flat color swap, not the default ripple.
- [ ] Scroll indicators hidden, and overscroll glow disabled.
- [ ] Header bars removed in favor of an in-screen `title` style heading.

## 12. Implementation notes

Keep the system in one theme module so components never hold raw values.

```ts
// src/theme/tokens.ts
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { none: 0, control: 2 };
export const border = { width: 1, focus: 2 };

export const colors = {
  light: {
    background: '#F6F6F3', surface: '#FFFFFF', raised: '#ECECE7',
    outline: '#DADAD3', text: '#141412', textMuted: '#5F5F58',
    accent: '#2F7D32', accentTint: '#E3EFE0', onAccent: '#FFFFFF',
  },
  dark: {
    background: '#0E0F0D', surface: '#171916', raised: '#222421',
    outline: '#31342F', text: '#F1F2EE', textMuted: '#9A9D95',
    accent: '#B6F24A', accentTint: '#232E10', onAccent: '#10140A',
  },
};
```

- `useTheme()` returns the current color set from `useColorScheme()`.
- Build a small shared component set first: `Text` (with the type scale as variants), `Button`, `Stepper`, `Field`, `Badge`, `SetRow`, `Rule`, `Screen`. Screens should use only these.
- Lint rule or code review check: no hex values and no inline `borderRadius` above 2 outside `tokens.ts`.

## 13. Open decisions

- App name and wordmark, which feeds the splash screen and icon.
- Whether labels stay all-caps everywhere or switch to sentence case in dense stats views.
- Whether to add a manual light/dark toggle later, or keep following the system.
