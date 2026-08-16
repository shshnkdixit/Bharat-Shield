// Root dev launcher for the BharatShield pnpm workspace.
//
// The project originated on Replit, where managed workflows injected the
// PORT/BASE_PATH env vars and routed requests to the API + web packages.
// Outside Replit there is no such workflow, so this launcher reproduces it:
//   - starts the Express API server on an internal port
//   - starts the Vite web app on the port the preview detects
//   - the Vite config proxies /api -> the API server (see vite.config.ts)
//
// This only wires up startup/preview. It does not change app or backend logic.

import { spawn } from "node:child_process";

const API_PORT = process.env.API_PORT ?? "3001";
const WEB_PORT = process.env.PORT ?? "3000";
const BASE_PATH = process.env.BASE_PATH ?? "/";
const API_PROXY_TARGET =
  process.env.VITE_API_PROXY_TARGET ?? `http://127.0.0.1:${API_PORT}`;

const children = [];
let shuttingDown = false;

function run(name, filter, extraEnv) {
  const child = spawn(
    "pnpm",
    ["--filter", filter, "run", "dev"],
    {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    },
  );

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.log(`[${name}] exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
    shutdown(code ?? 0);
  });

  children.push(child);
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(code);
}

run("api", "@workspace/api-server", {
  NODE_ENV: "development",
  PORT: API_PORT,
});

run("web", "@workspace/bharatshield", {
  NODE_ENV: "development",
  PORT: WEB_PORT,
  BASE_PATH,
  VITE_API_PROXY_TARGET: API_PROXY_TARGET,
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => shutdown(0));
}
