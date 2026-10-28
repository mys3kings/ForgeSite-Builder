# ForgeSite

ForgeSite turns natural-language website prompts into responsive React components with a live preview, local build history, and ZIP export.

## Run & Operate

- `pnpm install --frozen-lockfile` — install the pnpm workspace dependencies
- Run the `artifacts/forgesite: web` and `artifacts/api-server: API Server` workflows for the app and API.
- `pnpm run typecheck` — typecheck the workspace
- `pnpm run build` — typecheck and build the workspace packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and schemas from the OpenAPI spec
- The API requires `GEMINI_API_KEY` for website generation. Store it as a secret; never put it in frontend code.
- The current ForgeSite routes do not require a database. Database tooling under `lib/db` needs `DATABASE_URL` when used.

## Deployment

- The deployment target is Vercel.
- The current Replit preview runs the Vite frontend and Express API as separate managed services; the proxy routes `/api/*` to the API.
- No Vercel-specific deployment configuration is present yet. The Vercel deployment must provide a production API route or URL for the frontend's `/api/*` requests, and configure `GEMINI_API_KEY` on the server side.
- Keep Replit preview workflow settings separate from Vercel's build and runtime configuration.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/forgesite` — React + Vite ForgeSite interface and Sandpack preview.
- `artifacts/api-server` — Express API, health check, and Gemini website-generation route.
- `lib/api-spec/openapi.yaml` — API contract; generated clients and schemas live in `lib/api-client-react` and `lib/api-zod`.
- `lib/db` — Drizzle/PostgreSQL setup for database-backed features.

## Gotchas

- The Vite app expects `PORT` and `BASE_PATH`; the managed Replit workflow supplies them.
- The Replit preview depends on the API service being available at `/api`.
- Generated sites and history are browser-local; the app does not persist builds to the database.
- Vercel deployment still needs an explicit frontend-to-API routing strategy; the Replit artifact proxy does not configure Vercel.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
