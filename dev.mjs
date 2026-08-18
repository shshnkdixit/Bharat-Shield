// Development launcher for the BharatShield monorepo.
//
// v0 / the preview only runs the root `dev` script and detects a single open
// port. BharatShield is split into two workspace packages:
//   - @workspace/api-server  (Express API, serves /api/*)
//   - @workspace/bharatshield (Vite React frontend, calls /api/* relative URLs)
//
// This launcher starts the API server on an internal port and the Vite dev
// server on the primary port. Vite proxies /api -> the API server (see
// artifacts/bharatshield/vite.config.ts), so the frontend and backend share a
// single origin from the browser's perspective.

import { spawn } from 'node:child_process';

const FRONTEND_PORT = process.env.PORT || '3000';
const API_PORT = process.env.API_PORT || '3001';

const children = [];
let shuttingDown = false;

function run(name, args, env) {
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`[dev] "${name}" exited with code ${code ?? 0}`);
    shutdown(code ?? 0);
  });

  children.push(child);
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Backend: Express API on the internal API_PORT.
run('api-server', ['--filter', '@workspace/api-server', 'run', 'dev'], {
  PORT: API_PORT,
  NODE_ENV: 'development',
});

// Frontend: Vite dev server on the primary PORT, proxying /api to the backend.
run('bharatshield', ['--filter', '@workspace/bharatshield', 'run', 'dev'], {
  PORT: FRONTEND_PORT,
  BASE_PATH: '/',
  API_PROXY_TARGET: `http://localhost:${API_PORT}`,
});
