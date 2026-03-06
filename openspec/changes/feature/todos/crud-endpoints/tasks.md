# Tasks: feature/todos/crud-endpoints

**Source spec:** `openspec/changes/feature/todos/crud-endpoints/proposal.md`
**Source plan:** `openspec/changes/feature/todos/crud-endpoints/plan.md`
**Status:** Approved
**Generated:** 2026-03-06

---

## Phase 1: Foundation — DB + Types + Validate Middleware

- [ ] **1.1** Create `migrations/002_create_todos.sql`
  - `CREATE TABLE IF NOT EXISTS todos` matching SDS §4 schema exactly
  - Columns: `id` (UUID PK), `user_id` (FK → users ON DELETE CASCADE), `title` (VARCHAR 255 NOT NULL), `description` (TEXT), `status` (VARCHAR 20, DEFAULT 'pending', CHECK), `priority` (VARCHAR 10, DEFAULT 'medium', CHECK), `due_date` (DATE), `created_at`, `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()), `deleted_at` (TIMESTAMPTZ)
  - Indexes: `idx_todos_user_id`, `idx_todos_status` (both `IF NOT EXISTS`)

- [ ] **1.2** Add `TodoRow` to `src/backend/types/index.ts`
  - `due_date: Date | null` — pg `DATE` comes back as a JS `Date` object
  - `deleted_at: Date | null` — internal only, never sent to clients

- [ ] **1.3** Add `TodoResult` to `src/backend/types/index.ts`
  - Matches SDS `Todo` interface exactly
  - `due_date: string | null` (YYYY-MM-DD), `created_at: string`, `updated_at: string` (ISO 8601)
  - No `deleted_at` field

- [ ] **1.4** Add `TodoFilters`, `CreateTodoData`, `UpdateTodoData` to `src/backend/types/index.ts`
  - `TodoFilters`: `status?: 'pending' | 'completed' | 'all'`, `priority?: 'low' | 'medium' | 'high'`
  - `CreateTodoData`: `title: string`, `description?`, `priority?`, `due_date?`
  - `UpdateTodoData`: `title?`, `description?: string | null`, `priority?`, `due_date?: string | null`

- [ ] **1.5** Modify `src/backend/middleware/validate.ts`
  - Add `target: 'body' | 'query' = 'body'` as second parameter
  - Parse `req.query` when `target === 'query'`, `req.body` otherwise
  - Non-breaking — all existing callers pass no second arg and default to `'body'`

**Checkpoint:** `npm run build` → 0 TypeScript errors

---

## Phase 2: Backend — Repository + Tests

- [ ] **2.1** Create `src/backend/repositories/TodoRepository.ts`
  - `findAllByUser(userId, filters)` — dynamic parameterized WHERE clauses; skip status filter when `status === 'all'` or undefined; always `deleted_at IS NULL`; always `ORDER BY created_at DESC`
  - `findByIdAndUser(id, userId)` — `WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`; returns `null` if not found
  - `create(userId, data)` — INSERT with `RETURNING *`; `priority` and `status` defaults come from DB schema
  - `update(id, userId, data)` — dynamic SET clause from `data` keys; always appends `updated_at = NOW()`; `WHERE id AND user_id AND deleted_at IS NULL RETURNING *`; returns `null` if 0 rows updated
  - `toggleStatus(id, userId)` — single SQL `CASE WHEN status = 'pending' THEN 'completed' ELSE 'pending' END, updated_at = NOW()`; `WHERE id AND user_id AND deleted_at IS NULL RETURNING *`; returns `null` if 0 rows
  - `softDelete(id, userId)` — `SET deleted_at = NOW() WHERE id AND user_id AND deleted_at IS NULL`; returns `true` if `rowCount > 0`, `false` otherwise

- [ ] **2.2** Create `src/backend/tests/repositories/TodoRepository.test.ts`
  - Mock `pool.query` via `vi.mock('../../config/db', ...)`
  - Test `findAllByUser` — no filters returns all user's todos
  - Test `findAllByUser` — status filter appends correct SQL clause
  - Test `findAllByUser` — priority filter appends correct SQL clause
  - Test `findAllByUser` — `status=all` behaves same as no filter (no extra clause)
  - Test `findAllByUser` — never returns rows with `deleted_at` set (SQL includes filter)
  - Test `findByIdAndUser` — returns `null` when no rows match
  - Test `findByIdAndUser` — returns `TodoRow` when found
  - Test `create` — calls INSERT and returns new row
  - Test `update` — returns updated row when found
  - Test `update` — returns `null` when no rows updated
  - Test `toggleStatus` — returns toggled row
  - Test `toggleStatus` — returns `null` when not found
  - Test `softDelete` — returns `true` when row updated
  - Test `softDelete` — returns `false` when no rows updated

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 3: Backend — Service + Tests

- [ ] **3.1** Create `src/backend/services/TodoService.ts`
  - Private `formatTodo(row: TodoRow): TodoResult` helper
    - `due_date`: `row.due_date ? row.due_date.toISOString().split('T')[0] : null`
    - `created_at`: `row.created_at.toISOString()`
    - `updated_at`: `row.updated_at.toISOString()`
    - Intentionally excludes `deleted_at`
  - `listTodos(userId, filters)` → `findAllByUser` → `rows.map(formatTodo)`
  - `getTodo(userId, id)` → `findByIdAndUser` → if `null`: `throw AppError(404, TODO_NOT_FOUND, 'Todo not found')` → `formatTodo`
  - `createTodo(userId, data)` → `create` → `formatTodo`
  - `updateTodo(userId, id, data)` → `update` → if `null`: `throw AppError(404, TODO_NOT_FOUND)` → `formatTodo`
  - `toggleTodo(userId, id)` → `toggleStatus` → if `null`: `throw AppError(404, TODO_NOT_FOUND)` → `formatTodo`
  - `deleteTodo(userId, id)` → `softDelete` → if `false`: `throw AppError(404, TODO_NOT_FOUND)` → `void`

- [ ] **3.2** Create `src/backend/tests/services/TodoService.test.ts`
  - Mock `TodoRepository` via `vi.mock`
  - Test `listTodos` — calls repository with userId and filters
  - Test `listTodos` — maps `due_date` Date object → `'YYYY-MM-DD'` string
  - Test `listTodos` — maps `created_at`/`updated_at` Date → ISO 8601 string
  - Test `listTodos` — result never contains `deleted_at`
  - Test `getTodo` — throws `AppError(404, TODO_NOT_FOUND)` when repo returns null
  - Test `getTodo` — returns formatted `TodoResult` on success
  - Test `createTodo` — returns formatted `TodoResult` with correct user_id
  - Test `updateTodo` — throws `AppError(404)` when repo returns null
  - Test `updateTodo` — returns formatted `TodoResult` on success
  - Test `toggleTodo` — throws `AppError(404)` when repo returns null
  - Test `toggleTodo` — returns formatted `TodoResult` on success
  - Test `deleteTodo` — throws `AppError(404)` when repo returns false
  - Test `deleteTodo` — returns void on success (no error thrown)

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 4: Backend — Controller + Routes

- [ ] **4.1** Create `src/backend/controllers/TodoController.ts`
  - `list(req, res)` — `req.query` as `TodoFilters` → `TodoService.listTodos` → `200 { data: [...] }`
  - `getOne(req, res)` — `req.params.id` → `TodoService.getTodo` → `200 { data: todo }`
  - `create(req, res)` — `req.body as CreateTodoData` → `TodoService.createTodo` → `201 { data: todo }`
  - `update(req, res)` — `req.params.id + req.body as UpdateTodoData` → `TodoService.updateTodo` → `200 { data: todo }`
  - `toggle(req, res)` — `req.params.id` → `TodoService.toggleTodo` → `200 { data: todo }`
  - `remove(req, res)` — `req.params.id` → `TodoService.deleteTodo` → `204` (no body, `res.sendStatus(204)`)
  - `req.user!.id` safe to assert — `authenticate` middleware guarantees it is set

- [ ] **4.2** Create `src/backend/routes/todos.ts`
  - Define Zod schemas inline:
    - `ListSchema`: `status` optional enum, `priority` optional enum
    - `CreateSchema`: `title` required min 1 max 255; optional `description` max 1000, `priority` enum, `due_date` regex
    - `UpdateSchema`: all fields optional; `description` and `due_date` nullable; `.refine(data => Object.keys(data).length > 0)` with message `'At least one field must be provided'`
  - Route registrations in this exact order (toggle before `:id` to prevent param collision):
    ```
    GET    /            → [authenticate, validate(ListSchema, 'query'), asyncHandler(list)]
    POST   /            → [authenticate, validate(CreateSchema),        asyncHandler(create)]
    GET    /:id         → [authenticate,                                asyncHandler(getOne)]
    PATCH  /:id/toggle  → [authenticate,                                asyncHandler(toggle)]
    PATCH  /:id         → [authenticate, validate(UpdateSchema),        asyncHandler(update)]
    DELETE /:id         → [authenticate,                                asyncHandler(remove)]
    ```

- [ ] **4.3** Modify `src/backend/routes/index.ts`
  - Import `todosRouter` from `./todos`
  - Register: `router.use('/todos', todosRouter)`
  - Remove the placeholder comment

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 5: Verification

- [ ] **5.1** All acceptance criteria covered:
  - AC-04.1–04.7 (Create) ✓ Zod + service + repository
  - AC-05.1–05.5 (List + filters) ✓ dynamic WHERE + filter validation
  - AC-06.1–06.2 (Get single + ownership) ✓ `findByIdAndUser` + 404 on null
  - AC-07.1–07.4 (Update partial + `updated_at`) ✓ dynamic SET + always refreshes
  - AC-08.1–08.3 + clarification (Toggle + `updated_at`) ✓ SQL CASE + NOW()
  - AC-09.1–09.4 (Soft delete + 204) ✓ `deleted_at` + `sendStatus(204)`
  - Security ✓ `authenticate` on all routes; `deleted_at` never in response

- [ ] **5.2** All quality gates green:
  - `npm run build` → 0 errors
  - `npm run lint` → 0 errors / 0 warnings
  - `npm run test` → all tests green

- [ ] **5.3** Run commitlint check:
  - `npx commitlint --from HEAD~1`

---

## Tasks Review Checklist

- [x] Every spec scenario has at least one test task (phases 2 and 3)
- [x] Every phase ends with a build + lint + test checkpoint
- [x] Backend layers in correct order: types (1) → repo (2) → service (3) → controller (4) → route (4)
- [x] DB migration (1.1) before any repository or service code
- [x] `PATCH /:id/toggle` registered before `PATCH /:id` — explicitly called out in task 4.2
