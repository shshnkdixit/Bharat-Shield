// Development orchestrator for the BharatShield monorepo.
//
// v0 / local environments do not provide the managed router that Replit uses to
// proxy `/api` to the shared Express server, and the Vite dev server requires a
// `PORT`/`BASE_PATH`. This script starts both packages together:
//   1. the Express API server on an internal port (API_PORT, default 5001)
//   2. the Vite web app on the public port (PORT, default 3000), which proxies
//      `/api` to the API server via API_PROXY_TARGET (see vite.config.ts).
//
// The web app is the process bound to the public port so the preview surfaces
// the actual application (the API server only answers `/api/*`).

import { spawn } from 'node:child_process';

const API_PORT = process.env.API_PORT || '5001';
const WEB_PORT = process.env.PORT || '3000';

const procs = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of procs) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  process.exit(code);
}

function run(name, args, env) {
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code ?? 'null'}`);
    shutdown(code ?? 0);
  });
  child.on('error', (err) => {
    console.error(`[dev] failed to start ${name}:`, err);
    shutdown(1);
  });
  procs.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// 1. Shared Express API server (internal port).
run('api-server', ['--filter', '@workspace/api-server', 'run', 'dev'], {
  PORT: API_PORT,
  NODE_ENV: 'development',
});

// 2. BharatShield web app (public port) with `/api` proxied to the API server.
run('bharatshield', ['--filter', '@workspace/bharatshield', 'run', 'dev'], {
  PORT: WEB_PORT,
  BASE_PATH: '/',
  API_PROXY_TARGET: `http://localhost:${API_PORT}`,
});
