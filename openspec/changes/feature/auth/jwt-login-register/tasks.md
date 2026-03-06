# Tasks: feature/auth/jwt-login-register

**Source spec:** `openspec/changes/feature/auth/jwt-login-register/proposal.md`
**Source plan:** `openspec/changes/feature/auth/jwt-login-register/plan.md`
**Status:** Awaiting approval
**Generated:** 2026-03-06

---

## Phase 1: Foundation — DB + Types

- [ ] **1.1** Create `migrations/001_create_users.sql`
  - `CREATE TABLE IF NOT EXISTS users` matching SDS §4 schema exactly
  - Fields: `id` (UUID PK), `email` (VARCHAR 255 UNIQUE NOT NULL), `password` (VARCHAR 255 NOT NULL), `created_at`, `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

- [ ] **1.2** Add `UserRow` interface to `src/backend/types/index.ts`
  - Fields: `id`, `email`, `password`, `created_at: Date`, `updated_at: Date`
  - This is the raw DB row shape — `password` field stays internal to the repo/service layer

- [ ] **1.3** Add `AuthResult` interface to `src/backend/types/index.ts`
  - Shape: `{ token: string; user: { id: string; email: string } }`
  - Returned by `AuthService.register()` and `AuthService.login()`

**Checkpoint:** `npm run build` → 0 TypeScript errors

---

## Phase 2: Backend — Validate Middleware + Repository

- [ ] **2.1** Create `src/backend/middleware/validate.ts`
  - Generic factory: `validate(schema: AnyZodObject): RequestHandler`
  - Calls `schema.parse(req.body)` — throws `ZodError` on failure
  - `ZodError` is already caught by the global `errorHandler` → 422 response
  - No additional error handling needed here

- [ ] **2.2** Create `src/backend/repositories/AuthRepository.ts`
  - `findByEmail(email: string): Promise<UserRow | null>` — SELECT by email, return null if not found
  - `findById(id: string): Promise<UserRow | null>` — SELECT by id (used by `authenticate` middleware)
  - `create(email: string, passwordHash: string): Promise<UserRow>` — INSERT and return new row
  - Import `pool` from `src/backend/config/db.ts`
  - SQL only — zero business logic

- [ ] **2.3** Create `src/backend/repositories/AuthRepository.test.ts`
  - Test `findByEmail` returns `null` when user does not exist
  - Test `create` inserts a row and returns it with a generated UUID
  - Test `findByEmail` returns the row after `create`
  - Test `findById` returns the row by id
  - Mock `pool.query` using `vi.mock` — no real DB needed

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 3: Backend — Service + Authenticate Middleware

- [ ] **3.1** Create `src/backend/services/AuthService.ts`
  - `register(email, password): Promise<AuthResult>`
    - Call `repo.findByEmail(email)` → if found: `throw new AppError(409, ERROR_CODES.EMAIL_ALREADY_EXISTS, 'An account with this email already exists')`
    - `bcrypt.hash(password, 10)`
    - `repo.create(email, hash)`
    - `jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })`
    - Return `{ token, user: { id, email } }`
  - `login(email, password): Promise<AuthResult>`
    - Call `repo.findByEmail(email)` → if null: throw `AppError(401, INVALID_CREDENTIALS, 'Invalid email or password')`
    - `bcrypt.compare(password, user.password)` → if false: throw same `AppError(401, INVALID_CREDENTIALS, ...)`
    - Sign JWT and return `AuthResult`
    - **Both failure paths use identical error** — no user enumeration

- [ ] **3.2** Create `src/backend/services/AuthService.test.ts`
  - Test `register` throws 409 when email already exists
  - Test `register` hashes the password before storing (verify `bcrypt.compare` works)
  - Test `register` returns a token and user object on success
  - Test `login` throws 401 when email not found
  - Test `login` throws 401 when password is wrong (same error shape as above)
  - Test `login` returns a token and user object on success
  - Mock `AuthRepository`, `bcrypt`, `jsonwebtoken` using `vi.mock`

- [ ] **3.3** Create `src/backend/middleware/authenticate.ts`
  - Extract token from `Authorization: Bearer <token>` header
  - Call `jwt.verify(token, env.JWT_SECRET)` → typed as `{ sub: string; iat: number; exp: number }`
  - Call `AuthRepository.findById(payload.sub)` → if null: throw `AppError(401, UNAUTHORIZED, 'Unauthorized')`
  - Attach `req.user = { id: user.id, email: user.email }`
  - Any failure (missing header, bad token, expired, user not found) → `AppError(401, UNAUTHORIZED, 'Unauthorized')`
  - Wrap in `asyncHandler` so thrown errors reach `errorHandler`

- [ ] **3.4** Create `src/backend/middleware/authenticate.test.ts`
  - Test: missing Authorization header → 401 `UNAUTHORIZED`
  - Test: malformed token (not Bearer scheme) → 401 `UNAUTHORIZED`
  - Test: expired token → 401 `UNAUTHORIZED`
  - Test: valid token but user not in DB → 401 `UNAUTHORIZED`
  - Test: valid token + valid user → `req.user` populated with `{ id, email }` and `next()` called
  - Mock `jsonwebtoken`, `AuthRepository`

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 4: Backend — Controller + Routes

- [ ] **4.1** Create `src/backend/controllers/AuthController.ts`
  - `register(req: Request, res: Response): Promise<void>`
    - Destructure `{ email, password }` from `req.body` (body already validated by middleware)
    - Call `AuthService.register(email, password)`
    - `res.status(201).json({ data: result, message: 'Account created successfully' })`
  - `login(req: Request, res: Response): Promise<void>`
    - Destructure `{ email, password }` from `req.body`
    - Call `AuthService.login(email, password)`
    - `res.status(200).json({ data: result, message: 'Login successful' })`
  - Zero business logic — only req parsing + service call + res.json

- [ ] **4.2** Create `src/backend/routes/auth.ts`
  - Define `AuthSchema` with Zod: `email` (z.string().email()), `password` (z.string().min(8))
  - `POST /register` → `[validate(AuthSchema), asyncHandler(AuthController.register)]`
  - `POST /login` → `[validate(AuthSchema), asyncHandler(AuthController.login)]`

- [ ] **4.3** Modify `src/backend/routes/index.ts`
  - Import `authRouter` from `./auth`
  - Register: `router.use('/auth', authRouter)`
  - Uncomment the placeholder comments from the stub

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 5: Frontend — Store + API Wiring + Routing

- [ ] **5.1** Create `src/frontend/store/authStore.ts`
  - State: `token: string | null`, `user: User | null`
  - Computed getter: `isAuthenticated: boolean` — derived from `token !== null`
  - Actions:
    - `login(token: string, user: User): void` — sets token + user
    - `logout(): void` — clears token + user to null
    - `getToken(): string | null` — used by Axios interceptor outside React
  - Zustand `create()` — no `persist` middleware (in-memory only per spec)

- [ ] **5.2** Modify `src/frontend/utils/api.ts`
  - Replace `window.__authToken` hack in request interceptor with `useAuthStore.getState().getToken()`
  - Replace `window.location.href = '/login'` in 401 interceptor with:
    - `useAuthStore.getState().logout()` then `window.location.href = '/login'`
  - Import `useAuthStore` from `../store/authStore`

- [ ] **5.3** Create `src/frontend/components/ProtectedRoute.tsx`
  - Read `isAuthenticated` from `useAuthStore`
  - If `!isAuthenticated` → `<Navigate to="/login" replace />`
  - Else → `<Outlet />`

- [ ] **5.4** Modify `src/frontend/App.tsx`
  - Add public routes: `/login` → `<LoginPage />`, `/register` → `<RegisterPage />`
  - Wrap protected route `/todos` inside `<ProtectedRoute />`
  - Import `LoginPage`, `RegisterPage` (created in Phase 6)
  - Keep `<Navigate to="/todos" replace />` on `/`

**Checkpoint:** `npm run build && npm run lint`

---

## Phase 6: Frontend — Hook + Pages

- [ ] **6.1** Create `src/frontend/hooks/useAuth.ts`
  - Returns: `{ register, login, logout, isLoading, error }`
  - `register(email, password)`:
    - POST `/auth/register` via `api`
    - On success: `authStore.login(data.token, data.user)` → `navigate('/todos')`
    - On failure: extract `error.response.data.message` → set `error` state
  - `login(email, password)`:
    - POST `/auth/login` via `api`
    - On success: `authStore.login(data.token, data.user)` → `navigate('/todos')`
    - On failure: set `error` state with API message
  - `logout()`: `authStore.logout()` → `navigate('/login')`
  - `isLoading: boolean` tracks in-flight requests

- [ ] **6.2** Create `src/frontend/pages/LoginPage.tsx`
  - Form fields: `email`, `password`
  - Client-side: both fields required before submit
  - Call `useAuth().login(email, password)` on submit
  - Show `error` string from hook when present
  - Show loading spinner/disabled button while `isLoading`
  - Link to `/register` for new users

- [ ] **6.3** Create `src/frontend/pages/RegisterPage.tsx`
  - Form fields: `email`, `password`, `confirmPassword`
  - Client-side validation before API call:
    - All fields required
    - `password.length >= 8`
    - `confirmPassword === password` — show mismatch error, do NOT call API
  - Call `useAuth().register(email, password)` on submit (confirmPassword not sent to backend)
  - Show `error` string from hook when present
  - Show loading spinner/disabled button while `isLoading`
  - Link to `/login` for existing users

- [ ] **6.4** Write component tests
  - `src/frontend/pages/LoginPage.test.tsx`
    - Test: form renders email + password fields
    - Test: submit calls `useAuth` login action with correct args
    - Test: displays error message when hook returns an error
  - `src/frontend/pages/RegisterPage.test.tsx`
    - Test: confirm password mismatch shows error, does NOT call register
    - Test: password < 8 chars shows error, does NOT call register
    - Test: valid form calls `useAuth` register with email + password only

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 7: Archive + Verification

- [ ] **7.1** Verify all spec acceptance criteria are implemented and tested:
  - AC-01.1 — unique email + min 8 char password ✓ (AuthService + RegisterPage validation)
  - AC-01.2 — duplicate email → 409 `EMAIL_ALREADY_EXISTS` ✓ (AuthService + AuthService.test)
  - AC-01.3 — password stored as bcrypt hash ✓ (AuthService + test)
  - AC-01.4 — success returns JWT ✓ (AuthService + AuthController)
  - AC-01.5 — invalid email format → 422 `VALIDATION_ERROR` ✓ (validate middleware + Zod)
  - AC-02.1 — valid credentials return JWT ✓ (AuthService.login)
  - AC-02.2 — wrong password → 401 same as unknown email ✓ (AuthService — no enumeration)
  - AC-02.3 — token valid 24h ✓ (jwt.sign with JWT_EXPIRES_IN)
  - AC-02.4 — Bearer token on protected routes ✓ (authenticate middleware + Axios interceptor)
  - AC-03.1 — logout clears Zustand state ✓ (authStore.logout)
  - AC-03.2 — unauthenticated → redirect to /login ✓ (ProtectedRoute)

- [ ] **7.2** All quality gates green:
  - `npm run build` → 0 errors
  - `npm run lint` → 0 errors / 0 warnings
  - `npm run test` → all tests green

- [ ] **7.3** Run commitlint check:
  - `npx commitlint --from HEAD~1`

- [ ] **7.4** Archive this spec:
  - Move completed files to `openspec/archive/feature/auth/jwt-login-register/`
  - Or mark proposal.md status as `Implemented`

---

## Tasks Review Checklist

- [x] Every spec scenario has at least one TEST task (phases 2, 3, 4, 6)
- [x] Every phase ends with a build + lint + test checkpoint
- [x] Backend layers in correct order: types (1) → repo (2) → service (3) → controller (4) → route (4)
- [x] DB migration (1.1) before any service code (Phase 3)
- [x] Frontend layers in correct order: store (5) → hooks (6.1) → pages (6.2, 6.3) → tests (6.4)
