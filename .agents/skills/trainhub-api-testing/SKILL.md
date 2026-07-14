---
name: trainhub-api-testing
description: |
  Shell-based API testing for TrainHub routes (Next.js 16 + Prisma + SQLite).
  Use when verifying API route changes, error handling, validation, or auth guards.
  Covers: environment setup → auth cookie acquisition → adversarial curl testing → server log verification.
---

# TrainHub API Testing

Shell-based testing for TrainHub API routes. No GUI recording needed — collect curl outputs as evidence.

## Prerequisites

1. `.env.local` with `JWT_SECRET=test-secret-for-dev-only` and `DATABASE_URL=file:./dev.db`
2. Database schema pushed and seeded
3. Production build completed
4. Server running on localhost:3000

## Setup Sequence

```bash
# 1. Schema + seed
cd /home/ubuntu/repos/thcms
npx prisma db push --accept-data-loss
DATABASE_URL=file:./dev.db npx tsx prisma/seed.ts

# 2. Build (always use --webpack on this project)
npx next build --webpack

# 3. Start server (background shell)
DATABASE_URL=file:./dev.db npm run start -- -p 3000

# 4. Verify
curl -s -w '%{http_code}' http://localhost:3000/login | tail -1  # expect 200
```

## Auth Cookie Acquisition

TrainHub uses JWT session cookies. Login via POST to get cookies for each role:

```bash
# Admin
curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@trainhub.my","password":"password123"}'

# Trainer (Aisha)
curl -s -c /tmp/trainer_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aisha@trainhub.my","password":"password123"}'

# HR (Petronas)
curl -s -c /tmp/hr_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"hr@petronas.my","password":"password123"}'
```

Use `-b /tmp/{role}_cookies.txt` on subsequent requests.

## Getting Real Entity IDs

Query list endpoints to get real IDs for targeted testing:

```bash
# Bookings (admin)
curl -s -b /tmp/admin_cookies.txt http://localhost:3000/api/admin/bookings | python3 -c "import sys,json; [print(b['id']) for b in json.load(sys.stdin).get('data',[])[:3]]"

# Reimbursements, claims, programs, training plans — same pattern with their respective endpoints
```

**Important**: Always use real seeded IDs, not hardcoded test IDs. IDs change on each seed run.

## Route-Specific Auth Requirements

| Prefix | Required role | Cookie file | Notes |
|--------|--------------|-------------|-------|
| `/api/admin/*` | ADMIN | admin_cookies.txt | |
| `/api/hr/*` | HR | hr_cookies.txt | Also checks `session.companyId` |
| `/api/trainer/*` | TRAINER | trainer_cookies.txt | Also checks ownership |
| `/api/notifications` | Any authenticated | any cookie | |

## Testing Patterns

### 1. Malformed JSON (error handling)

Send syntactically invalid JSON to routes that parse `request.json()`:

```bash
curl -s -w '\n%{http_code}' -X PATCH http://localhost:3000/api/notifications \
  -H 'Content-Type: application/json' -d '{invalid' -b /tmp/admin_cookies.txt
# Expect: 400, body contains "Invalid JSON"
```

### 2. Nonexistent Record (Prisma error handling)

Send valid JSON targeting a nonexistent ID:

```bash
curl -s -w '\n%{http_code}' -X PATCH http://localhost:3000/api/admin/reimbursements/nonexistent-id \
  -H 'Content-Type: application/json' -d '{"status":"APPROVED"}' -b /tmp/admin_cookies.txt
# Expect: 500 with error message (if no findUnique guard), or 404 (if findUnique guard exists)
```

### 3. Missing Required Fields (validation)

Send valid JSON with missing required fields:

```bash
curl -s -w '\n%{http_code}' -X POST http://localhost:3000/api/admin/remind-hrdf \
  -H 'Content-Type: application/json' -d '{}' -b /tmp/admin_cookies.txt
# Expect: 400 with specific validation message
```

### 4. Happy Path (regression)

Send valid requests to confirm changes don't break normal operation:

```bash
curl -s -w '\n%{http_code}' -X PATCH http://localhost:3000/api/notifications \
  -H 'Content-Type: application/json' -d '{"action":"markAllRead"}' -b /tmp/admin_cookies.txt
# Expect: 200 with success response
```

### 5. Server Log Verification

After triggering error paths, read the server shell output to verify `console.error` was called:

```bash
# Use get_output on the server shell to check for error log lines like:
# "Failed to update reimbursement: Error [PrismaClientKnownRequestError]: ..."
```

## Tips

- **Parallel shell execution**: Use different shell IDs for parallel curl calls, but outputs may get mixed up. Re-run individual tests if output seems stale.
- **Build flag**: Always use `--webpack` for builds. Turbopack might crash on certain platforms.
- **sqlite3 CLI**: May not be installed. Use curl to list endpoints or `npx tsx` scripts to query DB directly.
- **Error message variations**: Some routes use "Invalid JSON" while others use "Invalid JSON body". Both are valid — check the route source code for the exact wording.
- **Cookie expiry**: Session cookies might expire. If you get 401s on previously working requests, re-login.

## Devin Secrets Needed

- `JWT_SECRET` — set in `.env.local` (default: `test-secret-for-dev-only` for local testing)
- No external services or API keys required for local testing
