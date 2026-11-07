---
name: Royal Emerald Precision
colors:
  surface: '#e7fff5'
  surface-dim: '#c8dfd6'
  surface-bright: '#e7fff5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e1f9ef'
  surface-container: '#dcf3e9'
  surface-container-high: '#d6ede4'
  surface-container-highest: '#d0e8de'
  on-surface: '#0b1f19'
  on-surface-variant: '#404944'
  inverse-surface: '#20342e'
  inverse-on-surface: '#dff6ec'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#006a63'
  on-secondary: '#ffffff'
  secondary-container: '#99efe5'
  on-secondary-container: '#006f67'
  tertiary: '#1f3228'
  on-tertiary: '#ffffff'
  tertiary-container: '#35483d'
  on-tertiary-container: '#a1b6a8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#9cf2e8'
  secondary-fixed-dim: '#80d5cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#d2e8d9'
  tertiary-fixed-dim: '#b6ccbd'
  on-tertiary-fixed: '#0d1f16'
  on-tertiary-fixed-variant: '#384b40'
  background: '#e7fff5'
  on-background: '#0b1f19'
  surface-variant: '#d0e8de'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.875rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an authoritative, institutional aesthetic tailored for high-volume enterprise appointment coordination, client operations, and executive schedule logistics. Merging corporate rigor with the restraint of private banking and wealth management interfaces, the visual direction projects stability, uncompromising punctuality, and operational clarity.

The visual style is **Corporate Modern Minimalist with Tonal Layering**. It deliberately avoids decorative trends such as neon highlights, aggressive multi-stop gradients, loud saturated alerts, or milky blur-heavy surfaces. Instead, it relies on disciplined structural grids, hairline boundaries, architectural proportions, and an emerald-and-teal palette rooted in executive prestige. Every interaction communicates efficiency, clarity, and reliability.

## Colors

The palette establishes an ordered visual hierarchy centered around deep forest tones, crystalline pearl whites, and soft sage accents.

### Color Tokens & Roles

- **Royal Emerald (`#064E3B`)**: The foundational primary anchor. Used for high-priority actions, brand anchor surfaces, global navigation sidebars, table column sorting highlights, and definitive commit actions.
- **Deep Teal (`#0F766E`)**: Secondary interactive and stateful accent. Serves as hover states for primary items, active navigation links, selected booking slot indicators, and verified status elements.
- **Pearl White (`#F8FAF9`)**: Base page canvas. Provides an optically warm, non-glare surface that reduces fatigue in heavy data tables and calendar scheduling views.
- **Surface Container Lowest (`#FFFFFF`)**: Pure canvas applied to interactive cards, popovers, flyout drawers, time-slot selection panels, and data grids.
- **Surface Container Low (`#F2F6F4`)**: Subtle secondary background for table headers, inactive booking slots, segmented control tracks, and neutral metric badges.
- **Platinum Silver (`#DCE5E0`)**: Structural boundary color used exclusively for 1px hairline card borders, grid dividers, calendar time tracks, and table cell separators.
- **Sage Green (`#A3B8AA`)**: Tertiary muted element tone applied to pending metadata, micro-borders, secondary tag surfaces (with lowered opacity), and secondary icon fills.
- **Dark Text (`#172B25`)**: High-contrast, near-black ink with an emerald undertone. Used for all primary body text, numerical readouts, calendar time labels, and display headers.

### Usage Restrictions
- Strict prohibition of warm alert hues (no red, pink, orange, or amber). System alerts, validation notes, and destructive/cancellation prompts rely strictly on tinted variations of Deep Teal and Royal Emerald paired with distinct icons, filled badges, and clear copy.
- No purple, lavender, or synthetic neon accents.

## Typography

Typography pairs **Manrope** for primary headings and executive summaries with **Inter** for dense transactional UI data, schedule matrices, and form configurations.

- **Manrope** brings a balanced geometric rhythm with open letterforms, lending executive confidence to appointment metrics, booking titles, and section headers.
- **Inter** ensures legibility across calendars, compact data tables, client timelines, and input labels, particularly when viewing dense rows of alphanumeric reference codes.
- Numerical time values, monetary amounts, and date stamps should always utilize tabular figures (`font-variant-numeric: tabular-nums`) to maintain alignment across scheduling tables.

## Layout & Spacing

The layout model is anchored on an 8px grid cadence, ensuring mathematical alignment across calendar views, side panels, and booking slot grids.

### Breakpoints & Canvas Configuration
- **Desktop (1280px and above)**: 12-column responsive fluid grid with fixed lateral gutters of `gutter-lg` (`2rem`) and outer margins of `margin-lg` (`3rem`). Standard dashboard views utilize a fixed 280px administrative navigation sidebar alongside a fluid working workspace.
- **Tablet (768px – 1279px)**: 8-column layout with `gutter` (`1.5rem`) and `margin` (`2rem`). The navigation collapses to an icon bar or slide-over drawer to maximize calendar schedule horizontal room.
- **Mobile (Below 768px)**: 4-column layout with `gutter-sm` (`1rem`) and `margin-sm` (`1rem`). Multi-day calendar spreads collapse to single-day vertical timelines with sticky date scrubbers.

