# Spec: feature/todos/crud-endpoints

**Branch:** `feature/todos/crud-endpoints`
**Status:** Draft — awaiting dev sign-off
**Generated:** 2026-03-06

---

## 1. Business Intent

Implement the full Todo CRUD API. Authenticated users can create, read, update, toggle, and soft-delete their own todos. Todos are user-scoped — no user can read or mutate another user's todos. This is the core data layer of the application; the frontend dashboard depends entirely on this feature.

**FRS coverage:**
- US-04: Create Todo (AC-04.1 → AC-04.7)
- US-05: List Todos (AC-05.1 → AC-05.5)
- US-06: Get Single Todo (AC-06.1 → AC-06.2)
- US-07: Update Todo (AC-07.1 → AC-07.4)
- US-08: Toggle Todo Status (AC-08.1 → AC-08.3)
- US-09: Delete Todo (AC-09.1 → AC-09.4)

---

## 2. In-Scope

- `POST /api/todos` — create a new todo
- `GET /api/todos` — list all non-deleted todos for authenticated user, with optional filters
- `GET /api/todos/:id` — get a single todo by id (must belong to authenticated user)
- `PATCH /api/todos/:id` — partial update of title, description, priority, due_date
- `PATCH /api/todos/:id/toggle` — toggle status between `pending` ↔ `completed`
- `DELETE /api/todos/:id` — soft delete (sets `deleted_at`, does not hard-delete)
- All endpoints protected by existing `authenticate` middleware
- Zod validation on request body (POST, PATCH) and query params (GET /todos)
- DB migration: `migrations/002_create_todos.sql`
- Unit tests: `TodoRepository`, `TodoService`

---

## 3. Out-of-Scope

- Frontend UI — covered in `feature/frontend/todo-dashboard`
- Pagination — FRS explicitly defers this (MVP returns full array)
- Hard deletes — only soft delete via `deleted_at`
- Sorting options beyond the default (`created_at DESC`)
- Bulk operations (bulk delete, bulk status update)
- Todo categories, tags, attachments, or reminders

---

## 4. Clarifications Applied (from Q&A)

| Question | Decision |
|----------|----------|
| `updated_at` on toggle | Yes — refreshed on every mutation including toggle |
| PATCH with empty body `{}` | 422 — at least one updatable field must be provided |
| `due_date` formatting | Service layer maps PostgreSQL `DATE` → `YYYY-MM-DD` string |
| Filter validation | Zod applied to `req.query` via `validate` middleware |
| `"description": null` | Allowed — explicitly clears the field to null |

---

## 5. API Contract

> All shapes MUST match SDS §5 exactly. No deviations.

All endpoints require `Authorization: Bearer <token>`.

---

### `POST /api/todos`

**Request body:**
```json
{
  "title": "string",
  "description": "string (optional)",
  "priority": "low | medium | high (optional, default: medium)",
  "due_date": "YYYY-MM-DD (optional)"
}
```

