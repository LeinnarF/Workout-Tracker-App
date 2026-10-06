# UI Specification & Design System Reference

This document is the authoritative specification for all visual and interactive elements in the Gym App. It details the typography scale, color tokens, layout geometry, component specifications, and interaction standards, with direct references to the implementing code files and line numbers.

---

## 1. Design Philosophy & Industrial Intent

The interface is inspired by a **gym logbook crossed with a machine-shop ticket**:
- **Monospace-Forward**: Numbers are aligned in fixed-width tabular columns so history lines up like ledger entries.
- **Numbers are the Hero**: Active weights, rep counts, and countdown timers are the largest, highest-contrast visual elements.
- **Lines, Not Shadows**: Structural hierarchy is achieved purely via 1px outline borders, solid divider rules, and background tints. No drop shadows, blur filters, or elevation gradients exist.
- **Sharp Geometry**: Cards, modal sheets, and text fields have a **0px corner radius**. Interactive buttons, chips, and badges have a strict **2px corner radius**. Nothing in the app has a radius greater than 2px.
- **Single Accent Rule**: The accent color indicates the single primary action on a screen (e.g. *Log Set*, *Start Timer*, *Save*). Decorative use of the accent color is restricted to PR indicators, overload status badges, and active tab indicators.

**Code References**:
- Design Tokens Implementation: [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L1-L177)
- Historical Design Principles: [`documents/old/Workout Tracker App — Design Rules.md`](file:///home/leinnarf/Project/Gym%20App/documents/old/Workout%20Tracker%20App%20%E2%80%94%20Design%20Rules.md#L5-L23)

---

## 2. Typography Scale & Font Elements

The app loads two typeface families via Google Fonts:
- **IBM Plex Mono** (`IBMPlexMono_400Regular`, `IBMPlexMono_500Medium`, `IBMPlexMono_700Bold`): Used for all digits, counters, button labels, tabs, table rows, and headings.
- **IBM Plex Sans** (`IBMPlexSans_400Regular`): Used exclusively for multi-sentence descriptive text, notes, and dialog explanations.

**Code References**:
- Font Loading & Splash Prevention: [`app/_layout.tsx#L1-L9`](file:///home/leinnarf/Project/Gym%20App/app/_layout.tsx#L1-L9) and [`app/_layout.tsx#L31-L51`](file:///home/leinnarf/Project/Gym%20App/app/_layout.tsx#L31-L51)
- Font Family Mapping Tokens: [`src/theme/tokens.ts#L129-L134`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L129-L134)
- Typography Style Tokens: [`src/theme/tokens.ts#L136-L176`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L136-L176)
- Text Primitive Component: [`src/components/ui/Text.tsx#L1-L54`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Text.tsx#L1-L54)

### Complete Type Scale Specification

| Type Style | Font Family | Size (`fontSize`) | Line Height (`lineHeight`) | Weight (`fontWeight`) | Letter Spacing (`letterSpacing`) | Text Transform | Code Reference | Primary Application |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`display`** | `IBMPlexMono_700Bold` | **70** | **52** | 700 (Bold) | `0` | As typed | [`tokens.ts#L137-L142`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L137-L142) | Timer countdown digits, active set weights |
| **`numeral`** | `IBMPlexMono_500Medium` | **24** | **32** | 500 (Medium) | `0` | As typed (tabular) | [`tokens.ts#L143-L148`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L143-L148) | Weight/reps in set rows, converter values, stats |
| **`numeral-lg`** *(Stepper)* | `IBMPlexMono_500Medium` | **28** | **32** | 500 (Medium) | `0` | Tabular numbers | [`Stepper.tsx#L202-L214`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L202-L214) | Stepper value input field |
| **`numeral-sm`** *(Compact)* | `IBMPlexMono_500Medium` | **18** | **22** | 500 (Medium) | `0` | Tabular numbers | [`Stepper.tsx#L215-L218`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L215-L218) | Compact stepper value input field |
| **`title`** | `IBMPlexMono_500Medium` | **16** | **24** | 500 (Medium) | `0.5` | UPPERCASE | [`tokens.ts#L149-L155`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L149-L155) | Screen headers, modal titles, exercise names, button text |
| **`body`** | `IBMPlexSans_400Regular` | **15** | **22** | 400 (Regular) | `0` | Sentence case | [`tokens.ts#L156-L161`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L156-L161) | Long descriptions, instructions, confirmation notes |
| **`label`** | `IBMPlexMono_500Medium` | **12** | **16** | 500 (Medium) | `0.8` | UPPERCASE | [`tokens.ts#L162-L168`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L162-L168) | Field captions, column headers, units, section dividers |
| **`micro`** | `IBMPlexMono_500Medium` | **11** | **14** | 500 (Medium) | `0.8` | UPPERCASE | [`tokens.ts#L169-L175`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L169-L175) | Badges, tab labels, unit tags, overload prompts |
| **`tag-chip`** | `IBMPlexMono_600SemiBold` | **10** | **12** | 600 (SemiBold) | `0.5` | UPPERCASE | [`ExerciseModal.tsx#L408-L413`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseModal.tsx#L408-L413) | Exercise category tag chips (`CHEST`, `ARMS`) |
| **`badge-mini`** | `IBMPlexMono_600SemiBold` | **9** | **10** | 600 (SemiBold) | `0.5` | UPPERCASE | [`index.tsx#L652-L657`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L652-L657) | Inline exercise ticket tag badge |

### Font Rules & Constraints
1. **Tabular Numerals**: All numeric inputs enforce `fontVariant: ['tabular-nums']` and `includeFontPadding: false` to eliminate horizontal jitter when values increment ([`Text.tsx#L48-L53`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Text.tsx#L48-L53), [`Stepper.tsx#L209-L210`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L209-L210)).
2. **No Italics**: Emphasis is conveyed strictly through font size, font weight (400, 500, 700), or accent tinting.
3. **Upper Limit Scaling**: The layout maintains alignment with system font accessibility scaling up to 130%.

---

## 3. Color Tokens & Palettes

All colors are referenced via semantic token names from [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L21-L127). Hex values are never hardcoded inside components.

**Code References**:
- Neutral Tokens Definition: [`src/theme/tokens.ts#L21-L46`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L21-L46)
- 8 Accent Palettes Definition: [`src/theme/tokens.ts#L69-L117`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L69-L117)
- Color Resolver (`getThemeColors`): [`src/theme/tokens.ts#L119-L127`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L119-L127)
- Persistent Storage & Provider: [`src/theme/ThemeContext.tsx#L38-L122`](file:///home/leinnarf/Project/Gym%20App/src/theme/ThemeContext.tsx#L38-L122)
- Navigation Theme Integration: [`app/_layout.tsx#L60-L75`](file:///home/leinnarf/Project/Gym%20App/app/_layout.tsx#L60-L75)

### Core Neutral Tokens

| Token Name | Light Mode Hex | Dark Mode Hex | Functional Role | Code Reference |
| :--- | :--- | :--- | :--- | :--- |
| **`background`** | `#F6F6F3` | `#0E0F0D` | Base screen canvas and safe area | [`tokens.ts#L23,L34`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L23) |
| **`surface`** | `#FFFFFF` | `#171916` | Cards, exercise tickets, modal dialog bodies | [`tokens.ts#L24,L35`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L24) |
| **`raised`** | `#ECECE7` | `#222421` | Stepper buttons, text input fills, secondary buttons | [`tokens.ts#L25,L36`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L25) |
| **`outline`** | `#DADAD3` | `#31342F` | All 1px structural borders, dividers, table rules | [`tokens.ts#L26,L37`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L26) |
| **`text`** | `#141412` | `#F1F2EE` | Primary headers, numeric values, active labels | [`tokens.ts#L27,L38`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L27) |
| **`textMuted`** | `#5F5F58` | `#9A9D95` | Secondary labels, units (`LB`, `REPS`), timestamps | [`tokens.ts#L28,L39`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L28) |

---

### The 8 Selectable Accent Palettes

The app supports 8 user-selectable accent colorways (configured in Settings and persisted to disk via [`src/theme/ThemeContext.tsx#L86-L94`](file:///home/leinnarf/Project/Gym%20App/src/theme/ThemeContext.tsx#L86-L94)).

| Accent Name | Theme | `accent` (Action / Active) | `accentTint` (Badge / Highlight) | `onAccent` (Text on Accent) | Code Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GREEN** *(Default)* | **Light**<br/>**Dark** | `#2F7D32`<br/>`#B6F24A` | `#E4F0E2`<br/>`#232E10` | `#FFFFFF`<br/>`#10140A` | [`tokens.ts#L77-L81`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L77-L81) |
| **CYAN** | **Light**<br/>**Dark** | `#00838F`<br/>`#00E5FF` | `#E0F4F7`<br/>`#0A2B33` | `#FFFFFF`<br/>`#081417` | [`tokens.ts#L82-L86`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L82-L86) |
| **YELLOW** | **Light**<br/>**Dark** | `#A67C00`<br/>`#FFE600` | `#FFF8E1`<br/>`#332D05` | `#FFFFFF`<br/>`#1A1702` | [`tokens.ts#L87-L91`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L87-L91) |
| **PURPLE** | **Light**<br/>**Dark** | `#7E22CE`<br/>`#C084FC` | `#F3E8FF`<br/>`#2E1065` | `#FFFFFF`<br/>`#0F051D` | [`tokens.ts#L92-L96`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L92-L96) |
| **RED** | **Light**<br/>**Dark** | `#C62828`<br/>`#FF5252` | `#FFEBEE`<br/>`#331111` | `#FFFFFF`<br/>`#1A0505` | [`tokens.ts#L97-L101`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L97-L101) |
| **PINK** | **Light**<br/>**Dark** | `#BE185D`<br/>`#FF60A8` | `#FCE7F3`<br/>`#331221` | `#FFFFFF`<br/>`#1A050F` | [`tokens.ts#L102-L106`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L102-L106) |
| **ORANGE** | **Light**<br/>**Dark** | `#C2410C`<br/>`#FF7A1A` | `#FFF3E0`<br/>`#331805` | `#FFFFFF`<br/>`#1A0C02` | [`tokens.ts#L107-L111`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L107-L111) |
| **BLUE** | **Light**<br/>**Dark** | `#1D4ED8`<br/>`#38BDF8` | `#EFF6FF`<br/>`#0E1E38` | `#FFFFFF`<br/>`#070F1C` | [`tokens.ts#L112-L116`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L112-L116) |

---

## 4. Layout, Spacing Grid & Border Geometry

### Spacing Scale (4px Base Grid)

**Code Reference**: [`src/theme/tokens.ts#L1-L9`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L1-L9)

```
xs: 4px   sm: 8px   md: 12px   lg: 16px   xl: 24px   xxl: 32px   xxxl: 48px
```

- **Screen Outer Margin**: `16px` (`spacing.lg`, [`Screen.tsx#L121`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L121))
- **Spacing Between Sections**: `16px` or `24px` (`spacing.xl`, [`index.tsx#L684`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L684))
- **Vertical Spacing Between Label & Field**: `4px` (`spacing.xs`, [`Field.tsx#L98`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L98))
- **Horizontal Gap Between Paired Steppers**: `8px` (`spacing.sm`, [`index.tsx#L683`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L683))

### Geometry & Border Rules

| Property | Value | Enforcement | Code Reference |
| :--- | :--- | :--- | :--- |
| **`radius.none`** | `0px` | Cards, panels, inputs, screen containers, tab bar | [`tokens.ts#L12`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L12) |
| **`radius.control`** | `2px` | Buttons, badges, steppers, tags, swatches | [`tokens.ts#L13`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L13) |
| **`border.width`** | `1px` | All borders and dividers (`outline` color) | [`tokens.ts#L17`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L17) |
| **`border.focus`** | `2px` | Focused text inputs (`accent` color) | [`tokens.ts#L18`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts#L18), [`Field.tsx#L58`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L58) |
| **Modal Overlay** | `rgba(0, 0, 0, 0.5)` | 50% opacity dimming layer with zero blur | [`ExerciseModal.tsx#L349`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseModal.tsx#L349) |

---

## 5. UI Component Specifications

### 1. Primary Button
- **Implementing File**: [`src/components/ui/Button.tsx#L24-L121`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L24-L121)
- **Height**: `56dp` ([`Button.tsx#L52`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L52)).
- **Corner Radius**: `2px` (`radius.control`, [`Button.tsx#L97`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L97)).
- **Border**: `1px solid accent` ([`Button.tsx#L65`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L65)).
- **Default State**: Background `colors.accent`, text `colors.onAccent` in `title` style (uppercase, 16px).
- **Pressed State**: Instant color swap to background `colors.accentTint`, border `colors.accent`, text `colors.accent` ([`Button.tsx#L59-L63`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L59-L63)). No elevation, scaling, or ripple.
- **Disabled State**: Background `colors.raised`, border `colors.outline`, text `colors.textMuted` ([`Button.tsx#L55-L58`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L55-L58)).
- **Haptic Profile**: `Haptics.ImpactFeedbackStyle.Light` ([`Button.tsx#L40`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L40)).
- **Constraint**: **Only 1 primary button permitted per screen.**

### 2. Secondary Button
- **Implementing File**: [`src/components/ui/Button.tsx#L68-L83`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L68-L83)
- **Height**: `48dp` ([`Button.tsx#L52`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L52)).
- **Corner Radius**: `2px` ([`Button.tsx#L97`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L97)).
- **Border**: `1px solid outline` ([`Button.tsx#L80`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L80)).
- **Default State**: Background `colors.raised`, text `colors.text` in `title` style.
- **Pressed State**: Border swaps to `colors.text` ([`Button.tsx#L76`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L76)).

### 3. Stepper Component
- **Implementing File**: [`src/components/ui/Stepper.tsx#L24-L169`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L24-L169)
- **Standard Dimensions**: Height `48dp` (compact variant: `40dp`, [`Stepper.tsx#L88`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L88)).
- **Minus & Plus Buttons**:
  - Dimensions: `48 x 48dp` (compact: `40 x 40dp`, [`Stepper.tsx#L105-L106`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L105-L106)).
  - Corner Radius: `2px` (`radius.control`, [`Stepper.tsx#L109`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L109)).
  - Border: `1px solid outline`.
  - Icon: Lucide `Minus` and `Plus`, size `20px` (compact: `16px`, stroke `1.75`, [`Stepper.tsx#L89,L114,L164`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L89)).
  - Press-and-Hold: Auto-repeats every `150ms` ([`Stepper.tsx#L67-L70`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L67-L70)).
  - Haptic Profile: `Haptics.ImpactFeedbackStyle.Light` ([`Stepper.tsx#L55`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L55)).
  - Disabled State: Opacity `0.35` when value is at `min` or `max` ([`Stepper.tsx#L110,L160`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L110)).
- **Value Container**:
  - Border: Top and bottom `1px solid outline`; zero left/right borders for seamless union ([`Stepper.tsx#L197-L198`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L197-L198)).
  - Background: `colors.surface` ([`Stepper.tsx#L124`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L124)).
  - Typography: Monospace Medium, size `28px` (compact: `18px`, [`Stepper.tsx#L205,L215`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L205)).
  - Direct Input: Decimal keypad with selection on focus ([`Stepper.tsx#L138-L141`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L138-L141)).

### 4. Set Row
- **Implementing File**: [`src/components/ui/SetRow.tsx#L18-L99`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L18-L99)
- **Row Height**: `48dp` ([`SetRow.tsx#L105`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L105)).
- **Border**: Bottom border `1px solid outline` ([`SetRow.tsx#L38,L106`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L38)).
- **Background**: `colors.surface` ([`SetRow.tsx#L39`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L39)).
- **Columns (Grid-Aligned)**:
  1. **Index Col (`width: 48dp`, [`SetRow.tsx#L110`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L110))**: Zero-padded numeral (`01`, `02`) in `label` style. Warmup rows append a bold `W` in `colors.accent` ([`SetRow.tsx#L49-L51`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L49-L51)).
  2. **Weight Col (`flex: 1`, right-aligned, [`SetRow.tsx#L119`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L119))**: Value in `numeral` style (`24px`), followed by unit text `LB` (`11px micro`, `textMuted`, [`SetRow.tsx#L60-L62`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L60-L62)).
  3. **Reps Col (`width: 80dp`, right-aligned, [`SetRow.tsx#L126`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L126))**: Rep count in `numeral` style (`24px`), followed by `REPS` (`11px micro`, `textMuted`, [`SetRow.tsx#L69-L71`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L69-L71)).
  4. **Action Col (`width: 44dp`, right-aligned, [`SetRow.tsx#L134`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L134))**:
     - PR Badge: Border `1px solid accent`, radius `2px`, uppercase `PR` in `micro` style ([`SetRow.tsx#L78-L82`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L78-L82)).
     - Delete Button: Lucide `Trash2` icon (`16px`, stroke `1.75`), hitSlop `8dp` ([`SetRow.tsx#L85-L95`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L85-L95)).

### 5. Badge Component
- **Implementing File**: [`src/components/ui/Badge.tsx#L13-L77`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L13-L77)
- **Height**: `24dp` ([`Badge.tsx#L81`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L81)).
- **Padding**: Horizontal `8dp` ([`Badge.tsx#L82`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L82)).
- **Corner Radius**: `2px` (`radius.control`, [`Badge.tsx#L23,L47,L67`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L23)).
- **Variants**:
  - **`overload`**: Background `colors.accentTint`, border `1px solid accent`, text `colors.accent`, preceded by Lucide `ArrowUp` (`12px`, stroke `2.5`, [`Badge.tsx#L17-L35`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L17-L35)).
  - **`pr`**: Background transparent, border `1px solid accent`, text `colors.accent` ([`Badge.tsx#L39-L57`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L39-L57)).
  - **`neutral`**: Background transparent, border `1px solid outline`, text `colors.textMuted` ([`Badge.tsx#L59-L76`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L59-L76)).

### 6. Text Input Field
- **Implementing File**: [`src/components/ui/Field.tsx#L19-L89`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L19-L89)
- **Height**: `48dp` ([`Field.tsx#L100`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L100)).
- **Corner Radius**: `0px` ([`Field.tsx#L104`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L104)).
- **Fill**: `colors.raised` ([`Field.tsx#L55`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L55)).
- **Border**: `1px solid outline`, expanding to `2px solid accent` on focus ([`Field.tsx#L56-L57`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L56-L57)).
- **Label**: Positioned above in `label` style (`12px`, uppercase, `textMuted`, [`Field.tsx#L47-L49`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L47-L49)).
- **Unit Tag**: Optional trailing tag (e.g. `LB`) inside input boundary ([`Field.tsx#L81-L85`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx#L81-L85)).

### 7. Divider Rule
- **Implementing File**: [`src/components/ui/Rule.tsx#L10-L25`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx#L10-L25)
- **Height / Thickness**: `1px` ([`Rule.tsx#L30`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx#L30)).
- **Color**: `colors.outline` ([`Rule.tsx#L18`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx#L18)).
- **Variants**:
  - `solid`: Standard divider between sections ([`Rule.tsx#L10`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx#L10)).
  - `dashed`: Industrial perforation divider line ([`Rule.tsx#L10,L19`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx#L10)).

### 8. Bottom Tab Bar
- **Implementing File**: [`app/(tabs)/_layout.tsx#L12-L109`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L12-L109)
- **Height**: `56dp` ([`_layout.tsx#L157`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L157)).
- **Top Border**: `1px solid outline` ([`_layout.tsx#L21,L159`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L21)).
- **Background**: `colors.background` ([`_layout.tsx#L20`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L20)).
- **Active State Indicator**: Horizontal indicator bar (`height: 2px`, `backgroundColor: colors.accent`) pinned to the top edge ([`_layout.tsx#L84-L91,L168-L174`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L84-L91)).
- **Tab Layout**:
  - Icon: Lucide icon (`size: 20px`, `strokeWidth: 1.75`, [`_layout.tsx#L58-L62`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L58-L62)).
  - Label: `10px`, uppercase, line height `12px` ([`_layout.tsx#L181-L182`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L181-L182)).
  - Active Color: `colors.accent` (icon), `colors.text` (label) ([`_layout.tsx#L55,L99`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L55)).
  - Inactive Color: `colors.textMuted` ([`_layout.tsx#L55,L99`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L55)).
- **Haptic Profile**: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on tab selection ([`_layout.tsx#L44`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L44)).

### 9. Screen Container
- **Implementing File**: [`src/components/ui/Screen.tsx#L22-L89`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L22-L89)
- **Safe Area**: Full integration with `SafeAreaView` from `react-native-safe-area-context` ([`Screen.tsx#L33`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L33)).
- **Status Bar**: Styled dynamically based on active theme mode ([`Screen.tsx#L39-L42`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L39-L42)):
  - Dark Mode: `light-content` on `#0E0F0D`.
  - Light Mode: `dark-content` on `#F6F6F3`.
- **Header Section**:
  - Height: `52dp` ([`Screen.tsx#L97`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L97)).
  - Border: Bottom `1px solid outline` ([`Screen.tsx#L47,L102`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L47)).
  - Padding: Horizontal `16dp` ([`Screen.tsx#L101`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L101)).
  - Title: Monospace Medium (`16px`, `title` style, [`Screen.tsx#L51-L53`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L51-L53)).
  - Subtitle: `micro` style (`11px`), `textMuted`, baseline-aligned with title ([`Screen.tsx#L55-L57`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L55-L57)).
- **Scroll Behavior**: Scroll indicators hidden (`showsVerticalScrollIndicator: false`), Android overscroll glow disabled (`overScrollMode: 'never'`), bounce disabled ([`Screen.tsx#L71-L74`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx#L71-L74)).

---

## 6. Iconography Standards

- **Icon Family**: [Lucide React Native](https://lucide.dev/).
- **Stroke Width**: Standardized at `1.75` (thickened to `2.0` or `2.5` only for micro arrows and checks).
- **Sizes**:
  - Tab Bar Icons: `20px` ([`app/(tabs)/_layout.tsx#L59`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L59))
  - Inline Header Actions: `20px` ([`app/(tabs)/index.tsx#L338,L353,L363`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L338))
  - Stepper Controls: `20px` (compact: `16px`, [`Stepper.tsx#L89`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L89))
  - Table Actions / Delete: `16px` ([`SetRow.tsx#L93`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx#L93))
  - Badge Glyphs: `12px` ([`Badge.tsx#L30`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx#L30))
- **Icon Colors**:
  - Default: `colors.text`
  - Active / Accent: `colors.accent`
  - Inert / Muted: `colors.textMuted`

---

## 7. Motion, Transition & Haptic Specifications

| Action / Trigger | Visual Motion Spec | Hardware Feedback | Code Reference |
| :--- | :--- | :--- | :--- |
| **Button Press** | 100ms color swap to `accentTint` (no scale or ripple) | `Haptics.ImpactFeedbackStyle.Light` | [`Button.tsx#L40`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx#L40) |
| **Stepper Tap** | Instant number change (no count-up animation) | `Haptics.ImpactFeedbackStyle.Light` | [`Stepper.tsx#L55`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L55) |
| **Stepper Long-Press** | Ticks every 150ms while held | Light pulse per step | [`Stepper.tsx#L68`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx#L68) |
| **Log Set Success** | Row renders immediately; badge updates | `Haptics.ImpactFeedbackStyle.Light` | [`index.tsx#L207`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L207) |
| **Delete Set** | Immediate row removal from table | `Haptics.ImpactFeedbackStyle.Light` | [`index.tsx#L240`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L240) |
| **Overload Prompt / PR** | Stamp badge appears in ticket | `Haptics.NotificationFeedbackType.Success` | [`index.tsx#L174`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L174) |
| **Workout Finished** | Modal dismissal | `Haptics.NotificationFeedbackType.Success` | [`index.tsx#L260`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/index.tsx#L260) |
| **Rest Timer Expired** | Display card fills with `accentTint`; digits hold | `Haptics.NotificationFeedbackType.Success` + Audio Chime | [`TimerContext.tsx#L94,L102`](file:///home/leinnarf/Project/Gym%20App/src/timer/TimerContext.tsx#L94) |
| **Screen Wake Lock** | Screen stays on while timer is active | `activateKeepAwakeAsync('workout_rest_timer')` | [`TimerContext.tsx#L86`](file:///home/leinnarf/Project/Gym%20App/src/timer/TimerContext.tsx#L86) |
| **Tab Switch** | Instant switch, 2px top indicator moves | `Haptics.ImpactFeedbackStyle.Light` | [`_layout.tsx#L44`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx#L44) |

---

## 8. Anti-Patterns & Visual Enforcement Rules

When modifying or extending the UI, ensure that:
1. **No Drop Shadows**: Do not use `elevation`, `shadowColor`, `shadowOffset`, or `shadowOpacity`.
2. **No Rounding > 2px**: `borderRadius` must be `0` (cards, inputs, sheets) or `2` (buttons, chips, badges). Never use pills (`borderRadius: 9999`) or rounded circles.
3. **No Decorative Accents**: The `accent` color must never be used for random background fills, gradients, or non-action elements.
4. **No Raw Color Literals**: Hex codes must never appear in component style sheets. Always consume from `useTheme().colors`.
5. **No System Fonts**: Do not rely on iOS San Francisco or Android Roboto. All typography must inherit IBM Plex Mono or Sans.
6. **No Animated Count-Ups**: Numbers must change instantly when incremented or refreshed.

---

## 9. Comprehensive Code Reference Directory

Use this quick-lookup index to locate any UI element, style token, or component in the codebase:

| UI System Domain | Element / Feature | Source File | Exact Line Range |
| :--- | :--- | :--- | :--- |
| **Type Tokens** | Display (`70px / 52px / 700`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L137-L142` |
| **Type Tokens** | Numeral (`24px / 32px / 500`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L143-L148` |
| **Type Tokens** | Title (`16px / 24px / 500 / +0.5`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L149-L155` |
| **Type Tokens** | Body (`15px / 22px / 400`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L156-L161` |
| **Type Tokens** | Label (`12px / 16px / 500 / +0.8`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L162-L168` |
| **Type Tokens** | Micro (`11px / 14px / 500 / +0.8`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L169-L175` |
| **Type Primitives**| `Text` Component Implementation | [`src/components/ui/Text.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Text.tsx) | `#L15-L46` |
| **Color Tokens** | Neutral Theme Palette | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L21-L47` |
| **Color Tokens** | 8 Accent Palettes | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L58-L117` |
| **Color Resolver** | `getThemeColors(isDark, accent)` | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L119-L127` |
| **Layout Tokens** | Spacing Scale (`xs` to `xxxl`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L1-L9` |
| **Layout Tokens** | Radius (`none: 0`, `control: 2`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L11-L14` |
| **Layout Tokens** | Border (`width: 1`, `focus: 2`) | [`src/theme/tokens.ts`](file:///home/leinnarf/Project/Gym%20App/src/theme/tokens.ts) | `#L16-L19` |
| **UI Primitive** | `Button` (Primary / Secondary) | [`src/components/ui/Button.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Button.tsx) | `#L24-L121` |
| **UI Primitive** | `Stepper` (Standard / Compact) | [`src/components/ui/Stepper.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Stepper.tsx) | `#L24-L169` |
| **UI Primitive** | `SetRow` (4-Column Layout) | [`src/components/ui/SetRow.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/SetRow.tsx) | `#L18-L99` |
| **UI Primitive** | `Badge` (Overload / PR / Neutral) | [`src/components/ui/Badge.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Badge.tsx) | `#L13-L77` |
| **UI Primitive** | `Field` (Boxed Monospace Input) | [`src/components/ui/Field.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Field.tsx) | `#L19-L89` |
| **UI Primitive** | `Rule` (Solid / Dashed Perforation)| [`src/components/ui/Rule.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Rule.tsx) | `#L10-L25` |
| **UI Primitive** | `Screen` Container & Header | [`src/components/ui/Screen.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ui/Screen.tsx) | `#L22-L89` |
| **Navigation** | `IndustrialTabBar` Implementation | [`app/(tabs)/_layout.tsx`](file:///home/leinnarf/Project/Gym%20App/app/(tabs)/_layout.tsx) | `#L12-L109` |
| **Domain Modal** | `ExerciseModal` | [`src/components/ExerciseModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseModal.tsx) | `#L34-L343` |
| **Domain Modal** | `ExerciseActionModal` | [`src/components/ExerciseActionModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/ExerciseActionModal.tsx) | `#L21-L161` |
| **Domain Modal** | `FinishWorkoutModal` | [`src/components/FinishWorkoutModal.tsx`](file:///home/leinnarf/Project/Gym%20App/src/components/FinishWorkoutModal.tsx) | `#L20-L110` |
| **Hardware** | Rest Timer Audio Chime & Wake Lock| [`src/timer/TimerContext.tsx`](file:///home/leinnarf/Project/Gym%20App/src/timer/TimerContext.tsx) | `#L82-L107` |
| **Persistence** | Theme & Accent Disk Storage | [`src/theme/ThemeContext.tsx`](file:///home/leinnarf/Project/Gym%20App/src/theme/ThemeContext.tsx) | `#L43-L94` |
