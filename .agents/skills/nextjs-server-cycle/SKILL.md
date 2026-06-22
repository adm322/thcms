---
name: nextjs-server-cycle
description: |
  Server lifecycle management for TrainHub (Next.js 16 + SQLite on Windows).
  Use when the user says "start localhost", "stop server", "restart server", "rebuild", "refresh localhost", "server down", "server not responding", or after making code changes that need deployment.
  Handles: kill existing process → delete DB if needed → push schema → seed → build → start → verify.
---

# Next.js Server Lifecycle (TrainHub / Windows)

SQLite locks the database when the server is running, so the server MUST be stopped before any schema changes or seeding.

## Quick Commands

### Stop Server
```bash
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force"
```
Verify: `curl` should return exit code 7 (connection refused).

### Start Server (production mode — recommended for stability)
```bash
cd /c/Users/Adaml/ZCodeProject && npx next start -p 3000
```
Run in background with `run_in_background: true`. Wait 4-5 seconds before testing.

### Rebuild + Restart (after code changes)
```bash
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2" && cd /c/Users/Adaml/ZCodeProject && npx next build --webpack 2>&1 | tail -5 && npx next start -p 3000
```
Always use `--webpack` on Windows — Turbopack crashes reading the `nul` device.

### Fresh Database + Seed + Rebuild + Start
Use when schema changed or FK constraints make incremental seeding fail:
```bash
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2" && cd /c/Users/Adaml/ZCodeProject && npx prisma db push --force-reset --accept-data-loss 2>&1 && npx tsx prisma/seed.ts 2>&1 | tail -15 && npx next build --webpack 2>&1 | tail -5 && npx next start -p 3000
```

## Verification

```bash
# Check login page (should return 200)
curl -s -o NUL -w "%{http_code}" http://localhost:3000/login

# Check protected page (should return 307 = redirect to login = page exists)
curl -s -o NUL -w "%{http_code}" http://localhost:3000/admin/training-plans
```

## Common Issues

| Symptom | Fix |
|---------|-----|
| `EADDRINUSE` error | Server already running — kill it first |
| `no such table: X` | Schema not pushed — run `npx prisma db push` |
| FK constraint on seed | Delete `dev.db` and `dev.db-journal` files, then push + seed fresh |
| Build succeeds but old pages shown | Server running old build — kill and restart |
| `exit code 7` from curl | Server not running — start it |
| `exit code 127` from bash | Command not found — use `cmd /c` prefix or check path |
| `netstat -ano | findstr :3000` empty but server responding | Server on IPv6 `::` interface — use curl to verify instead |

## Dev vs Production

- **Dev mode** (`npm run dev -- --webpack`): Slow (400-2500ms page loads), high memory, but hot-reloads on code changes. Use for rapid iteration.
- **Production mode** (`next build --webpack && next start`): Fast (~5ms page loads), stable, but requires rebuild after every code change. Use for testing/demo.
