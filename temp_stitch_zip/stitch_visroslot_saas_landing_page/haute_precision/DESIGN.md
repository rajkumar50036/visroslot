---
name: Haute Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cadcf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#daeaff'
  surface-container-highest: '#d3e4fb'
  on-surface: '#0b1d2d'
  on-surface-variant: '#45474d'
  inverse-surface: '#213243'
  inverse-on-surface: '#e9f1ff'
  outline: '#75777e'
  outline-variant: '#c5c6cd'
  surface-tint: '#525f78'
  primary: '#00030c'
  on-primary: '#ffffff'
  primary-container: '#101d33'
  on-primary-container: '#7985a0'
  inverse-primary: '#bac7e4'
  secondary: '#4b5f81'
  on-secondary: '#ffffff'
  secondary-container: '#c3d8ff'
  on-secondary-container: '#495e80'
  tertiary: '#050200'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b1900'
  on-tertiary-container: '#9d8059'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#bac7e4'
  on-primary-fixed: '#0e1b31'
  on-primary-fixed-variant: '#3b475f'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b2c7ee'
  on-secondary-fixed: '#021b3a'
  on-secondary-fixed-variant: '#334768'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#e3c196'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#5a4221'
  background: '#f8f9ff'
  on-background: '#0b1d2d'
  surface-variant: '#d3e4fb'
typography:
  display-hero:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Manrope
    fontSize: 34px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0em
  mono-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2.5rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an editorial, high-end agency ethos tailored for executive appointment booking, concierge services, and enterprise operations. Merging the understated discipline of Swiss International Typographic Style with modern Nordic product architecture, the aesthetic projects authority, bespoke craftsmanship, and structural permanence.

The visual language rejects loud gradients, chromatic noise, and hyperactive novelty. Instead, depth and confidence emerge through deliberate typographic tracking, hairline architectural dividers, generous white space, and a measured monochrome-adjacent marine palette. Interactions are quiet, immediate, and fluid, evoking the tactile precision of luxury horology and tailored stationery.

## Colors

The palette is restricted to a curated chromatic spectrum rooted in deep maritime hues, archival paper tones, and architectural metals:

- **Midnight Navy (`#101D33`)**: The authoritative base. Serves as primary text, dark hero banners, modal frame anchors, and high-emphasis action buttons.
- **Royal Slate (`#263B5B`)**: The transitional accent. Applied to active navigation items, elevated dark containers, selected states, and focused interactive borders.
- **Pearl White (`#F7F8FA`)**: The primary canvas background, conveying softness and luminous warmth over stark digital grey.
- **Platinum Silver (`#C7D0DC`)**: The structural linework. Used exclusively for 1px hairline dividers, structural grid borders, and subtle table framing.
- **Steel Blue (`#8293A8`)**: The functional neutral. Reserved for microcopy, table column headers, status metadata, and disabled or passive states.
- **Pure White (`#FFFFFF`)**: Card surfaces, popovers, contextual tooltips, and floating sheets.

Rules:
- Never combine colors into multi-hue gradients.
- Do not introduce chromatic status markers (e.g., green, red, amber, orange, purple). Semantic states rely on monochrome glyphs, filled/unfilled status indicators, badge iconography, and opacity shifts within the core palette.

## Typography

The typographic hierarchy pairs the structured geometry of Manrope for display and editorial sectioning with the analytical neutrality of Inter for dense interfaces and micro-data.

- **Headlines (Manrope)**: Rendered in medium to semi-bold weights with negative tracking. Larger editorial titles evoke high-end publication layouts while preserving digital punch.
- **Micro-labels and Headers (`label-caps`)**: Always converted to uppercase with `0.06em` positive tracking, rendered in Steel Blue (`#8293A8`), anchoring data tables, status sections, and card headers with architectural clarity.
- **Body & Data (Inter)**: Clean and unencumbered. Monospaced numeric alignment (`tnum`, `cv05`) should be activated globally via font-feature settings for appointment timetables, financial figures, and schedule timestamps.

## Layout & Spacing

The structural layout uses an asymmetrical, high-density grid system balancing dense operational toolsets with wide margin frames:

- **Desktop (1200px+)**: 12-column layout with 24px (`1.5rem`) gutters and generous 40px (`2.5rem`) canvas margins. Sidebars adhere to fixed ergonomic widths (260px primary, 320px contextual inspector) with fluid central scheduling grids.
- **Tablet (768px – 1199px)**: 8-column layout with 20px gutters and 24px page padding. Secondary inspector panels collapse into floating slide-overs.
- **Mobile (≤ 767px)**: 4-column layout with 16px (`1rem`) gutters and margins. Tables collapse into linear hairline-divided list items; split-pane schedule slots become stacked vertical cards.

