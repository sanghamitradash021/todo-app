# SDS.md — Software Design Specification
# Todo Application

---

## 1. Architecture Overview

**Architecture Style:** Monolithic (single deployable unit)  
**Pattern:** MVC-adjacent — Controller → Service → Repository → DB

```
client (React + Vite)
      ↓ HTTP/REST
server (Node + Express) — monolith
      ↓
PostgreSQL
```

---

## 2. Repository Structure

```
todo-app/
├── src/
│   ├── frontend/                  ← React application
│   │   ├── components/            ← Reusable UI components
│   │   ├── hooks/                 ← Custom React hooks
│   │   ├── pages/                 ← Route-level page components
│   │   ├── store/                 ← Zustand state stores
│   │   ├── utils/                 ← Helper functions, API client
│   │   ├── config/                ← Frontend config (env vars, constants)
│   │   ├── types/                 ← Shared TypeScript types/interfaces
│   │   └── App.tsx
│   │
│   └── backend/                   ← Express application
│       ├── controllers/           ← Route handlers (req/res only)
│       ├── services/              ← Business logic
│       ├── repositories/          ← DB queries (SQL via pg)
│       ├── middleware/            ← Auth, error handler, validation
│       ├── routes/                ← Express router definitions
│       ├── config/                ← DB config, env, constants
│       ├── utils/                 ← Logger, helpers
│       └── types/                 ← Backend TypeScript types
│
├── docs/
│   ├── FRS.md
│   └── SDS.md
├── AGENTS.md
├── CLAUDE.md
├── package.json                   ← Root scripts
├── tsconfig.json
├── .eslintrc.json
├── .commitlintrc.json
└── .husky/
```

---

## 3. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18.x |
| Frontend Build | Vite | 5.x |
| Frontend Language | TypeScript | 5.x |
| State Management | Zustand | 4.x |
| HTTP Client | Axios | 1.x |
| Routing | React Router | 6.x |
| UI Components | Custom + Tailwind CSS | 3.x |
| Backend Runtime | Node.js | 20.x LTS |
| Backend Framework | Express | 4.x |
| Backend Language | TypeScript | 5.x |
| Database | PostgreSQL | 15.x |
| DB Client | node-postgres (pg) | 8.x |
| Auth | JWT (jsonwebtoken) | 9.x |
| Password Hash | bcryptjs | 2.x |
| Validation | zod | 3.x |
| Logger | winston | 3.x |
| Linting | ESLint | 8.x |
| Commit Lint | commitlint | 18.x |
| Git Hooks | husky | 9.x |
| Test Runner | Vitest | 1.x |

---

## 4. Database Schema

### Table: `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,   -- bcrypt hash
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `todos`
```sql
CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'completed')),
  priority    VARCHAR(10) NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ              -- soft delete
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status  ON todos(status);
```

---

## 5. API Contract

**Base URL:** `/api`  
**Auth:** `Authorization: Bearer <jwt>` on all `/todos` routes

### Response Envelope

**Success:**
```json
{ "data": <payload>, "message": "..." }
```

**Error:**
```json
{ "error": "<ERROR_CODE>", "message": "...", "fields": [...] }
```

---

### Auth Endpoints

#### `POST /api/auth/register`
**Request:**
```json
{ "email": "string", "password": "string" }
```
**Response 201:**
```json
{ "data": { "token": "string", "user": { "id": "uuid", "email": "string" } } }
```
**Errors:** 409, 422

---

#### `POST /api/auth/login`
**Request:**
```json
{ "email": "string", "password": "string" }
```
**Response 200:**
```json
{ "data": { "token": "string", "user": { "id": "uuid", "email": "string" } } }
```
**Errors:** 401, 422

---

### Todo Endpoints

#### `GET /api/todos`
**Query params:** `status?: pending|completed`, `priority?: low|medium|high`  
**Response 200:**
```json
{ "data": [ Todo ] }
```

#### `POST /api/todos`
**Request:**
```json
{ "title": "string", "description?": "string", "priority?": "low|medium|high", "due_date?": "YYYY-MM-DD" }
```
**Response 201:**
```json
{ "data": Todo }
```

#### `GET /api/todos/:id`
**Response 200:** `{ "data": Todo }`  
**Errors:** 404

#### `PATCH /api/todos/:id`
**Request:** (all fields optional)
```json
{ "title?": "string", "description?": "string", "priority?": "string", "due_date?": "string" }
```
**Response 200:** `{ "data": Todo }`

#### `PATCH /api/todos/:id/toggle`
**Response 200:** `{ "data": Todo }`

#### `DELETE /api/todos/:id`
**Response 204:** (no body)

---

### Todo Object Shape
```typescript
interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;   // YYYY-MM-DD
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
}
```

---

## 6. Architecture Patterns

### Backend Layer Rules
- **Controller:** Parse req, call service, send res. NO business logic.
- **Service:** All business logic. Calls repositories. Never touches req/res.
- **Repository:** ONLY SQL queries. Returns plain objects. No business logic.
- **Middleware:** Auth verification, request validation (zod), error handling.

### Frontend Layer Rules
- **Pages:** Route-level components. Compose components. Connect to stores.
- **Components:** Stateless where possible. Accept props. No direct API calls.
- **Hooks:** Encapsulate side effects, API calls, derived state logic.
- **Store (Zustand):** Global client state — auth, todos list, UI state (filters).
- **Utils:** Pure functions — formatters, validators, API client setup.
- **Config:** Env-based constants (`VITE_API_URL`, etc.)

### Error Handling
- All async route handlers wrapped in a `asyncHandler` utility
- Global Express error middleware catches all thrown errors
- Frontend: Axios interceptor handles 401 (redirect to login) globally

### Auth Flow
1. Client sends credentials → server validates → returns JWT
2. Client stores JWT in Zustand store (in-memory, not localStorage)
3. Axios instance has request interceptor: attaches `Authorization: Bearer <token>`
4. Axios instance has response interceptor: on 401, clears store + redirects

### Logging (Winston)
- All HTTP requests logged at `info` level
- All errors logged at `error` level with stack trace
- Log format: JSON in production, pretty-print in development
- Log levels: `error | warn | info | debug`

---

## 7. Coding Standards

### Naming
- Files: `camelCase.ts` for utils/hooks, `PascalCase.tsx` for components
- Variables/functions: `camelCase`
- Types/Interfaces: `PascalCase`, prefix interfaces with `I` is optional but be consistent
- DB columns: `snake_case`
- Constants: `SCREAMING_SNAKE_CASE`
- Routes/endpoints: `kebab-case`

### TypeScript
- `strict: true` in tsconfig
- No `any` — use `unknown` and narrow
- All function params and returns explicitly typed
- Zod schemas generate TypeScript types via `z.infer<>`

### Response Consistency
- ALWAYS use the envelope: `{ data: ... }` for success
- ALWAYS use `{ error: "CODE", message: "...", fields?: [...] }` for errors
- HTTP status codes MUST match SDS API contracts exactly

---

## 8. Quality Gates

```bash
# Must pass before every commit
npm run build      # 0 errors, 0 warnings
npm run lint       # 0 errors, 0 warnings
npm run test       # all tests green
npx commitlint --from HEAD~1
```

---

## 9. Environment Variables

```env
# Backend
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
LOG_LEVEL=debug

# Frontend (Vite)
VITE_API_URL=http://localhost:3001
```