### Padding and Layout Cadence
Component internal padding relies strictly on the `space-*` tokens:
- **`space-xs` (4px)**: Gap between icons and adjacent micro-labels.
- **`space-sm` (8px)**: Internal padding for compact status pills, chips, and table cells.
- **`space-md` (16px)**: Standard form field padding, list item gaps, and standard button padding.
- **`space-lg` (24px)**: Interior card boundaries, modal content margins, and booking panel padding.
- **`space-xl` (32px)**: Separation between distinct administrative cards and dashboard grid blocks.

## Elevation & Depth

Visual hierarchy is maintained primarily through **tonal layering and crisp structural outlines** rather than heavy drop shadows.

### Elevation Hierarchy
1. **Base Surface (Level 0)**: `#F8FAF9` (Pearl White). The default canvas background.
2. **Structural Containers (Level 1)**: `#FFFFFF` (Surface Container Lowest) wrapped in a crisp 1px hairline border of `#DCE5E0` (Platinum Silver). No box-shadow is applied.
3. **Elevated Cards & Popovers (Level 2)**: `#FFFFFF` background with a 1px border of `#DCE5E0` and a precise, tinted ambient shadow: `0 4px 16px -2px rgba(6, 78, 59, 0.04), 0 2px 6px -1px rgba(23, 43, 37, 0.03)`.
4. **Modals & Flyout Drawers (Level 3)**: `#FFFFFF` with a 1px border of `#DCE5E0` accompanied by an executive soft drop shadow: `0 16px 36px -4px rgba(6, 78, 59, 0.08), 0 6px 12px -2px rgba(23, 43, 37, 0.04)`. The backdrop scrim uses `#172B25` at 40% opacity.
5. **Interactive Hover & Active Focus**: Elements lift through border color shifts to `#0F766E` (Deep Teal) or surface tone transitions to `#F2F6F4` rather than dramatic shadow expansion.

## Shapes

The design system enforces an 8px border-radius standard (`ROUND_EIGHT`) across primary UI containers. This subtle curvature softens structural lines while retaining an orderly, architectural silhouette appropriate for enterprise business tools.

### Radius Assignments
- **Inputs, Buttons, Cards, Modals, and Booking Time Slots**: Set to `0.5rem` (8px base roundedness).
- **Secondary Nested Blocks (Inner Panels, Tooltips)**: Set to `0.25rem` (4px).
- **Chips, Badges, and Avatar Frames**: Set to `rounded-full` (`9999px`) to create intentional geometric contrast against rectangular operational layouts.

## Components

### Buttons
- **Primary**: Background `#064E3B`, text `#FFFFFF`, border `none`, corner radius `0.5rem`. Hover state shifts to `#0F766E` with active state scaling slightly to 98% scale.
- **Secondary**: Background `#FFFFFF`, text `#064E3B`, 1px border `#DCE5E0`. Hover state transitions background to `#F2F6F4` and border to `#0F766E`.
- **Tertiary / Ghost**: Transparent background, text `#0F766E`. Hover state reveals `#F2F6F4` background without border.

### Booking Slot Selectors
- **Available**: Background `#FFFFFF`, text `#172B25`, 1px border `#DCE5E0`, radius `0.5rem`.
- **Selected**: Background `#064E3B`, text `#FFFFFF`, 1px border `#064E3B`, bold weight.
- **Unavailable / Disabled**: Background `#F2F6F4`, text `#A3B8AA`, 1px border transparent, cursor `not-allowed`.

### Input Fields
- Container: Background `#FFFFFF`, 1px border `#DCE5E0`, height `44px`, padding `0.5rem 1rem`, text `#172B25`, radius `0.5rem`.
- Focus state: Border shifts to `#0F766E` with a 2px outer outline in `rgba(15, 118, 110, 0.15)`.
- Placeholder: Text `#A3B8AA`.

### Cards & Container Panels
- Base container: Background `#FFFFFF`, border 1px solid `#DCE5E0`, border-radius `0.5rem`, padding `1.5rem`.
- Card Header: Separated by a 1px divider in `#DCE5E0` when containing secondary controls or filter pills.

### Chips & Status Badges
- **Confirmed / Completed**: Background `rgba(6, 78, 59, 0.10)`, text `#064E3B`, border 1px solid `rgba(6, 78, 59, 0.20)`.
- **In-Progress / Active**: Background `rgba(15, 118, 110, 0.10)`, text `#0F766E`, border 1px solid `rgba(15, 118, 110, 0.20)`.
- **Pending / Scheduled**: Background `#F2F6F4`, text `#172B25`, border 1px solid `#DCE5E0`.
- Geometry: Fully rounded (`9999px`), internal horizontal padding `0.75rem`, vertical padding `0.25rem`, label size `label-sm`.

### Checkboxes & Radio Buttons
- Unchecked: `#FFFFFF` fill with 1px border `#DCE5E0`.
- Checked: `#064E3B` fill with `#FFFFFF` inner check icon or center dot. Checkbox radius `0.25rem`, radio radius `9999px`.
- Focus Ring: `0 0 0 3px rgba(15, 118, 110, 0.2)`.

### Data Tables & Agenda Lists
- Table Header: Background `#F2F6F4`, uppercase `label-md` typography, color `#172B25`, bottom border 1px solid `#DCE5E0`.
- Table Rows: Alternating rows `#FFFFFF` and `#F8FAF9` or clean `#FFFFFF` with 1px border-bottom `#DCE5E0`. Hover row state: `#F2F6F4`.