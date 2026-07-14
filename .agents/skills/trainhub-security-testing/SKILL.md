---
name: trainhub-security-testing
description: |
  End-to-end security testing for TrainHub auth guards, XSS, and password hashing.
  Use when verifying security fixes, testing auth middleware, testing role-based access control,
  or when the user says "test security", "verify auth", "test the guards", "check XSS".
  Shell-based curl testing — no browser recording needed.
---

# TrainHub Security Testing

## Prerequisites

- Server built and running: `npm run build -- --webpack && npx next start`
- Database seeded: `npx prisma db push && npx tsx prisma/seed.ts`
- `sqlite3` installed for DB inspection: `sudo apt-get install -y sqlite3`

## Critical: JWT_SECRET Setup

TrainHub has a **two-layer auth architecture** with a JWT secret mismatch pitfall:

- `proxy.ts` falls back to hardcoded `"trainhub-my-jwt-secret-key-2026-change-in-prod"`
- `lib/auth.ts` falls back to `crypto.getRandomValues(new Uint8Array(32))`

**Without `JWT_SECRET` env var, proxy can never verify tokens from auth.ts.** All requests appear unauthenticated to the proxy, and role-based enforcement (403 for wrong role) silently degrades to blanket 307 redirects.

**Fix before testing:** Set `JWT_SECRET` in `.env`:
```
JWT_SECRET="trainhub-my-jwt-secret-key-2026-change-in-prod"
```
Then rebuild and restart the server. Re-login after restart to get tokens signed with the correct secret.

## Auth Architecture (must understand before writing tests)

### Layer 1: proxy.ts middleware
- Intercepts ALL requests before route handlers
- Unauthenticated → **307 redirect** to `/login?redirect=...` (NOT 401)
- Wrong role on `/api/admin/*` → **403** `{"error":"Forbidden"}`
- Wrong role on `/api/trainer/*` → **403**
- Wrong role on `/api/hr/*` → **403**
- **No role check** for `/api/participants/*` — route-level guard is primary

### Layer 2: Route handler guards
- Defense-in-depth `getSession()` + role checks
- Returns **401** `{"error":"Unauthorized"}` if proxy is bypassed
- For `/api/participants/*`, this IS the primary protection

### Implication for test expectations
- Unauthenticated API requests → expect **307** (not 401)
- Wrong-role on `/api/admin/*` → expect **403** from proxy (not 401 from route)
- To test route-level guards in isolation, you'd need to bypass proxy (not typical)

## Cookie Handling with curl

The login endpoint sets `httpOnly` cookies with `Secure=true`. Since testing uses `http://localhost`, curl's `-b <file>` won't send secure cookies over HTTP.

**Workaround:** Extract the token and send via header:
```bash
# Login and save cookie file
curl -s -c /tmp/admin.cookies -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trainhub.my","password":"password123"}'

# Extract token (bypasses Secure flag issue)
ADMIN_TOKEN=$(grep trainhub_session /tmp/admin.cookies | awk '{print $NF}')

# Use via Cookie header
curl -s -H "Cookie: trainhub_session=$ADMIN_TOKEN" http://localhost:3000/api/admin/finance
```

## Test Procedure

### 1. Login as each role
```bash
curl -s -c /tmp/admin.cookies -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"admin@trainhub.my","password":"password123"}'
curl -s -c /tmp/hr.cookies -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"hr@petronas.my","password":"password123"}'
curl -s -c /tmp/trainer.cookies -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"aisha@trainhub.my","password":"password123"}'

# Extract tokens
ADMIN_TOKEN=$(grep trainhub_session /tmp/admin.cookies | awk '{print $NF}')
HR_TOKEN=$(grep trainhub_session /tmp/hr.cookies | awk '{print $NF}')
TRAINER_TOKEN=$(grep trainhub_session /tmp/trainer.cookies | awk '{print $NF}')
```

### 2. Test unauthenticated access (expect 307)
Hit each protected endpoint WITHOUT cookies. Verify HTTP 307 redirect to `/login`.

### 3. Test wrong-role access (expect 403)
Hit `/api/admin/*` endpoints WITH non-admin (HR/TRAINER) cookie. Verify HTTP 403 `{"error":"Forbidden"}`.

### 4. Test correct-role access (expect 200)
Hit endpoints WITH correct role cookie. Verify HTTP 200 with expected data. This catches regressions from overly aggressive auth guards.

### 5. Test certificate endpoint (adversarial)
- No cookie → 307 (auth blocked)
- Valid cookie + fake participant ID → 403 "Certificate not available" (auth passed, business logic rejected)
- This distinguishes auth-failure from business-logic-failure

### 6. Verify password hashing
```bash
sqlite3 dev.db "SELECT email, passwordHash FROM User LIMIT 3"
```
- Must start with `scrypt:`
- Format: `scrypt:<32-hex-salt>:<128-hex-hash>`

### 7. Test login with scrypt passwords
- Correct password → 200 with user object
- Wrong password → 401 with error message

### 8. XSS verification
Inject `<script>alert(1)</script>` into a participant name in DB, fetch their certificate, verify HTML output contains `&lt;script&gt;` (escaped) not `<script>` (raw).

## Seed Data Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@trainhub.my | password123 | ADMIN |
| hr@petronas.my | password123 | HR |
| aisha@trainhub.my | password123 | TRAINER |

## Common Pitfalls

| Symptom | Root Cause |
|---------|------------|
| All requests return 307, even with cookies | JWT_SECRET not set — proxy and auth.ts use different fallback secrets |
| curl `-b file` doesn't send cookie | Secure flag on cookie + HTTP (not HTTPS) — extract token and use `-H "Cookie: ..."` |
| Expect 401 but get 307 | proxy.ts intercepts before route handler — 307 is correct for unauthenticated |
| Expect 401 but get 403 | proxy.ts role check fires before route handler — 403 is correct for wrong role on `/api/admin/*` |
| All seed users share same password hash | Seed script artifact — runtime `hashPassword()` generates unique salts |

## Devin Secrets Needed

- `JWT_SECRET` — must be set in `.env` for proxy.ts and lib/auth.ts to use the same signing key. Without it, auth testing is unreliable.
