# Tasks: feature/frontend/todo-dashboard

**Branch:** `feature/frontend/todo-dashboard`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-06

---

## Phase 1: Zustand Stores

- [ ] **1.1** Create `src/frontend/store/todoStore.ts`
  - `TodoFilters` interface (`status: TodoStatus`, `priority: TodoPriority | ''`)
  - `TodoState` with: `todos`, `filters`, `isLoading`, `setTodos`, `addTodo`, `updateTodo`, `removeTodo`, `setFilters`, `setLoading`
  - Default filters: `{ status: 'all', priority: '' }`

- [ ] **1.2** Create `src/frontend/store/uiStore.ts`
  - `Toast` interface: `{ id: string; type: 'success' | 'error'; message: string }`
  - `UiState` with: `toasts`, `addToast`, `removeToast`
  - `addToast` uses `crypto.randomUUID()` for id + sets 3s auto-dismiss `setTimeout`

- [ ] **1.3** Create `src/frontend/store/todoStore.test.ts`
  - Test `setTodos` replaces array
  - Test `addTodo` prepends to array
  - Test `updateTodo` replaces matching id in-place
  - Test `removeTodo` removes matching id
  - Test `setFilters` merges partial filters
  - Test `setLoading` toggles flag

- [ ] **1.4** Create `src/frontend/store/uiStore.test.ts`
  - Test `addToast` adds toast with correct type + message
  - Test `removeToast` removes toast by id
  - Test auto-dismiss calls `removeToast` after 3s (use `vi.useFakeTimers`)

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 2: Hooks

- [ ] **2.1** Create `src/frontend/hooks/useTodos.ts`
  - Define local `CreateTodoData` and `UpdateTodoData` interfaces
  - `fetchTodos()` — GET `/api/todos` with filters from store; sets loading; calls `setTodos`; error toast on failure
  - `createTodo(data)` — POST `/api/todos`; calls `addTodo`; success + error toast; returns `boolean`
  - `updateTodo(id, data)` — PATCH `/api/todos/:id`; calls `updateTodo` on store; success + error toast; returns `boolean`
  - `toggleTodo(id)` — optimistic: flip status in store immediately; PATCH `/api/todos/:id/toggle`; replace with server response on success; revert on error + error toast
  - `deleteTodo(id)` — DELETE `/api/todos/:id`; calls `removeTodo`; success + error toast; returns `boolean`
  - `setFilters(partial)` — delegates to `todoStore.setFilters`

- [ ] **2.2** Create `src/frontend/hooks/useToast.ts`
  - Thin wrapper: reads `toasts`, exposes `addToast`, `removeToast` from `uiStore`

- [ ] **2.3** Create `src/frontend/hooks/useTodos.test.ts`
  - Mock `api` via `vi.mock('../utils/api')`
  - Test `fetchTodos` — success: calls `setTodos` with response data
  - Test `fetchTodos` — error: shows error toast, does not throw
  - Test `createTodo` — success: calls `addTodo`, returns `true`, shows success toast
  - Test `createTodo` — error: returns `false`, shows error toast
  - Test `updateTodo` — success: calls `updateTodo` in store, returns `true`
  - Test `updateTodo` — error: returns `false`, shows error toast
  - Test `toggleTodo` — optimistic: store flipped before API resolves
  - Test `toggleTodo` — revert: store reverted to original status on API error
  - Test `deleteTodo` — success: calls `removeTodo`, returns `true`
  - Test `deleteTodo` — error: returns `false`, shows error toast

- [ ] **2.4** Create `src/frontend/hooks/useToast.test.ts`
  - Test returns `toasts` from uiStore
  - Test `addToast` delegates to store

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 3: Primitive Components

- [ ] **3.1** Create `src/frontend/components/Badge.tsx`
  - Props: `type: 'status' | 'priority'`, `value: string`
  - Status colors: pending = yellow, completed = green
  - Priority colors: low = gray, medium = blue, high = red
  - Renders `<span>` with Tailwind pill classes

- [ ] **3.2** Create `src/frontend/components/Spinner.tsx`
  - Centered animated SVG spinner, no props
  - Used for full-page loading state

- [ ] **3.3** Create `src/frontend/components/Toast.tsx`
  - Props: `toast: Toast`, `onDismiss: (id: string) => void`
  - Success = green, error = red
  - "×" dismiss button

- [ ] **3.4** Create `src/frontend/components/ToastContainer.tsx`
  - No props — reads directly from `uiStore`
  - `fixed bottom-4 right-4 z-50 flex flex-col gap-2`
  - Renders `<Toast>` for each toast in store

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 4: Feature Components

- [ ] **4.1** Create `src/frontend/components/FilterBar.tsx`
  - Props: `filters: TodoFilters`, `onChange: (filters: Partial<TodoFilters>) => void`
  - Status `<select>`: all / pending / completed
  - Priority `<select>`: all (value `''`) / low / medium / high
  - Calls `onChange` on each change event

