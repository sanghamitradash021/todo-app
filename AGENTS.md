# AGENTS.md — Universal AI Context
# Todo Application

> This file is the single source of truth for all AI tools on this project.
> Generated from FRS.md + SDS.md. Every AI agent reads this first.

---

## 1. Project Overview

A monolithic full-stack Todo application where authenticated users can create, manage, and organize their personal tasks. Built with React + Zustand on the frontend and Node/Express + PostgreSQL on the backend, compiled entirely in TypeScript.

---

## 2. Repository Structure

```
todo-app/
├── src/
│   ├── frontend/
│   │   ├── components/     ← Reusable UI (Button, Modal, Badge, Toast, Spinner)
│   │   ├── hooks/          ← Custom React hooks (useAuth, useTodos, useToast)
│   │   ├── pages/          ← Route pages (LoginPage, RegisterPage, TodosPage)
│   │   ├── store/          ← Zustand stores (authStore, todoStore, uiStore)
│   │   ├── utils/          ← API client (axios instance), formatters, helpers
│   │   ├── config/         ← Constants, env vars (VITE_API_URL)
│   │   ├── types/          ← Shared TS types/interfaces
│   │   └── App.tsx         ← Router setup
│   │
│   └── backend/
│       ├── controllers/    ← Route handlers: parse req → call service → send res
│       ├── services/       ← Business logic only
│       ├── repositories/   ← SQL queries only (node-postgres)
│       ├── middleware/      ← authenticate.ts, validate.ts, errorHandler.ts
│       ├── routes/         ← Express router files
│       ├── config/         ← db.ts (pg Pool), env.ts, constants.ts
│       ├── utils/          ← logger.ts (winston), asyncHandler.ts
│       └── types/          ← Backend-specific TS types
│
├── docs/
│   ├── FRS.md              ← Business requirements (source of truth)
│   └── SDS.md              ← Technical design (source of truth)
├── AGENTS.md               ← This file
├── CLAUDE.md               ← Claude Code-specific rules
└── package.json            ← Root scripts
```

---

## 3. Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18, Vite 5, TypeScript 5 | |
| State | Zustand 4 | auth + todos + UI filters |
| Routing | React Router 6 | |
| HTTP Client | Axios 1 | with interceptors for auth + 401 |
| Styling | Tailwind CSS 3 | utility-first |
| Backend | Node 20, Express 4, TypeScript 5 | |
| Database | PostgreSQL 15 | node-postgres (pg) |
| Auth | JWT (jsonwebtoken 9) + bcryptjs 2 | |
| Validation | Zod 3 | schemas → TS types via z.infer |
| Logger | Winston 3 | JSON prod / pretty dev |
| Tests | Vitest 1 | |
| Linting | ESLint 8 | |
| Commits | commitlint 18 + husky 9 | |

---

## 4. Key Commands

```bash
npm install             # install all dependencies
npm run dev             # start frontend (Vite, :5173) + backend (nodemon, :3001)
npm run dev:frontend    # Vite only
npm run dev:backend     # nodemon only
npm run build           # tsc + vite build
npm run lint            # eslint check
npm run lint:fix        # eslint auto-fix
npm run test            # vitest run
npm run test:watch      # vitest watch
```

---

## 5. Architecture Patterns

### Backend — Strict Layer Separation
```
Route → Controller → Service → Repository → PostgreSQL
```
- **Controller:** ONLY req parsing + calling service + sending res. Zero logic.
- **Service:** ALL business rules. Throws errors for invalid states. No req/res.
- **Repository:** ONLY parameterized SQL. Returns typed plain objects. No logic.
- **Middleware:** `authenticate` verifies JWT and attaches `req.user`. `validate(schema)` runs Zod. `errorHandler` is the global catch-all.

### Frontend — Store-Driven
```
Page → Hook → Store (Zustand) → utils/api (Axios)
```
- Pages compose components and consume hooks/stores
- Hooks encapsulate async logic and side effects
- Stores hold global state; never call API directly from components
- API calls live in `utils/api.ts` (Axios instance with interceptors)

### Auth Flow
1. Login/Register → server returns JWT
2. JWT stored in Zustand `authStore` (in-memory only, no localStorage)
3. Axios request interceptor attaches `Authorization: Bearer <token>`
4. Axios response interceptor: 401 → clear authStore → redirect to `/login`

### Soft Delete
- `DELETE /api/todos/:id` sets `deleted_at` timestamp, never hard-deletes
- All queries filter `WHERE deleted_at IS NULL`

---

## 6. Coding Standards

- **TypeScript strict mode** — no `any`, use `unknown` + narrow
- **Files:** `camelCase.ts` for utilities/hooks, `PascalCase.tsx` for components
- **DB columns:** `snake_case` | **TS:** `camelCase` where possible (map in repo layer)
- **Constants:** `SCREAMING_SNAKE_CASE`
- **No magic strings** — use constants from `config/constants.ts`
- **Zod schemas** define validation; `z.infer<typeof Schema>` generates types

---

## 7. API Response Shapes (Non-Negotiable)

**Success:**
```json
{ "data": <payload>, "message": "..." }
```

**Error:**
```json
{ "error": "ERROR_CODE", "message": "human readable", "fields": ["field1"] }
```

**HTTP status codes MUST match SDS exactly. No deviations.**

---

## 8. Auth

- JWT in `Authorization: Bearer <token>` header
- Token expiry: 24 hours
- Protected routes: all `/api/todos/*`
- Public routes: `/api/auth/register`, `/api/auth/login`

---

## 9. DB Schema (Summary)

```
users:  id (UUID PK), email (unique), password (hash), created_at, updated_at
todos:  id (UUID PK), user_id (FK→users), title, description, status, priority,
        due_date, created_at, updated_at, deleted_at (soft delete)
```

---

## 10. Testing Approach

- Framework: **Vitest**
- Backend tests: `src/backend/**/*.test.ts` — unit test services and repositories
- Frontend tests: `src/frontend/**/*.test.tsx` — unit test components and hooks
- Test file mirrors the source file: `UserService.ts` → `UserService.test.ts`
- Run: `npm run test`

---

## 11. Logger Usage

```typescript
import { logger } from '@/utils/logger';
logger.info('message', { context });   // info level
logger.error('message', { error });    // error level — always include error object
logger.debug('message', { data });     // debug level — dev only
```

Never use `console.log` in production code. Use `logger.*` always.

---

## 12. ❌ Do NOT Do

- No `console.log` in source code — use `logger`
- No `any` in TypeScript
- No business logic in controllers
- No SQL in services or controllers — only in repositories
- No direct API calls from React components — use hooks/store
- No hardcoded secrets, URLs, or magic strings
- No `localStorage` for tokens — use Zustand in-memory store
- No hard deletes for todos — use soft delete (`deleted_at`)
- Never return passwords or hashes in API responses
- No skipping quality gates (build + lint + test must pass per phase)