**Validation (Zod — req.body):**
- `title`: `z.string().min(1).max(255)`
- `description`: `z.string().max(1000).optional()`
- `priority`: `z.enum(['low', 'medium', 'high']).optional()` (default applied in service)
- `due_date`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()` (YYYY-MM-DD format)

**Success — 201 Created:**
```json
{ "data": Todo }
```

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Missing title | 422 | `{ "error": "VALIDATION_ERROR", "message": "Validation failed", "fields": ["title"] }` |
| Title too long (>255) | 422 | `{ "error": "VALIDATION_ERROR", "fields": ["title"] }` |
| Invalid priority value | 422 | `{ "error": "VALIDATION_ERROR", "fields": ["priority"] }` |
| Invalid due_date format | 422 | `{ "error": "VALIDATION_ERROR", "fields": ["due_date"] }` |
| Unauthenticated | 401 | `{ "error": "UNAUTHORIZED" }` |

---

### `GET /api/todos`

**Query params:**
- `status`: `pending | completed | all` (optional, default: `all`)
- `priority`: `low | medium | high` (optional, no default — omit to return all priorities)

**Validation (Zod — req.query):**
- `status`: `z.enum(['pending', 'completed', 'all']).optional()`
- `priority`: `z.enum(['low', 'medium', 'high']).optional()`

**Success — 200 OK:**
```json
{ "data": [ Todo ] }
```

**Behavior:**
- Only returns todos where `deleted_at IS NULL`
- Only returns todos where `user_id = req.user.id`
- `status=all` and omitting `status` are identical — no filter applied
- `priority` omitted — no filter applied, all priorities returned
- Sorted by `created_at DESC`

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Invalid `status` value | 422 | `{ "error": "VALIDATION_ERROR", "fields": ["status"] }` |
| Invalid `priority` value | 422 | `{ "error": "VALIDATION_ERROR", "fields": ["priority"] }` |
| Unauthenticated | 401 | `{ "error": "UNAUTHORIZED" }` |

---

### `GET /api/todos/:id`

**Success — 200 OK:**
```json
{ "data": Todo }
```

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Todo not found OR belongs to another user | 404 | `{ "error": "TODO_NOT_FOUND", "message": "Todo not found" }` |
| Unauthenticated | 401 | `{ "error": "UNAUTHORIZED" }` |

> **Security:** "not found" and "wrong owner" return the same 404 — no ownership leakage.

---

### `PATCH /api/todos/:id`

**Request body (all fields optional, but at least one required):**
```json
{
  "title": "string (optional)",
  "description": "string | null (optional)",
  "priority": "low | medium | high (optional)",
  "due_date": "YYYY-MM-DD | null (optional)"
}
```

**Validation (Zod — req.body):**
- `title`: `z.string().min(1).max(255).optional()`
- `description`: `z.string().max(1000).nullable().optional()`
- `priority`: `z.enum(['low', 'medium', 'high']).optional()`
- `due_date`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()`
- Schema-level refinement: `.refine()` that the object has at least one key → 422 if `{}`

**Success — 200 OK:**
```json
{ "data": Todo }
```

`updated_at` is refreshed on every successful update.

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Empty body `{}` | 422 | `{ "error": "VALIDATION_ERROR", "message": "At least one field must be provided", "fields": [] }` |
| Validation failure on any field | 422 | `{ "error": "VALIDATION_ERROR", "fields": ["<field>"] }` |
| Todo not found or wrong owner | 404 | `{ "error": "TODO_NOT_FOUND" }` |
| Unauthenticated | 401 | `{ "error": "UNAUTHORIZED" }` |

---

### `PATCH /api/todos/:id/toggle`

No request body.

**Success — 200 OK:**
```json
{ "data": Todo }
```

Toggle logic: `pending` → `completed`, `completed` → `pending`. `updated_at` refreshed.

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Todo not found or wrong owner | 404 | `{ "error": "TODO_NOT_FOUND" }` |
| Unauthenticated | 401 | `{ "error": "UNAUTHORIZED" }` |

---

### `DELETE /api/todos/:id`

**Success — 204 No Content** (no response body)

**Errors:**
| Scenario | Status | Response |
|----------|--------|----------|
| Todo not found or wrong owner | 404 | `{ "error": "TODO_NOT_FOUND" }` |
| Unauthenticated | 401 | `{ "error": "UNAUTHORIZED" }` |

---

## 6. Todo Object Shape

Matches SDS §5 exactly:

```typescript
interface Todo {
  id: string;           // UUID
  user_id: string;      // UUID
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;   // YYYY-MM-DD — formatted in service layer from pg DATE
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
}
```

> `deleted_at` is **never** returned in any API response.

---

## 7. Database

### New migration: `migrations/002_create_todos.sql`

```sql
CREATE TABLE IF NOT EXISTS todos (
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
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status  ON todos(status);
```

### `due_date` handling

- Stored as `DATE` in PostgreSQL
- `node-postgres` returns `DATE` as a JS `Date` object
- **Service layer** calls `.toISOString().split('T')[0]` to format as `YYYY-MM-DD`
- `null` stored and returned as `null`

---

## 8. Implementation Order

Per CLAUDE.md:

