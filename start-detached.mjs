// Start Next.js server detached, then exit
import { spawn } from 'child_process';

const proc = spawn('npx', ['next', 'start', '-p', '3000'], {
  cwd: 'E:/Project Repo/thcms',
  stdio: 'ignore',
  detached: true,
  shell: true
});
proc.unref();
console.log('Server started, PID:', proc.pid);
process.exit(0);