- [ ] **4.2** Create `src/frontend/components/TodoItem.tsx`
  - Props: `todo`, `onToggle`, `onEdit`, `onDelete`
  - Local `isExpanded` state (`useState(false)`)
  - Clicking row (not buttons) toggles `isExpanded`
  - When expanded: shows `description` (or "No description" if null)
  - Checkbox calls `onToggle(todo.id)` — checked when `status === 'completed'`
  - Badge for status, Badge for priority, formatted `due_date`
  - Edit button calls `onEdit(todo)`, Delete button calls `onDelete(todo)`

- [ ] **4.3** Create `src/frontend/components/TodoList.tsx`
  - Props: `todos`, `onToggle`, `onEdit`, `onDelete`
  - Maps todos → `<TodoItem>`
  - Empty state: "No todos found. Add one to get started." when `todos.length === 0`

- [ ] **4.4** Create `src/frontend/components/TodoModal.tsx`
  - Props: `todo?: Todo`, `onClose: () => void`, `onSubmit: (data) => Promise<boolean>`
  - Add mode when `todo` is undefined; Edit mode when `todo` is defined
  - Fields: title (required), description (textarea), priority (select), due_date (date input)
  - Client-side validation: title must not be empty
  - Calls `onSubmit(data)`; closes modal only if `onSubmit` returns `true`
  - Disable submit button while in-flight (`isSubmitting` local state)
  - Modal overlay closes on backdrop click

- [ ] **4.5** Create `src/frontend/components/DeleteConfirmModal.tsx`
  - Props: `todo: Todo`, `onConfirm: () => Promise<void>`, `onCancel: () => void`
  - Shows todo title in message: "Delete '{title}'?"
  - "Delete" (danger) + "Cancel" (secondary) buttons
  - Disable both buttons while confirming (`isDeleting` local state)

- [ ] **4.6** Create `src/frontend/components/TodoItem.test.tsx`
  - Test: renders todo title, status badge, priority badge
  - Test: clicking row toggles description visibility
  - Test: checkbox calls `onToggle` with todo id
  - Test: edit button calls `onEdit` with todo
  - Test: delete button calls `onDelete` with todo

- [ ] **4.7** Create `src/frontend/components/TodoModal.test.tsx`
  - Test: renders empty form in add mode (no `todo` prop)
  - Test: pre-fills form fields in edit mode (`todo` prop provided)
  - Test: shows error if title is empty on submit
  - Test: calls `onSubmit` with form data on valid submission
  - Test: closes (calls `onClose`) when `onSubmit` returns `true`
  - Test: stays open when `onSubmit` returns `false`

- [ ] **4.8** Create `src/frontend/components/FilterBar.test.tsx`
  - Test: renders status and priority selects
  - Test: changing status calls `onChange` with correct partial
  - Test: changing priority calls `onChange` with correct partial

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 5: Page + Routing

- [ ] **5.1** Create `src/frontend/pages/TodosPage.tsx`
  - Reads `todos`, `isLoading`, `filters` from `useTodos`
  - `useEffect([filters])` → calls `fetchTodos()` on mount and filter change
  - Local state: `showAddModal: boolean`, `editingTodo: Todo | null`, `deletingTodo: Todo | null`
  - Renders: page header with user email + Logout button, `FilterBar`, "Add Todo" button,
    `Spinner` (when loading), `TodoList`, `TodoModal` (when `showAddModal` or `editingTodo`),
    `DeleteConfirmModal` (when `deletingTodo`), `ToastContainer`
  - Logout: calls `useAuth().logout()`
  - Add handler: `createTodo(data)` → on `true` close modal
  - Edit handler: `updateTodo(id, data)` → on `true` close modal
  - Toggle handler: `toggleTodo(id)`
  - Delete handler: `deleteTodo(id)` → close confirm modal

- [ ] **5.2** Modify `src/frontend/App.tsx`
  - Import `TodosPage`
  - Replace `<div>Todos coming soon</div>` with `<TodosPage />`

- [ ] **5.3** Create `src/frontend/pages/TodosPage.test.tsx`
  - Mock `useTodos` and `useAuth`
  - Test: renders spinner when `isLoading` is true
  - Test: renders todo list when todos are present
  - Test: shows empty state when `todos` is empty
  - Test: "Add Todo" button opens modal
  - Test: logout button calls `logout()`
  - Test: filter change calls `setFilters`

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 6: Final Verification

- [ ] **6.1** All spec scenarios from `proposal.md` covered?
  - AC-11.1 → AC-11.14 all implemented
  - AC-12.1 → AC-12.5 all implemented
  - AC-E1 (existing Axios interceptor — no new code needed ✓)
  - AC-E2 (422 errors shown as toast via error handling in useTodos ✓)

- [ ] **6.2** All FRS acceptance criteria for US-11 and US-12 tested?

- [ ] **6.3** Run full quality gates:
  ```bash
  npm run build
  npm run lint
  npm run test
  npx commitlint --from HEAD~1
  ```

- [ ] **6.4** Archive spec:
  ```bash
  openspec archive feature/frontend/todo-dashboard
  ```

---

## Tasks Review Checklist

- [ ] Every spec scenario has at least one TEST task?
- [ ] Every phase ends with a build + lint + test checkpoint?
- [ ] Frontend layers in correct order (store → hooks → components → page)?
- [ ] No backend or DB tasks (this is purely frontend)?
