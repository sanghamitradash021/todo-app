# Technical Plan: feature/auth/jwt-login-register

**Source spec:** `openspec/changes/feature/auth/jwt-login-register/proposal.md`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-06

---

## 1. Codebase Audit — What Already Exists

The scaffolding phase produced several files that this feature can reuse directly. **Do not recreate these.**

| Existing file | What to reuse |
|---|---|
| `src/backend/types/index.ts` | `AuthenticatedUser` interface → shape of `req.user` |
| `src/backend/config/constants.ts` | `ERROR_CODES.EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `JWT_EXPIRES_IN` |
| `src/backend/config/env.ts` | `env.JWT_SECRET`, `env.JWT_EXPIRES_IN` |
| `src/backend/config/db.ts` | `pool` — imported directly by repository |
| `src/backend/middleware/errorHandler.ts` | `AppError` class — thrown by service layer |
| `src/backend/utils/asyncHandler.ts` | Wrap every async controller handler |
| `src/backend/utils/logger.ts` | `logger.error()` in middleware and service |
| `src/frontend/types/index.ts` | `User`, `ApiSuccess<T>`, `ApiError` — frontend response shapes |
| `src/frontend/utils/api.ts` | Axios instance — interceptors **need wiring** to authStore (stubbed) |

---

## 2. Files to Create or Modify

### Backend — create

```
src/backend/middleware/validate.ts          ← generic Zod middleware factory
src/backend/repositories/AuthRepository.ts ← SQL: findByEmail, findById, create
src/backend/services/AuthService.ts        ← business logic: register, login
src/backend/middleware/authenticate.ts     ← JWT verify → attach req.user
src/backend/controllers/AuthController.ts  ← req/res wiring, calls AuthService
src/backend/routes/auth.ts                 ← Express router /auth/register, /auth/login
```

### Backend — modify

```
src/backend/types/index.ts        ← add UserRow, AuthResult interfaces
src/backend/routes/index.ts       ← register authRouter under /auth
```

### Database

```
migrations/001_create_users.sql   ← CREATE TABLE users (idempotent with IF NOT EXISTS)
```

### Frontend — create

```
src/frontend/store/authStore.ts        ← Zustand: token, user, login(), logout()
src/frontend/hooks/useAuth.ts          ← API calls → store → redirect
src/frontend/components/ProtectedRoute.tsx ← redirect to /login if unauthenticated
src/frontend/pages/LoginPage.tsx       ← login form
src/frontend/pages/RegisterPage.tsx    ← register form + confirm password
```

### Frontend — modify

```
src/frontend/utils/api.ts   ← wire authStore.getToken() into request interceptor
src/frontend/App.tsx        ← add /login, /register, /todos routes with ProtectedRoute
```

### Tests — create

```
src/backend/repositories/AuthRepository.test.ts
src/backend/services/AuthService.test.ts
src/backend/middleware/authenticate.test.ts
```

---

## 3. TypeScript Interfaces — Final Shapes

### Backend additions to `src/backend/types/index.ts`

```typescript
// Raw DB row returned by node-postgres
export interface UserRow {
  id: string;
  email: string;
  password: string;         // bcrypt hash — never leave the service layer
  created_at: Date;
  updated_at: Date;
}

// Shape returned by AuthService.register() and AuthService.login()
export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
```

> `AuthenticatedUser` already in `src/backend/types/index.ts` — no change needed.

### `src/backend/middleware/validate.ts`

```typescript
import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Factory: validate(schema) returns Express middleware
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Throws ZodError on failure → caught by errorHandler → 422
    schema.parse(req.body);
    next();
  };
}
```

### `src/backend/repositories/AuthRepository.ts`

```typescript
// Zod schemas for request bodies (inlined in the route, not here)
// Repository: ONLY SQL. No business logic. Returns UserRow or null.

