---
name: TabSync Studio
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#4d556b'
  on-tertiary: '#ffffff'
  tertiary-container: '#656d84'
  on-tertiary-container: '#eef0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-kpi:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-sm: 1rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system caters to high-tempo, multi-tenant restaurant operations, kitchen display systems (KDS), and front-of-house staff alongside customer-facing QR ordering interfaces. The brand evokes surgical efficiency, operational clarity, and hospitality poise. It harmonizes an enterprise-grade control plane with intuitive, touch-friendly interactions required in high-stress dining room and kitchen environments.

The visual style merges Modern Corporate SaaS precision with refined Tactile micro-details. Core characteristics include:
- **Anchored Dual-Tone Workspace**: Deep nocturnal structural navigation framing an ultra-clean, high-legibility canvas to minimize cognitive load during busy shifts.
- **Precision Micro-Surfaces**: Crisp borders, subtle backdrop filters, and refined edge definitions inspired by modern modular utility systems.
- **High-Velocity Semantic Signal**: Distinct, purposeful status signaling (prep, ready, delivered, delayed) designed for immediate recognition from multiple feet away on tablets and counter displays.
- **Polished Professionalism**: Restrained gradients applied exclusively to primary intent triggers and brand accents, avoiding visual fatigue while retaining modern flair.

## Colors

The palette balances deep structural navigation with an ultra-legible, crisp operational surface, supported by distinct semantic indicators for real-time order states.

### Core Architectural Palette
- **Primary (`#2563EB`)**: Royal Blue for primary interactive actions, selected navigation items, focused input rings, and active state confirmations.
- **Secondary (`#7C3AED`)**: Electric Violet, paired with primary royal blue in subtle linear gradients (`135deg, #2563EB 0%, #7C3AED 100%`) for tenant branding accents, upsell triggers, and high-impact CTA banners.
- **Tertiary / Shell Surface (`#0B1120`, `#0F172A`)**: Deep Navy and Slate-900 utilized for primary navigation bars, sidebar drawers, and ambient order-dispatch rails.
- **Canvas Base (`#F8FAFC`, `#FFFFFF`)**: Pure White card layers overlaid against Slate-50 background foundations.
- **Borders & Dividers**: High-precision boundary lines using Slate-200 (`#E2E8F0`) in light workspaces and Slate-800 (`#1E293B`) within dark shells.

