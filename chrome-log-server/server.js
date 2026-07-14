/**
 * chrome-log-server — local error capture for manual browser testing.
 *
 * Receives console errors and network failures from the browser via
 * fetch() POSTs and writes each one as a JSON file in ./logs/.
 *
 * NOTE: This server is for development only. Do NOT run in production.
 *
 * Start: node chrome-log-server/server.js
 * Default port: 3100 (we avoid 3000 because that's the Next.js dev port).
 *
 * Override with PORT env var: PORT=4000 node chrome-log-server/server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3100;
const LOG_FOLDER = path.join(__dirname, 'logs');

// Create logs folder if it doesn't exist
if (!fs.existsSync(LOG_FOLDER)) {
    fs.mkdirSync(LOG_FOLDER, { recursive: true });
}

const server = http.createServer((req, res) => {
    // Enable CORS so Chrome can talk to this local server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log-error') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const errorData = JSON.parse(body);
                const timestamp = new Date().toISOString().replace(/:/g, '-');
                const safeType = String(errorData.type || 'Unknown')
                    .replace(/[^a-zA-Z0-9-_]/g, '_')
                    .slice(0, 40);
                const fileName = `${safeType}-${timestamp}.json`;

                fs.writeFileSync(
                    path.join(LOG_FOLDER, fileName),
                    JSON.stringify(errorData, null, 2)
                );

                // Also write to a rolling "latest.log" for tail-friendly viewing
                fs.appendFileSync(
                    path.join(LOG_FOLDER, 'latest.log'),
                    `[${new Date().toISOString()}] [${errorData.type || 'Unknown'}] ${errorData.message || ''}\n`
                );

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', file: fileName }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', logsFolder: LOG_FOLDER }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`[chrome-log-server] Listening on http://localhost:${PORT}`);
    console.log(`[chrome-log-server] Logs will save to: ${LOG_FOLDER}`);
    console.log(`[chrome-log-server] Try: curl http://localhost:${PORT}/health`);
});
