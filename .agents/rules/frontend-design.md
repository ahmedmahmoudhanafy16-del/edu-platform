# Frontend Design Rules

## Core Principles
1. **Palette**:
   - Background: `n-50` (`#FAFAF7` light / `#0F1113` dark)
   - Cards/Surfaces: `white` light / `n-100` dark (`#171A1C`)
   - Borders: 1px crisp borders using `n-200` (`#E8E8E2`) light and `n-300` (`#2A2F36`) dark
   - Accent: Single teal color `#0E7C7B` (light `#E8F5F5`, text `#0A5252`, dark `#12A49C`)
   - Semantic: Ok `#2D6A4F`, Warn `#92400E`, Bad `#7F1D1D`

2. **Typography**:
   - Font: `Cairo` (Arabic & Latin) via `next/font/google`
   - Scale:
     - `text-display`: 24px / 32px / Bold (Page titles)
     - `text-title`: 20px / 28px / SemiBold (Section headers)
     - `text-body`: 16px / 24px / Regular (Body copy)
     - `text-label`: 14px / 20px / Medium (Form labels & nav)
     - `text-caption`: 12px / 18px / Regular (Metadata & subtext)
     - `text-micro`: 11px / 16px / Regular (Badges & tags)

3. **Layout & Alignment**:
   - Centered container: `max-w-6xl mx-auto px-4 py-8`
   - TopNav layout with sticky header, zero overlapping fixed sidebars
   - Strict `dir="rtl"` alignment for Arabic: icons on right, text aligned right, badges on left

4. **Interactions**:
   - Transitions strictly on `background-color, border-color, color` with duration `140ms`
   - No hover lift, scale, or bouncing animations
   - Shadows limited strictly to dropdowns, modals, and toasts (no card shadows)