1. **Types** — add `TodoRow`, `TodoResult`, filter param types to `src/backend/types/index.ts`
2. **DB migration** — `migrations/002_create_todos.sql`
3. **Repository** — `src/backend/repositories/TodoRepository.ts`
   - `findAllByUser(userId, filters): Promise<TodoRow[]>`
   - `findByIdAndUser(id, userId): Promise<TodoRow | null>`
   - `create(userId, data): Promise<TodoRow>`
   - `update(id, userId, data): Promise<TodoRow | null>`
   - `softDelete(id, userId): Promise<boolean>`
4. **Service** — `src/backend/services/TodoService.ts`
   - `listTodos(userId, filters): Promise<TodoResult[]>`
   - `getTodo(userId, id): Promise<TodoResult>`
   - `createTodo(userId, data): Promise<TodoResult>`
   - `updateTodo(userId, id, data): Promise<TodoResult>`
   - `toggleTodo(userId, id): Promise<TodoResult>`
   - `deleteTodo(userId, id): Promise<void>`
5. **Controller** — `src/backend/controllers/TodoController.ts`
6. **Routes** — `src/backend/routes/todos.ts` → register in `routes/index.ts`
7. **Tests** — `src/backend/tests/repositories/TodoRepository.test.ts`, `src/backend/tests/services/TodoService.test.ts`

---

## 9. Acceptance Criteria

Mapped 1-to-1 from FRS:

### Create (US-04)
- [ ] **AC-04.1** Todo requires a `title` (1–255 chars)
- [ ] **AC-04.2** `description` is optional, max 1000 chars
- [ ] **AC-04.3** `priority` is optional, one of `low|medium|high`, defaults to `medium`
- [ ] **AC-04.4** `due_date` is optional, ISO 8601 date string (YYYY-MM-DD)
- [ ] **AC-04.5** New todo defaults to `status: pending`
- [ ] **AC-04.6** Todo is owned by the authenticated user (`user_id = req.user.id`)
- [ ] **AC-04.7** Returns created todo with generated `id` and `created_at`

### List (US-05)
- [ ] **AC-05.1** Returns only todos belonging to the authenticated user
- [ ] **AC-05.2** Supports `status` filter (`pending | completed | all`, default: all)
- [ ] **AC-05.3** Supports `priority` filter (`low | medium | high`, optional)
- [ ] **AC-05.4** Sorted by `created_at` DESC
- [ ] **AC-05.5** Returns array (no pagination)

### Get Single (US-06)
- [ ] **AC-06.1** Returns the todo if `user_id` matches authenticated user
- [ ] **AC-06.2** Returns 404 if todo does not exist or belongs to another user

### Update (US-07)
- [ ] **AC-07.1** Can update `title`, `description`, `priority`, `due_date`
- [ ] **AC-07.2** Partial updates allowed; empty body `{}` returns 422
- [ ] **AC-07.3** `updated_at` refreshed on every successful update
- [ ] **AC-07.4** Cannot update another user's todo (404)

### Toggle (US-08)
- [ ] **AC-08.1** `PATCH /todos/:id/toggle` toggles `status` between `pending` ↔ `completed`
- [ ] **AC-08.2** Returns updated todo
- [ ] **AC-08.3** Cannot toggle another user's todo (404)
- [ ] **Clarification** `updated_at` is also refreshed on toggle

### Delete (US-09)
- [ ] **AC-09.1** Soft delete — sets `deleted_at`, does not hard-delete
- [ ] **AC-09.2** Deleted todos do not appear in list or get results
- [ ] **AC-09.3** Returns 204 No Content on success
- [ ] **AC-09.4** Cannot delete another user's todo (404)

### Security
- [ ] All 6 endpoints return 401 `UNAUTHORIZED` without a valid JWT
- [ ] No response ever includes `deleted_at` or `password` fields

---

## 10. Spec Review Checklist

- [x] Every FRS acceptance criterion has a matching spec scenario
- [x] Every error case from FRS has a scenario (404 ownership-safe, 422 validation, 401 auth)
- [x] API shapes match SDS §5 contracts exactly
- [x] No invented business rules not in FRS
- [x] Out-of-scope section exists (pagination, hard delete, bulk ops, frontend)
