// Simple wrapper to start server and keep it running
import { spawn } from 'child_process';
import { createServer } from 'http';

const server = spawn('npx', ['next', 'start', '-p', '3000'], {
  cwd: 'E:/Project Repo/thcms',
  stdio: 'inherit',
  detached: true,
  shell: true
});

server.unref();

// Wait for server to be ready
async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await fetch('http://localhost:3000/login');
      if (res.ok) {
        console.log('Server is UP');
        return;
      }
    } catch {}
    process.stdout.write('.');
  }
  console.log('Server failed to start');
}

waitForServer();