findByEmail(email: string): Promise<UserRow | null>
findById(id: string):       Promise<UserRow | null>
create(email: string, passwordHash: string): Promise<UserRow>
```

### `src/backend/services/AuthService.ts`

```typescript
// ALL business logic. Never touches req/res. Throws AppError on failures.

register(email: string, password: string): Promise<AuthResult>
  // 1. findByEmail → if found, throw AppError(409, EMAIL_ALREADY_EXISTS)
  // 2. bcrypt.hash(password, 10)
  // 3. repo.create(email, hash)
  // 4. jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  // 5. return { token, user: { id, email } }

login(email: string, password: string): Promise<AuthResult>
  // 1. findByEmail → if not found, throw AppError(401, INVALID_CREDENTIALS)
  // 2. bcrypt.compare(password, user.password) → if false, same AppError
  // 3. jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  // 4. return { token, user: { id, email } }
```

> **Security note:** both "user not found" and "wrong password" paths throw the identical `AppError(401, INVALID_CREDENTIALS, 'Invalid email or password')` — no branch leaks identity.

### `src/backend/middleware/authenticate.ts`

```typescript
// JWT shape after verify
interface JwtPayload {
  sub: string;   // userId
  iat: number;
  exp: number;
}

// Flow:
// 1. Extract token from Authorization header (Bearer scheme)
// 2. jwt.verify(token, JWT_SECRET) → JwtPayload
// 3. repo.findById(payload.sub) → attach req.user = { id, email }
// 4. next() — or throw AppError(401, UNAUTHORIZED) at any failure point
```

### Auth Zod schemas (inline in `src/backend/routes/auth.ts`)

```typescript
const AuthSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});
type AuthBody = z.infer<typeof AuthSchema>;
```

### `src/backend/controllers/AuthController.ts`

```typescript
// Controller: ONLY req parsing + service call + res.json(). Zero logic.

register(req, res): Promise<void>
  // 1. Destructure req.body as AuthBody (type-safe after validate middleware)
  // 2. const result = await AuthService.register(email, password)
  // 3. res.status(201).json({ data: result, message: 'Account created successfully' })

login(req, res): Promise<void>
  // 1. Destructure req.body as AuthBody
  // 2. const result = await AuthService.login(email, password)
  // 3. res.status(200).json({ data: result, message: 'Login successful' })
```

### `src/backend/routes/auth.ts`

```typescript
POST /api/auth/register → [validate(AuthSchema), asyncHandler(AuthController.register)]
POST /api/auth/login    → [validate(AuthSchema), asyncHandler(AuthController.login)]
```

### Frontend — `src/frontend/store/authStore.ts`

```typescript
interface AuthState {
  token: string | null;
  user: User | null;        // User from src/frontend/types/index.ts
  isAuthenticated: boolean; // derived: token !== null
}

interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  getToken: () => string | null;  // called by Axios interceptor
}

// Zustand store — in-memory only, no persist middleware
// login() sets token + user
// logout() clears token + user
// getToken() used by Axios request interceptor without a hook
```

### Frontend — `src/frontend/hooks/useAuth.ts`

```typescript
// Encapsulates async auth logic + loading/error state
// Calls api.post('/auth/register' | '/auth/login')
// On success: authStore.login(token, user) → navigate('/todos')
// On failure: extracts error message for display

interface UseAuthReturn {
  register: (email: string, password: string) => Promise<void>;
  login:    (email: string, password: string) => Promise<void>;
  logout:   () => void;
  isLoading: boolean;
  error: string | null;
}
```

### Frontend — `src/frontend/utils/api.ts` modification

Replace the `__authToken` window hack with a proper Zustand store reference:

```typescript
// Request interceptor — replace window.__authToken with:
import { useAuthStore } from '../store/authStore';

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Response interceptor — replace window.location.href with:
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';   // outside React tree, direct nav is acceptable
    }
    return Promise.reject(error);
  }
);
```

### Frontend — `src/frontend/components/ProtectedRoute.tsx`

```typescript
// If !isAuthenticated → <Navigate to="/login" replace />
// Else → <Outlet />
// Used as a wrapper route in App.tsx
```

---

## 4. DB Migration

**File:** `migrations/001_create_users.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> Uses `IF NOT EXISTS` — safe to re-run. Run this manually against the DB before starting the server. No ORM migration runner is in the stack for MVP.