Data density is achieved not through cramped margins, but through deliberate, compact component padding (`space-xs` and `space-sm`) surrounded by generous macro whitespace (`space-xl` and `margin`).

## Elevation & Depth

Depth is established primarily through **low-contrast architectural hairlines** and **micro-elevation**, actively eschewing heavy drop shadows.

1. **Base Tier (Ground)**: Pearl White (`#F7F8FA`) canvas.
2. **Surface Tier (Flat)**: Pure White (`#FFFFFF`) containers framed by a crisp 1px border using Platinum Silver (`#C7D0DC`). No drop shadow.
3. **Elevated Tier (Interactive / Popovers)**: Pure White (`#FFFFFF`) surfaces elevated with an ultra-diffused, micro-shadow: `0 4px 20px -2px rgba(16, 29, 51, 0.05)`, complemented by a 1px border in Platinum Silver.
4. **Overlay Tier (Modals / Slide-outs)**: Pure White surfaces with `0 24px 48px -12px rgba(16, 29, 51, 0.12)`, anchored against a Midnight Navy veil with 40% opacity (`rgba(16, 29, 51, 0.40)`).
5. **Inverted Surfaces (Actionable Prompts / Dark Contexts)**: Midnight Navy (`#101D33`) solid background with hairline interior borders in Royal Slate (`#263B5B`).

## Shapes

The design system maintains a disciplined, architectural silhouette (`roundedness: 1`):

- **Buttons, Inputs, and Badges**: Formed with 4px (`0.25rem`) corner radiuses, presenting crisp, intentional borders.
- **Cards and Panels**: Structured with 8px (`0.5rem`) outer corners, maintaining an institutional, tailored presence without harsh sharp corners.
- **Modal Containers & Sheets**: 12px (`0.75rem`) corner radiuses to soften large overlays while sustaining the structural frame.
- **Pill Elements**: Reserved exclusively for calendar day indicators and selected appointment slot badges (`rounded-full`), providing functional contrast against rectilinear content blocks.

## Components

### Buttons
- **Primary**: Solid Midnight Navy (`#101D33`) surface, Pure White text, 4px corner radius, 1px border matching the background. Hover state shifts to Royal Slate (`#263B5B`) with subtle transition. Active state scales subtly (98%).
- **Secondary**: Pure White surface, Midnight Navy text, 1px hairline border in Platinum Silver (`#C7D0DC`). Hover introduces Pearl White (`#F7F8FA`) background.
- **Ghost / Tertiary**: Transparent background, Royal Slate (`#263B5B`) text. Hover state initiates faint Pearl White fill with 0 border.
- **Dark Mode / Contrast Primary**: Pure White surface, Midnight Navy text, applied strictly inside dark hero containers.

### Inputs & Select Fields
- Height of 38px for dense operational velocity.
- Background in Pure White (`#FFFFFF`), border in 1px Platinum Silver (`#C7D0DC`), 4px border radius.
- Placeholder text in Steel Blue (`#8293A8`).
- Focus state switches border to Royal Slate (`#263B5B`) with no glow rings; an inward 1px solid stroke keeps geometries tight.

### Checkboxes & Radio Buttons
- 16px square (or circle), 1px Platinum Silver border, Pure White fill.
- Checked state: Midnight Navy fill with an interior Pure White checkmark glyph (or 6px dot for radio).
- Hover state transitions border to Royal Slate.

### Chips & Badges
- Compact padding (`2px 8px`), `label-caps` typography.
- Standard Chip: Pearl White surface, Steel Blue text, 1px Platinum Silver border.
- Active Filter Chip: Midnight Navy surface, Pure White text, no border.

### Appointment Booking Slots & Calendar Grids
- **Available Slot**: Pure White background, 1px Platinum Silver border, Midnight Navy time text, Steel Blue provider subtitle.
- **Hovered Slot**: Hairline border darkens to Royal Slate; subtle background shift to Pearl White.
- **Reserved / Selected Slot**: Midnight Navy background, Pure White text, 1px border in Midnight Navy.
- **Locked / Blocked Slot**: Muted background (`#F7F8FA`) with diagonal micro-hatching or 40% reduced opacity and Steel Blue typography.

### Cards & Container Panels
- Pure White base, 1px Platinum Silver hairline perimeter, 8px border radius.
- Internal headers partitioned with 1px horizontal dividers spanning border-to-border.
- Card padding set strictly to `space-lg` (`1.5rem`) for editorial breathing room, and `space-md` (`1rem`) for dense analytical metrics widgets.

### Data Tables
- Header row styled with `label-caps` typography, Steel Blue text, Pearl White background, bottom border in Platinum Silver.
- Data rows feature 44px height, Pure White background, subtle hover highlighting in Pearl White (`#F7F8FA`), and bottom 1px hairline divider. Numeric columns right-aligned with tabular figures.