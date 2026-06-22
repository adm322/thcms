# Design System — TrainHub Malaysia

> Vercel-inspired design language for a clean, professional SaaS dashboard.

## Source

Based on [Vercel's DESIGN.md](awesome-design-md-main/design-md/vercel/DESIGN.md) from the `awesome-design-md` collection. Adapted for an HR/training platform with Geist typography, stacked shadows, pill buttons, and a monochrome palette with blue accents.

---

## Colors

### Brand & Surface

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| Canvas Soft | `#fafafa` | `--background` | Page body background |
| Ink | `#171717` | `--foreground` | All body text, headings |
| Canvas | `#ffffff` | `--card` | Cards, dialogs, modals |
| Surface 2 | `#f5f5f5` | `--muted`, `--secondary`, `--accent` | Hover states, secondary surfaces |
| Hairline | `#ebebeb` | `--border`, `--input` | 1px dividers, input borders |
| Mute | `#888888` | `--muted-foreground` | Low-priority text, placeholders |

### Interactive

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| Primary | `#171717` | `--primary` | Primary CTA buttons |
| On Primary | `#ffffff` | `--primary-foreground` | Text on primary surfaces |
| Link Blue | `#0070f3` | `--ring` | Focus rings, links |
| Destructive | `#ee0000` | `--destructive` | Error states, delete actions |

### Semantic Accents

| Token | Value | Usage |
|-------|-------|-------|
| Success | `#10b981` | Confirmed, pass, active |
| Warning | `#f59e0b` | Pending, medium priority |
| Violet | `#7928ca` | Chart accent |
| Cyan | `#50e3c2` | Chart accent |
| Pink | `#ff0080` | Chart accent |

### Sidebar

| Token | Value | CSS Variable |
|-------|-------|-------------|
| Sidebar BG | `#ffffff` | `--sidebar` |
| Sidebar Text | `#4d4d4d` | `--sidebar-foreground` |
| Sidebar Primary | `#171717` | `--sidebar-primary` |
| Sidebar Border | `#ebebeb` | `--sidebar-border` |

---

## Typography

### Font Families

| Role | Font | Weight | CSS Variable |
|------|------|--------|-------------|
| Sans (body/UI) | Geist Sans | 400, 500, 600 | `--font-geist-sans` |
| Mono (code/labels) | Geist Mono | 400 | `--font-geist-mono` |
| Heading | Geist Sans | 600 | `--font-heading` |

### Scale

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| h1 | ~24px | 600 | 1.2 | -0.96px | Page titles |
| h2 | ~20px | 600 | 1.25 | -0.6px | Section headings |
| h3 | ~16px | 600 | 1.3 | -0.4px | Card titles |
| Body | 14px | 400 | 1.5 | 0 | Default text |
| Body Sm | 12px | 400 | 1.4 | 0 | Captions, meta |
| Button | 14px | 500 | 1.2 | 0 | Button labels |
| Mono | 13px | 400 | 1.5 | 0 | Code, technical labels |

### Principles
- **Headings use weight 600** (never 700+) — calmer voice
- **Negative tracking on headings** (`-0.96px` at h1) — part of the brand
- **Mono reserved for technical labels** — section eyebrows, code, IDs
- **`font-feature-settings: "ss01", "ss02"`** enabled globally for geometric alternates

---

## Spacing

### Scale (4px base unit)

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| xxs | 4px | `p-1` | Tight inner padding |
| xs | 8px | `p-2` | Icon gaps |
| sm | 12px | `p-3` | Card internal gap |
| md | 16px | `p-4` | Standard padding |
| lg | 24px | `p-6` | Section padding |
| xl | 32px | `p-8` | Card internal (large) |
| 2xl | 48px | `p-12` | Section gap |
| 4xl | 64px | `p-16` | Page section |

### Layout
- **Max content width:** 1152px (`max-w-6xl mx-auto`) on desktop
- **Content inset:** `p-4` mobile, `p-8` desktop
- **Card grids:** 3-up desktop, 2-up tablet, 1-up mobile
- **Sidebar width:** 240px (`w-60`) fixed

---

## Border Radius

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| sm | 6px (0.375rem) | `rounded-md` | Form inputs, nav buttons |
| md | 8px (0.5rem) | `rounded-lg` | Cards, modals |
| lg | 12px (0.75rem) | `rounded-xl` | Large cards |
| full | 9999px | `rounded-full` | Buttons, badges, avatars |

**Rule:** Buttons are always `rounded-full` (pill). Cards are `rounded-lg` (8px). Inputs are `rounded-md` (6px).

---

## Elevation & Shadows

Cards use **stacked shadows** — multiple small offsets layered — never single heavy drop shadows.

```css
--shadow-card:       0 0 0 1px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.04);
--shadow-card-hover: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.06);
--shadow-modal:      0 0 0 1px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.06), 0 24px 32px -8px rgba(0,0,0,0.1);
```

### Elevation Levels

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 — Flat | No border, no shadow | Page body, hero text |
| 1 — Hairline | `border border-border` | Default cards |
| 2 — Subtle | Hairline + `shadow-card` | Hoverable cards |
| 3 — Elevated | Hairline + `shadow-card-hover` | Dialogs |
| 4 — Modal | Hairline + `shadow-modal` | Modal overlays |

---

## Components

### Buttons
```html
<!-- Primary: filled black pill -->
<Button variant="default">Action</Button>

<!-- Outline: white pill with hairline border -->
<Button variant="outline">Cancel</Button>

<!-- Ghost: transparent with hover -->
<Button variant="ghost">...</Button>

<!-- Destructive: red tint -->
<Button variant="destructive">Delete</Button>
```
- Shape: `rounded-full` (pill)
- Sizes: `default` (h-9 14px), `sm` (h-8 12px), `lg` (h-10 16px), `icon` (h-9 w-9)
- Weight: 500

### Cards
```html
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```
- Radius: `rounded-lg` (8px)
- Border: `border-border`
- Padding: `p-6` default, `p-4` compact (`size="sm"`)
- Background: `bg-card` (white)

### Inputs
```html
<Input placeholder="Text..." />
<Textarea rows={4} placeholder="Long text..." />
```
- Radius: `rounded-md` (6px)
- Height: `h-10` (40px)
- Background: `bg-card` (white)
- Border: `border-input`
- Focus: `ring-2 ring-ring/50`

### Badges
```html
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="outline">Tag</Badge>
<Badge variant="destructive">Error</Badge>
```
- Shape: `rounded-full` (pill)
- Size: `h-5` (20px), `text-xs`, `px-2.5`

### Dialogs
```html
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <!-- content -->
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabs
```html
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content</TabsContent>
  <TabsContent value="tab2">Content</TabsContent>
</Tabs>
```

### Tables
```html
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Separators
```html
<Separator />                    <!-- Horizontal -->
<Separator orientation="vertical" /> <!-- Vertical -->
```

---

## Color Categories

Used for calendar events, program badges, and chart accents.

| Category | Hex | Tailwind |
|----------|-----|----------|
| Leadership | `#3b82f6` | blue-500 |
| Technical | `#10b981` | emerald-500 |
| Soft Skills | `#8b5cf6` | violet-500 |
| Compliance | `#f59e0b` | amber-500 |
| Team Building | `#f43f5e` | rose-500 |
| HR Operations | `#06b6d4` | cyan-500 |

---

## Status Colors

| Status | Background | Text | Use |
|--------|-----------|------|-----|
| Confirmed / Active | `bg-emerald-100` | `text-emerald-700` | Bookings, pass |
| Pending / Medium | `bg-amber-100` | `text-amber-700` | Bookings, priority |
| Completed | `bg-blue-100` | `text-blue-700` | Bookings done |
| Cancelled / Error | `bg-red-100` | `text-red-700` | Cancelled, fail |
| Draft / Low | `bg-slate-100` | `text-slate-700` | Draft programs |
| Open | `bg-blue-100` | `text-blue-700` | Support tickets |

---

## Responsive Breakpoints

| Name | Width | Tailwind | Key Changes |
|------|-------|----------|-------------|
| Mobile | <640px | default | Full width, stacked |
| Tablet | 640-1023px | `sm:` | 2-up grids |
| Desktop | ≥1024px | `lg:` | Sidebar visible, 3-up grids, max-width content |

### Mobile-Specific
- Sidebar becomes a drawer overlay (hamburger toggle)
- Content goes full-width (no max-w constraint)
- Cards stack single-column
- Touch targets: ≥44px for interactive elements

---

## Icons

**Library:** `lucide-react` — consistent 24px stroke-width 2 icons.

**Usage:**
- `h-4 w-4` (16px) — inline with text, buttons
- `h-5 w-5` (20px) — standalone icons
- `h-8 w-8` (32px) — large decorative
- Always pass `className` not `size` prop
- Use `flex-shrink-0` on icons in flex containers

**Common icons by context:**
| Context | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Users/People | `Users`, `User` |
| Programs | `GraduationCap`, `BookOpen` |
| Bookings | `ClipboardList`, `Calendar` |
| Money | `DollarSign`, `Receipt` |
| Status | `CheckCircle2`, `AlertCircle`, `XCircle` |
| Actions | `Plus`, `Edit`, `Trash2`, `Save`, `X` |
| Navigation | `ChevronLeft`, `ChevronRight`, `Menu` |
| Files | `FileText`, `Download`, `Upload` |
| Star/Rating | `Star` |
| Communication | `MessageSquare`, `Send`, `Bell` |

---

## Utilities

### `cn()` — Classname Merger
```typescript
import { cn } from "@/lib/utils";
// Merges Tailwind classes, resolving conflicts
cn("px-4 py-2", condition && "bg-primary", className)
```

### Custom CSS Classes
```css
.form-input           /* Standard input styling */
.form-input-textarea  /* Standard textarea styling */
.scroll-thin          /* Thin custom scrollbar */
```

---

## Do's and Don'ts

### ✅ Do
- Use `bg-card` for cards/modals, `bg-background` for page body
- Use `rounded-full` for all buttons and badges
- Use `rounded-lg` (8px) for cards
- Use `rounded-md` (6px) for inputs
- Use stacked shadows (`shadow-card`) instead of single large shadows
- Use weight 600 for headings, 500 for buttons, 400 for body
- Use mono (`font-mono`) only for technical labels
- Wrap `useSearchParams()` in `<Suspense>`
- Always try-catch `request.json()` in API routes
- Return proper HTTP status codes from API routes

### ❌ Don't
- Don't use `bg-white` or `text-black` directly — use token classes
- Don't use `rounded` without a size suffix — use `rounded-lg`, `rounded-md`, `rounded-full`
- Don't use single heavy drop shadows (`shadow-lg`, `shadow-xl`)
- Don't set headings above weight 600
- Don't use mono for body paragraphs
- Don't skip error handling in API routes
- Don't import from `@/lib/store` or `@/lib/types` (legacy real estate code)
