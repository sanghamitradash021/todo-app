# Spec: feature/auth/jwt-login-register

**Branch:** `feature/auth/jwt-login-register`
**Status:** Draft — awaiting dev sign-off
**Generated:** 2026-03-06

---

## 1. Business Intent

Implement user authentication — registration and login — using JWT tokens stored in-memory on the client. This forms the security boundary for all todo operations; every subsequent feature depends on this layer being correct.

**FRS coverage:**
- US-01: User Registration (AC-01.1 → AC-01.5)
- US-02: User Login (AC-02.1 → AC-02.4)
- US-03: User Logout (AC-03.1 → AC-03.2)

---

## 2. In-Scope

- `POST /api/auth/register` — create user, hash password, return JWT
- `POST /api/auth/login` — verify credentials, return JWT
- `authenticate` middleware — verify JWT on protected routes, attach `req.user`
- Zustand `authStore` — hold token + user in-memory, expose `login`, `logout` actions
- Axios interceptors — attach `Authorization: Bearer <token>` on requests; handle 401 → redirect
- Zod validation schemas for register + login request bodies
- Frontend: `LoginPage`, `RegisterPage` with client-side form validation (including confirm password)
- Frontend: redirect to `/todos` on success; redirect to `/login` on 401 or unauthenticated access
- Unit tests: `AuthService`, `AuthRepository`, `authenticate` middleware

---

## 3. Out-of-Scope

- No backend `/api/auth/logout` endpoint — logout is client-side only (clear Zustand store)
- No confirm_password field on the backend — validation is frontend-only
- No password complexity rules beyond minimum 8 characters
- No token blacklisting or refresh tokens
- No email verification
- No password reset flow
- No OAuth / social login
- No `localStorage` or `sessionStorage` for token persistence

---

## 4. Clarifications Applied (from Q&A)

| Question | Decision |
|----------|----------|
| Confirm password field | Frontend validation only; backend receives only `{ email, password }` |
| Backend logout endpoint | Not needed; logout clears Zustand store client-side |
| Password complexity | Min 8 chars only; no uppercase/number/special char rules |
| JWT payload | `{ sub: userId }` only — email is NOT encoded in the token |
| Message field | Included in all auth success responses (see §5) |

---

## 5. API Contract

> All shapes MUST match SDS §5 exactly. No deviations.

### `POST /api/auth/register`

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Validation (Zod):**
- `email`: valid email format (using `z.string().email()`)
- `password`: string, min 8 characters (`z.string().min(8)`)

**Success — 201 Created:**
```json
{
  "data": {
    "token": "<jwt>",
    "user": { "id": "<uuid>", "email": "<email>" }
  },
  "message": "Account created successfully"
}
```

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Email already registered | 409 | `{ "error": "EMAIL_ALREADY_EXISTS", "message": "An account with this email already exists" }` |
| Invalid email format | 422 | `{ "error": "VALIDATION_ERROR", "message": "Validation failed", "fields": ["email"] }` |
| Password too short | 422 | `{ "error": "VALIDATION_ERROR", "message": "Validation failed", "fields": ["password"] }` |
| Missing fields | 422 | `{ "error": "VALIDATION_ERROR", "message": "Validation failed", "fields": ["email" \| "password"] }` |

---

### `POST /api/auth/login`

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Validation (Zod):** Same schema as register.

**Success — 200 OK:**
```json
{
  "data": {
    "token": "<jwt>",
    "user": { "id": "<uuid>", "email": "<email>" }
  },
  "message": "Login successful"
}
```

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Unknown email OR wrong password | 401 | `{ "error": "INVALID_CREDENTIALS", "message": "Invalid email or password" }` |
| Missing fields | 422 | `{ "error": "VALIDATION_ERROR", "message": "Validation failed", "fields": ["email" \| "password"] }` |

> **Security:** unknown email and wrong password MUST return the same 401 response — no user enumeration.

---

### No backend logout endpoint

Logout is handled entirely on the frontend:
1. Call `authStore.logout()` → clears token + user from Zustand state
2. Navigate to `/login`

---

## 6. JWT Design