---

## 5. Architecture Decisions

| Decision | Rationale |
|---|---|
| `authenticate` middleware does a DB lookup | JWT only encodes `{ sub: userId }` per spec decision. Middleware needs `email` for `req.user`. Adds one query per protected request — acceptable for MVP. |
| Auth Zod schemas in route file | Single use; no reason to create a separate file yet. Keeps related code co-located. |
| `validate(schema)` middleware uses `schema.parse()` not `safeParse()` | Throws `ZodError` which the existing global `errorHandler` already catches and maps to 422. No duplication needed. |
| `useAuthStore.getState()` in Axios interceptor | Zustand stores expose `getState()` for access outside React components. Avoids the `window.__authToken` hack left in the stub. |
| `window.location.href = '/login'` in 401 interceptor | The interceptor runs outside the React tree (no router context). Direct navigation is the only option here without a custom event bus. Acceptable for MVP. |
| bcrypt salt rounds = 10 | Industry standard for MVP. Not over-engineered. |
| `ProtectedRoute` as a layout route using `<Outlet />` | React Router 6 best practice. Wraps all protected routes cleanly without prop drilling. |

---

## 6. Phased Implementation with Checkpoints

### Phase 1 — DB + Types
1. Create `migrations/001_create_users.sql`
2. Add `UserRow`, `AuthResult` to `src/backend/types/index.ts`
3. **Checkpoint:** `npm run build` → 0 errors

### Phase 2 — Validate Middleware + Repository
4. Create `src/backend/middleware/validate.ts`
5. Create `src/backend/repositories/AuthRepository.ts`
6. Create `src/backend/repositories/AuthRepository.test.ts`
7. **Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 3 — Service + Authenticate Middleware
8. Create `src/backend/services/AuthService.ts`
9. Create `src/backend/services/AuthService.test.ts`
10. Create `src/backend/middleware/authenticate.ts`
11. Create `src/backend/middleware/authenticate.test.ts`
12. **Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 4 — Controller + Route (Backend complete)
13. Create `src/backend/controllers/AuthController.ts`
14. Create `src/backend/routes/auth.ts`
15. Modify `src/backend/routes/index.ts` — register auth router
16. **Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 5 — Frontend Store + Wiring
17. Create `src/frontend/store/authStore.ts`
18. Modify `src/frontend/utils/api.ts` — wire authStore into interceptors
19. Create `src/frontend/components/ProtectedRoute.tsx`
20. Modify `src/frontend/App.tsx` — add /login, /register, protected /todos routes
21. **Checkpoint:** `npm run build && npm run lint`

### Phase 6 — Frontend Pages (Frontend complete)
22. Create `src/frontend/hooks/useAuth.ts`
23. Create `src/frontend/pages/LoginPage.tsx`
24. Create `src/frontend/pages/RegisterPage.tsx`
25. **Final checkpoint:** `npm run build && npm run lint && npm run test`

---

## 7. Plan Review Checklist

- [x] File paths follow `src/backend/` and `src/frontend/` structure from AGENTS.md
- [x] API shapes match SDS §5 contracts exactly (register: 201, login: 200, envelope with message)
- [x] DB schema matches SDS §4 exactly (`users` table, `IF NOT EXISTS` for safety)
- [x] No duplication — reuses `AppError`, `asyncHandler`, `ERROR_CODES`, `AuthenticatedUser`, `User`, `ApiSuccess<T>`
- [x] DB migration planned as Phase 1 before any service code
- [x] Backend layers respected: `route → controller → service → repository → pool`
- [x] Every phase ends with a build + lint + test checkpoint
