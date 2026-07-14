# chrome-log-server

Local Node.js server that captures browser errors and writes them as JSON files to `./logs/`.

Use this while manually testing the TrainHub app — every JS error, unhandled promise rejection, and failed `fetch`/XHR in the browser is forwarded here and saved.

## Quick start

```bash
# Terminal 1: start the log server
node chrome-log-server/server.js

# Terminal 2: (already running) start the app
npm run dev
```

The log server listens on **port 3100** (overridable via `PORT=...`).
Logs are written to `chrome-log-server/logs/`.

## Add the interceptor to your pages

Drop the contents of `chrome-log-server/interceptor.js` into the `<head>` of any HTML page **before** any other script. The cleanest place in this project is `app/layout.tsx` (root layout) — see the patch below.

```tsx
// app/layout.tsx — inside the <head> after Geist fonts
<head>
  ...
  <Script id="error-interceptor" strategy="beforeInteractive">
    {`/* paste contents of chrome-log-server/interceptor.js here */`}
  </Script>
</head>
```

Or add it as a static script reference:
```tsx
<head>
  ...
  <script src="/chrome-log-server/interceptor.js" />
</head>
```

## What it captures

- `JavaScript Error` — window `error` events
- `Promise Rejection` — unhandled rejections
- `Network Failure` — `fetch()` calls that throw
- `XHR Failure` — `XMLHttpRequest` error events

Each event is written as a timestamped `.json` file AND appended as a one-liner to `logs/latest.log`.

## Inspecting logs

```bash
# Tail the rolling log
tail -f chrome-log-server/logs/latest.log

# Or list recent files
ls -lt chrome-log-server/logs/ | head

# Or pretty-print the latest
ls -t chrome-log-server/logs/*.json | head -1 | xargs cat | head -30
```

## Health check

```bash
curl http://localhost:3100/health
# → {"status":"ok","logsFolder":"..."}
```
