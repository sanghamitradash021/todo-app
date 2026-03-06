# Technical Plan: feature/todos/crud-endpoints

**Source spec:** `openspec/changes/feature/todos/crud-endpoints/proposal.md`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-06

---

## 1. Codebase Audit — What Already Exists

| Existing file | What to reuse |
|---|---|
| `src/backend/types/index.ts` | `AuthenticatedUser` — already on `req.user`; **modify** to add todo types |
| `src/backend/config/constants.ts` | `ERROR_CODES.TODO_NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED` — already defined |
| `src/backend/config/db.ts` | `pool` — imported by repository |
| `src/backend/middleware/errorHandler.ts` | `AppError` — thrown by service for 404 |
| `src/backend/middleware/authenticate.ts` | Applied to every todo route, no changes |
| `src/backend/middleware/validate.ts` | **Modify** — add optional `target: 'body' \| 'query'` param for query-param validation on `GET /todos` |
| `src/backend/utils/asyncHandler.ts` | Wraps every async controller method |
| `src/backend/utils/logger.ts` | `logger.error()` as needed |
| `src/backend/routes/index.ts` | **Modify** — uncomment todos router stub |

---

## 2. Files to Create or Modify

### Create

```
migrations/002_create_todos.sql
src/backend/repositories/TodoRepository.ts
src/backend/services/TodoService.ts
src/backend/controllers/TodoController.ts
src/backend/routes/todos.ts
src/backend/tests/repositories/TodoRepository.test.ts
src/backend/tests/services/TodoService.test.ts
```

### Modify

```
src/backend/types/index.ts        ← add TodoRow, TodoResult, TodoFilters, CreateTodoData, UpdateTodoData
src/backend/middleware/validate.ts ← add optional target: 'body' | 'query' parameter
src/backend/routes/index.ts       ← register todosRouter under /todos
```

---

## 3. TypeScript Interfaces — Final Shapes

### Additions to `src/backend/types/index.ts`

```typescript
// Raw row from node-postgres — due_date comes back as Date | null from pg DATE column
export interface TodoRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: Date | null;       // pg DATE → JS Date; formatted in service
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;     // internal only — never sent to clients
}

// Client-facing shape (matches SDS Todo interface exactly)
// deleted_at excluded; due_date and timestamps formatted as strings
export interface TodoResult {
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

// Query-param filters for GET /api/todos
export interface TodoFilters {
  status?: 'pending' | 'completed' | 'all';
  priority?: 'low' | 'medium' | 'high';
}

// Validated POST body
export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

// Validated PATCH body — description and due_date nullable to allow clearing
export interface UpdateTodoData {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}
```

### `src/backend/middleware/validate.ts` — modified signature

```typescript
// target defaults to 'body'; pass 'query' for GET /todos filter validation
export function validate(
  schema: ZodTypeAny,
  target: 'body' | 'query' = 'body'
): RequestHandler
// Implementation: schema.parse(target === 'query' ? req.query : req.body)
```

Non-breaking — existing callers pass no second arg and get `'body'` behaviour unchanged.

---

## 4. Repository — `src/backend/repositories/TodoRepository.ts`

SQL only. No business logic. Returns `TodoRow` or `null`/`boolean`.

```typescript
findAllByUser(userId: string, filters: TodoFilters): Promise<TodoRow[]>
```
- Base: `WHERE user_id = $1 AND deleted_at IS NULL`
- If `filters.status` is `'pending'` or `'completed'`: append `AND status = $N`
- If `filters.priority` is set: append `AND priority = $N`
- Always append `ORDER BY created_at DESC`
- Dynamic parameterized query — build params array incrementally, no string interpolation

```typescript
findByIdAndUser(id: string, userId: string): Promise<TodoRow | null>
```
- `WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`
- Returns `null` if not found (service throws 404)

```typescript
create(userId: string, data: CreateTodoData): Promise<TodoRow>
```
- INSERT with `RETURNING *` — no mapping here, raw `TodoRow` returned

```typescript
update(id: string, userId: string, data: UpdateTodoData): Promise<TodoRow | null>
```
- Dynamic SET clause built from non-undefined keys of `data`
- Always appends `updated_at = NOW()`
- `WHERE id = $N AND user_id = $N AND deleted_at IS NULL`
- Returns `null` if 0 rows updated (service throws 404)

```typescript
toggleStatus(id: string, userId: string): Promise<TodoRow | null>
```
- Single query: `SET status = CASE WHEN status = 'pending' THEN 'completed' ELSE 'pending' END, updated_at = NOW()`
- `WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *`
- Returns `null` if 0 rows updated

```typescript
softDelete(id: string, userId: string): Promise<boolean>
```
- `UPDATE todos SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`
- Returns `true` if `rowCount > 0`, `false` otherwise

### Dynamic query building pattern

For `findAllByUser` and `update`, parameters are built like this (no string interpolation for values):

```typescript
const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
const params: unknown[] = [userId];
let idx = 2;

if (filters.status && filters.status !== 'all') {
  conditions.push(`status = $${idx++}`);
  params.push(filters.status);
}
// ... etc.
const sql = `SELECT * FROM todos WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
```

---

## 5. Service — `src/backend/services/TodoService.ts`

Business logic only. Calls repository. Formats dates. Throws `AppError` on failures.

### Private helper: `formatTodo(row: TodoRow): TodoResult`

```typescript
function formatTodo(row: TodoRow): TodoResult {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    // deleted_at intentionally excluded
  };
}
```

### Service methods

```typescript
listTodos(userId, filters): Promise<TodoResult[]>
  // repo.findAllByUser(userId, filters) → rows.map(formatTodo)

