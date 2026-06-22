# UI Context — TrainHub Malaysia

## Design System (Vercel-Inspired)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#fafafa` | Page body |
| Foreground | `#171717` | All body text |
| Card | `#ffffff` | Cards, dialogs, modals |
| Primary | `#171717` | Primary CTA buttons |
| Border | `#ebebeb` | Hairline dividers |
| Muted text | `#888888` | Low-priority text |
| Ring/Focus | `#0070f3` | Focus rings |
| Destructive | `#ee0000` | Error states |
| Button shape | `rounded-full` | Pill buttons |
| Card radius | `0.5rem (8px)` | Cards |
| Input radius | `0.375rem (6px)` | Form inputs |
| Font | Geist Sans + Geist Mono | Typography |

> Based on Vercel's design language — stacked shadows, negative letter-spacing on headings, mono for technical labels, pill CTAs, four-step surface ladder.

## Shadow Tokens (CSS Variables)
```css
--shadow-card:       0 0 0 1px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.04);
--shadow-card-hover: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.06);
--shadow-card-lg:    0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.06);
--shadow-modal:      0 0 0 1px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.06), 0 24px 32px -8px rgba(0,0,0,0.1);
```

## Typography
- **Font family:** Geist Sans (body/headings), Geist Mono (code/labels)
- **Feature settings:** `font-feature-settings: "ss01", "ss02"` globally
- **Headings:** Weight 600, negative letter-spacing (`-0.96px` for h1, `-0.6px` for h2)
- **Body:** Weight 400, neutral tracking
- **Buttons:** Weight 500, 14-16px
- **Mono labels:** Weight 400, 12-13px — for technical captions only

## shadcn/ui Component Library (12 components)

| Component | File | Base | Variants |
|-----------|------|------|----------|
| Button | `button.tsx` | @base-ui/react | default, outline, secondary, ghost, destructive, link |
| Card | `card.tsx` | Native div | With CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Input | `input.tsx` | @base-ui/react | 40px height, 6px radius, card background |
| Textarea | `textarea.tsx` | Native textarea | 6px radius, card background |
| Badge | `badge.tsx` | @base-ui/react | default, secondary, destructive, outline, ghost, link |
| Dialog | `dialog.tsx` | @base-ui/react | Modal with overlay, header, footer |
| Tabs | `tabs.tsx` | @base-ui/react | default (pill) and line variants |
| Select | `select.tsx` | @base-ui/react | Dropdown with scroll buttons |
| Separator | `separator.tsx` | @base-ui/react | Horizontal / vertical |
| Checkbox | `checkbox.tsx` | @base-ui/react | With CheckIcon indicator |
| Skeleton | `skeleton.tsx` | Native div | Animate-pulse loading |
| Table | `table.tsx` | Native table | With header, body, footer, row, cell |

## Custom Application Components

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Role-aware sidebar nav (admin/trainer/hr menus) |
| `DashboardNavbar` | Top bar with hamburger, notifications, user menu |
| `AuthProvider` | Client-side auth context (user, loading, logout) |
| `ClientProviders` | Wraps AuthProvider for root layout |
| `CalendarView` | Monthly table-based calendar with color-coded events |
| `UpcomingTrainingList` | Detailed training cards with trainer, venue, time |
| `EventDetailDialog` | Modal for training details + approve/reject actions |

## Responsive Behavior
- **Desktop (≥1024px):** Sidebar visible (240px flex child), content takes remaining space, max-width 1152px centered
- **Mobile (<1024px):** Sidebar hidden, hamburger toggle, drawer overlay pattern, full-width content
- **Breakpoints:** Tailwind defaults — `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

## Color Categories (Calendar & Events)
| Category | Color |
|----------|-------|
| Leadership | `#3b82f6` (blue) |
| Technical | `#10b981` (emerald) |
| Soft Skills | `#8b5cf6` (violet) |
| Compliance | `#f59e0b` (amber) |
| Team Building | `#f43f5e` (rose) |
| HR Operations | `#06b6d4` (cyan) |

## Global CSS
Defined in `app/globals.css`:
- Tailwind v4 imports + `tw-animate-css` + `shadcn/dist/tailwind.css`
- CSS custom properties for all design tokens
- `@theme inline` block mapping tokens to Tailwind utilities
- `@layer base` for global border/outline/body styles
- `.form-input` and `.form-input-textarea` utility classes
- `.scroll-thin` thin scrollbar utility
