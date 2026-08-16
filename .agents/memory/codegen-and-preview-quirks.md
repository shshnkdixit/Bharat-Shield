---
name: Codegen and preview quirks
description: Environment-specific constraints found while building the BharatShield prototype.
---

The Orval/Zod toolchain in this workspace currently emits `zod.int()` for OpenAPI `integer` fields while resolving Zod 3 at typecheck time. Use bounded numeric schemas plus explicit integer checks at the server boundary when this mismatch applies.

**Why:** A contract with integer fields made code generation succeed but caused the required library typecheck to fail.

**How to apply:** After changing OpenAPI numeric fields, run codegen and the full typecheck before building the frontend.

Managed Vite workflows provide `PORT` and `BASE_PATH`; direct local build commands need those environment variables supplied explicitly.

**Why:** The app can typecheck and preview correctly while a bare `vite build` fails before loading the config.

**How to apply:** Prefer the managed workflow for verification, or run direct builds with temporary `PORT` and `BASE_PATH` values.