getTodo(userId, id): Promise<TodoResult>
  // repo.findByIdAndUser(id, userId) → null → throw AppError(404, TODO_NOT_FOUND)
  // → formatTodo(row)

createTodo(userId, data): Promise<TodoResult>
  // repo.create(userId, data) — priority defaults to 'medium' via SQL DEFAULT
  // → formatTodo(row)

updateTodo(userId, id, data): Promise<TodoResult>
  // repo.update(id, userId, data) → null → throw AppError(404, TODO_NOT_FOUND)
  // → formatTodo(row)

toggleTodo(userId, id): Promise<TodoResult>
  // repo.toggleStatus(id, userId) → null → throw AppError(404, TODO_NOT_FOUND)
  // → formatTodo(row)

deleteTodo(userId, id): Promise<void>
  // repo.softDelete(id, userId) → false → throw AppError(404, TODO_NOT_FOUND)
```

---

## 6. Controller — `src/backend/controllers/TodoController.ts`

req parsing + service call + res.json only. Zero logic.

```typescript
list(req, res)    → filters from req.query → TodoService.listTodos → 200 { data: [...] }
getOne(req, res)  → id from req.params    → TodoService.getTodo   → 200 { data: todo }
create(req, res)  → body as CreateTodoData → TodoService.createTodo → 201 { data: todo }
update(req, res)  → id + body             → TodoService.updateTodo → 200 { data: todo }
toggle(req, res)  → id from req.params    → TodoService.toggleTodo → 200 { data: todo }
remove(req, res)  → id from req.params    → TodoService.deleteTodo → 204 (no body)
```

`req.user!.id` is safe to assert after `authenticate` middleware.

---

## 7. Routes — `src/backend/routes/todos.ts`

### Zod schemas (inline in routes file)

```typescript
const ListSchema = z.object({
  status: z.enum(['pending', 'completed', 'all']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const CreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);
```

### Route registrations

```
GET    /                → [authenticate, validate(ListSchema, 'query'), asyncHandler(list)]
POST   /                → [authenticate, validate(CreateSchema),        asyncHandler(create)]
GET    /:id             → [authenticate,                                asyncHandler(getOne)]
PATCH  /:id/toggle      → [authenticate,                                asyncHandler(toggle)]
PATCH  /:id             → [authenticate, validate(UpdateSchema),        asyncHandler(update)]
DELETE /:id             → [authenticate,                                asyncHandler(remove)]
```

> **Route ordering:** `/:id/toggle` MUST be registered before `/:id` to avoid Express matching `/toggle` as the `:id` param.

---

## 8. Architecture Decisions

| Decision | Rationale |
|---|---|
| Extend `validate.ts` with `target` param | One generic middleware handles both body and query validation. Non-breaking — existing callers unaffected. Simpler than a separate `validateQuery` function. |
| Dynamic SQL in repository (not ORM) | Matches SDS tech stack (raw `pg`). Parameterized queries prevent injection. Dynamic `WHERE` / `SET` built with index counter, never string interpolation. |
| `formatTodo` helper in service layer | Keeps all pg → API type transformation in one place. Repository returns raw `TodoRow` (with `Date` objects); service converts to `TodoResult` (with strings). |
| `priority` default handled by DB | `DEFAULT 'medium'` in schema means repository `INSERT` doesn't need to provide priority if absent. Avoids duplicating defaults in multiple places. |
| Toggle via single SQL CASE expression | Atomic — no read-then-write race condition. One round trip instead of two. |
| `PATCH /:id/toggle` before `PATCH /:id` in router | Express matches routes in registration order. Without this, `toggle` would be caught as `id = "toggle"` on the generic `PATCH /:id` route. |
| `softDelete` returns `boolean` | Repository layer stays pure (SQL only). Service interprets `false` as "not found or wrong owner" and throws `AppError(404)`. |

---

## 9. DB Migration

**File:** `migrations/002_create_todos.sql`

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

Run against DB before starting the server. Idempotent — safe to re-run.

---

## 10. Phased Implementation with Checkpoints

### Phase 1 — DB + Types + Validate middleware

1. Create `migrations/002_create_todos.sql`
2. Add `TodoRow`, `TodoResult`, `TodoFilters`, `CreateTodoData`, `UpdateTodoData` to `src/backend/types/index.ts`
3. Modify `src/backend/middleware/validate.ts` — add `target` parameter

**Checkpoint:** `npm run build` → 0 errors

### Phase 2 — Repository + Tests

4. Create `src/backend/repositories/TodoRepository.ts`
5. Create `src/backend/tests/repositories/TodoRepository.test.ts`

**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 3 — Service + Tests

6. Create `src/backend/services/TodoService.ts`
7. Create `src/backend/tests/services/TodoService.test.ts`

**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 4 — Controller + Routes (Backend complete)

8. Create `src/backend/controllers/TodoController.ts`
9. Create `src/backend/routes/todos.ts`
10. Modify `src/backend/routes/index.ts` — register todos router

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## 11. Plan Review Checklist

- [x] File paths follow `src/backend/` structure from AGENTS.md
- [x] API shapes match SDS §5 contracts exactly (`TodoResult` matches SDS `Todo` interface)
- [x] DB schema matches SDS §4 exactly (columns, types, constraints, indexes)
- [x] No duplication — reuses `AppError`, `asyncHandler`, `authenticate`, `validate`, `ERROR_CODES`, `pool`
- [x] DB migration (Phase 1) before repository code (Phase 2)
- [x] Backend layers respected: route → controller → service → repository → pool
- [x] `PATCH /:id/toggle` registered before `PATCH /:id` to prevent param collision