### Operational State Matrix
- **Success / Ready / Paid (`#10B981`)**: Emerald Green. Conveys resolved tickets, ready-to-serve orders, settled tabs, and healthy terminal sync states.
- **Pending / In Kitchen (`#F59E0B`)**: Warm Amber. Indicates tickets waiting on chef pick-up, modified dishes, or pending server acknowledgement.
- **Critical / Void / Delay (`#EF4444`)**: Crisp Crimson. Reserved for order cancellation, stock depletion (86'd items), payment failure, and kitchen delay alerts exceeding SLA thresholds.
- **Info / Counter Sync (`#0284C7`)**: Sky Blue for general table notifications, party re-seating, and guest service calls.

## Typography

The typographic system utilizes **Plus Jakarta Sans** for structural headlines, numeric metrics, table identifiers, and major order titles. Its geometric poise brings distinct brand character and immediate scannability. **Inter** powers all operational running text, table bodies, input surfaces, and granular order modifiers, ensuring maximum legibility under rapid glance conditions.

### Rules of Implementation
- **Numeric Clarity**: Tabular figures (`font-variant-numeric: tabular-nums`) must be applied across all currency displays, order timers, quantities, and table indices.
- **Hierarchy Enforcement**: Ticket cards must emphasize table and order numbers using `headline-md` or `metric-kpi`, with line item modifications and allergen alerts set in `body-sm` with distinct semantic color highlights.
- **Capitalization**: `label-xs` is exclusively styled in uppercase with positive letter spacing (`0.04em`) for badge states (e.g., `PREPARING`, `COLLECTED`, `SPLIT BILL`).

## Layout & Spacing

The layout architecture uses an asymmetric dual-pane fluid system. The navigation dock remains anchored, while the workspace content flexes using dynamic CSS grid structures optimized for high-density information architecture.

### Grid & Breakpoints
- **Desktop (1280px+)**: Fixed 260px Nocturnal sidebar, followed by a 12-column fluid grid canvas with `gutter-lg` (24px) and `margin-lg` (32px).
- **Tablet / POS / Kitchen Tablet (768px – 1279px)**: Collapsed icon dock (72px), 8-column responsive grid with `gutter` (20px). Supports multi-column Kanban pipelines for order progression.
- **Mobile Handheld / Guest QR View (< 768px)**: 4-column fluid layout with `gutter-sm` (12px) and `margin-sm` (16px). Single-column stacked cards with persistent floating action footers for bill calculation and submission.

### Spacing Density
- Apply `space-xs` and `space-sm` for intra-component relationships (icons to labels, title-to-badge gaps, tag lists).
- Apply `space-md` for standard card interior padding, input groupings, and data row spacing.
- Apply `space-lg` and `space-xl` strictly for panel boundaries, section dividers, and modal wrapper margins.

## Elevation & Depth

This system avoids heavy skeuomorphic drop shadows in favor of precise, low-altitude ambient boundaries and crisp micro-borders.

### Elevation Hierarchy
1. **Canvas Level (Flat)**: Background foundation (`#F8FAFC`). No shadow, base layer.
2. **Surface Level 1 (Resting Cards & Table Rows)**: `#FFFFFF` background with a 1px boundary of `rgba(226, 232, 240, 0.8)` (`#E2E8F0`) and an ambient micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
3. **Surface Level 2 (Hover States, Active Kitchen Tickets)**: Elevated on hover or active kitchen drag-and-drop: `0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)` with a border tint matching the state (e.g., Emerald, Amber, or Primary).
4. **Surface Level 3 (Dropdowns, Flyout Side-Panels, Modals)**: Deep spatial presence: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` combined with backdrop blur (`backdrop-filter: blur(8px)`) on modals and floating bottom sheets.

### Dark Shell Treatment
Within the dark navy navigation frame (`#0B1120`), depth is maintained purely through luminance layering: elevated elements use Slate-800 (`#1E293B`) fills, bordered by thin hairline outlines of `rgba(255, 255, 255, 0.08)`, avoiding heavy dark shadows.

## Shapes

The geometry uses a balanced modern radius scale (`roundedness: 2`, standard radius of `0.5rem` / 8px). This delivers a crisp, contemporary interface that avoids the sharpness of legacy enterprise consoles while preventing the cartoonish feel of fully pill-shaped surfaces.

### Radius Assignments
- **Core Elements (`0.5rem` / 8px)**: Standard buttons, text inputs, dropdown triggers, order item thumbnails, and table cells.
- **Containers & Surfaces (`1rem` / 16px - `rounded-lg`)**: Ticket cards, modal surfaces, table layout diagrams, and metric analytic blocks.
- **Pill Exceptions (`9999px`)**: Reserved strictly for operational status badges, live pulse dots, filter tag chips, and floating order count counters to differentiate them from interactive action buttons.

## Components

### Buttons
- **Primary Action**: Solid `#2563EB` background with `#FFFFFF` text. On hover, transition to `#1D4ED8`. Active state features a 2px offset focus ring in `#93C5FD`. Height: 40px (Desktop), 48px (Touch POS/Mobile).
- **Secondary Gradient (Brand CTA)**: Linear gradient (`135deg, #2563EB 0%, #7C3AED 100%`) with `#FFFFFF` text, used for high-impact actions like "Open Shift" or "Generate Daily Report".
- **Outline / Ghost**: 1px border of `#E2E8F0` on white surface, `#0F172A` text. Hover shifts to `#F1F5F9`.
- **Destructive**: Hairline crimson border, `#FEF2F2` background, `#EF4444` label for voids and table resets.

### Badges & Live Status Indicators
- **Status Pills**: Pill geometry with 12px height text (`label-xs`).
  - *Ready / Paid*: `#ECFDF5` background, `#047857` text, `#A7F3D0` micro-border.
  - *In Kitchen*: `#FFFBEB` background, `#B45309` text, `#FDE68A` micro-border.
  - *Delayed / Overdue*: `#FEF2F2` background, `#B91C1C` text, `#FECACA` micro-border.
- **Live Pulse Indicator**: 8px circular dot featuring an animated outward radar ping (`box-shadow` or pseudo-element pulse) to signify live web-socket socket connections and active kitchen tablet sync.

### Input Fields & Controls
- **Text Inputs & Selects**: 40px height, `#FFFFFF` surface, 1px `#CBD5E1` border, 8px radius. Active focus switches the border to `#2563EB` alongside a subtle 3px ring (`rgba(37, 99, 235, 0.15)`).
- **Checkboxes & Radios**: 18px square/circle with a 1.5px border. On check, transition to solid `#2563EB` with a white check icon or center dot.

### Cards & Ticket Modules
- **Order Ticket Card**: White base container with 16px radius, partitioned into:
  - *Header*: Table number, server name, elapsed timer with auto-shifting color (Green < 10m, Amber 10-20m, Crimson > 20m).
  - *Body*: Scannable list of items, item notes styled in subtle yellow callout boxes.
  - *Footer*: Action tray ("Fire Course", "Ready for Pickup", "Print Bill") spanning full width.

### Data Tables
- Clean tabular view with `#F8FAFC` sticky table header, 11px uppercase Slate-500 typography. Row heights fixed at 52px for high scanning efficiency, separated by 1px `#F1F5F9` borderlines. Hover triggers a solid `#F8FAFC` row background highlight.

### Counter Collection Indicator
- Specialized high-contrast display component used at kitchen pass or customer pickup screens: Deep Slate-900 background with massive `metric-kpi` typography in vibrant Emerald (`#10B981`) for ready tickets and Amber (`#F59E0B`) for prepping tickets.