| Property | Value |
|----------|-------|
| Library | `jsonwebtoken@9` |
| Signing algorithm | `HS256` (default) |
| Payload | `{ sub: "<userId>" }` |
| Expiry | `24h` (from `JWT_EXPIRES_IN` env var) |
| Secret | `JWT_SECRET` env var (min 32 chars) |
| Transport | `Authorization: Bearer <token>` header |

The `authenticate` middleware will:
1. Extract the token from the `Authorization` header
2. Verify signature + expiry with `jwt.verify()`
3. Look up `req.user = { id: payload.sub, email }` — since only `sub` is in the token, a DB lookup is required to attach `email`
4. Call `next()` on success; return `401 { error: "UNAUTHORIZED" }` on failure

---

## 7. Database

No schema changes required. Uses existing `users` table from SDS §4:

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,   -- bcrypt hash
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**bcrypt:** salt rounds = `10` (standard default, not configurable for MVP).

---

## 8. Implementation Order

Per CLAUDE.md implementation order:

1. **Types** — `src/backend/types/index.ts` (already has `AuthenticatedUser`)
2. **Zod schemas** — `src/backend/middleware/validate.ts` + auth schemas
3. **Repository** — `src/backend/repositories/AuthRepository.ts`
   - `findByEmail(email): Promise<UserRow | null>`
   - `create(email, passwordHash): Promise<UserRow>`
4. **Service** — `src/backend/services/AuthService.ts`
   - `register(email, password): Promise<AuthResult>`
   - `login(email, password): Promise<AuthResult>`
5. **Middleware** — `src/backend/middleware/authenticate.ts`
6. **Controller** — `src/backend/controllers/AuthController.ts`
7. **Route** — `src/backend/routes/auth.ts` → register in `routes/index.ts`
8. **Frontend store** — `src/frontend/store/authStore.ts` (Zustand)
9. **Frontend utils** — wire `authStore` token into Axios interceptors in `utils/api.ts`
10. **Frontend pages** — `LoginPage.tsx`, `RegisterPage.tsx`
11. **Tests** — `AuthRepository.test.ts`, `AuthService.test.ts`, `authenticate.test.ts`

---

## 9. Acceptance Criteria

Mapped 1-to-1 from FRS:

### Registration (US-01)
- [ ] **AC-01.1** User can register with a unique email and password of at least 8 characters
- [ ] **AC-01.2** Registering with an already-registered email returns 409 `EMAIL_ALREADY_EXISTS`
- [ ] **AC-01.3** Password is stored as a bcrypt hash; plaintext never persisted or returned
- [ ] **AC-01.4** Successful registration returns a JWT access token in the response
- [ ] **AC-01.5** Invalid email format is rejected with 422 `VALIDATION_ERROR` and `fields: ["email"]`

### Login (US-02)
- [ ] **AC-02.1** Valid credentials return a JWT access token
- [ ] **AC-02.2** Wrong password returns 401 `INVALID_CREDENTIALS` (same response as unknown email — no enumeration)
- [ ] **AC-02.3** Returned token is valid for 24 hours
- [ ] **AC-02.4** Token must be sent as `Authorization: Bearer <token>` on all protected routes

### Logout (US-03)
- [ ] **AC-03.1** Calling `authStore.logout()` clears token and user from Zustand state
- [ ] **AC-03.2** After logout, navigating to any protected route redirects to `/login`

### Auth Middleware
- [ ] Missing or malformed token on protected route → 401 `UNAUTHORIZED`
- [ ] Expired token → 401 `UNAUTHORIZED`
- [ ] Valid token → `req.user` is populated with `{ id, email }`

### Frontend
- [ ] Confirm password mismatch shows a validation error before any API call is made
- [ ] Successful register/login redirects to `/todos`
- [ ] 401 response from any API call clears auth state and redirects to `/login`

---

## 10. Spec Review Checklist

- [x] Every FRS acceptance criterion has a matching spec scenario
- [x] Every error case from FRS has a scenario (409, 422, 401 for both endpoints)
- [x] API shapes match SDS §5 contracts exactly
- [x] No invented business rules not in FRS
- [x] Out-of-scope section exists and explicitly excludes logout endpoint, token blacklist, email verify
