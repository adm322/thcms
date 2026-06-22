# AI Workflow Rules — TrainHub Malaysia

> Rules for AI coding agents working on this project.

## Stack
- **Next.js 16.2.9** (App Router, Turbopack) — read `node_modules/next/dist/docs/` for breaking changes
- **React 19.2**, **TypeScript 5**, **Tailwind CSS v4**, **shadcn/ui base-nova** (@base-ui/react)
- **Prisma 7** with SQLite + PrismaLibSql adapter
- **Auth:** `jose` JWT, HTTP-only cookies, custom `proxy.ts`
- **Icons:** Lucide React

## Key Next.js 16 Differences
- `middleware.ts` → **`proxy.ts`** (export function `proxy`, not `middleware`)
- `cookies()`, `headers()`, `params`, `searchParams` are **async** (must `await`)
- `revalidateTag()` requires a second `cacheLife` argument
- Turbopack is default; custom `webpack` configs cause build failures
- `useSearchParams()` requires `<Suspense>` boundary

## Code Patterns

### API Routes
- Always wrap `request.json()` in try-catch, return 400 on failure
- Validate required fields before Prisma calls
- Use `getSession()` for auth, check role + companyId
- Return proper HTTP codes: 200/201/400/401/403/404/500

### Database
- Prisma client singleton in `lib/prisma.ts`
- Cascade delete: manually clean child records before parent (SQLite lacks FK cascade)
- Schema pushed via `npx prisma db push`; regenerate with `npx prisma generate`

### Components
- Client components need `"use client"` directive
- Use `shadcn/ui` primitives from `components/ui/`
- Icons from `lucide-react` only
- `cn()` from `lib/utils` for className merging

### Styling
- Tailwind v4 with CSS-based config in `globals.css` (no `tailwind.config.ts`)
- Design tokens: `#fafafa` bg, `#171717` ink, `#ebebeb` border, `#0070f3` focus
- Buttons: `rounded-full` (pill), Cards: `rounded-lg` (8px), Inputs: `rounded-md` (6px)
- No heavy drop shadows — use stacked subtle shadows

### Auth
- Proxy checks JWT cookie, redirects to `/login`, enforces role-based routing
- `AuthProvider` wraps app for client-side auth state
- Role check: `session.role === "ADMIN" | "TRAINER" | "HR"`

### File Naming
- Pages: `page.tsx`, Layouts: `layout.tsx`, API: `route.ts`
- Components: PascalCase, Utilities: camelCase
- Route groups: `(dashboard)`, `(auth)`

## Before Writing Code
1. Read existing files first — the harness tracks file state
2. Match surrounding code style (comments, naming, patterns)
3. Use `EnterPlanMode` for multi-file or architectural changes
4. Test API endpoints with curl after changes

## Common Fixes
- **500 on empty body:** Missing try-catch on `request.json()`
- **404 on valid route:** Check proxy.ts path matching
- **308 redirect:** Trailing slash or empty dynamic param
- **Prisma errors:** Run `npx prisma generate` after schema changes, restart dev server
