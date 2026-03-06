# Spec: feature/frontend/todo-dashboard

**Branch:** `feature/frontend/todo-dashboard`
**Status:** Draft — awaiting dev sign-off
**Generated:** 2026-03-06

---

## 1. Business Intent

Implement the full Todo Dashboard UI. Authenticated users can view, filter, create, edit, toggle,
and delete their todos from a single page. This feature consumes the existing `/api/todos` backend
and wires it into the Zustand store, custom hooks, and React components.

**FRS coverage:**
- US-11: Todo Dashboard (full list, filter bar, add/edit modal, expand, toggle, delete)
- US-12: Feedback & Loading States (spinner, toasts, optimistic toggle)

---

## 2. In-Scope

- `TodosPage` — the `/todos` route page (replaces `<div>Todos coming soon</div>` in App.tsx)
- `todoStore` — Zustand store holding todos list + UI filter state
- `uiStore` — Zustand store for toast notifications
- `useTodos` hook — async operations (list, create, update, toggle, delete)
- `useToast` hook — enqueue/dismiss toast messages
- Components:
  - `TodoList` — renders the list of `TodoItem` rows
  - `TodoItem` — single todo row; click to expand description; toggle checkbox; edit/delete buttons
  - `TodoModal` — shared Add/Edit modal (pre-filled when editing)
  - `DeleteConfirmModal` — custom confirmation modal before soft-delete
  - `FilterBar` — status + priority dropdowns
  - `Badge` — reusable priority + status badge (color-coded)
  - `Spinner` — loading indicator
  - `Toast` / `ToastContainer` — success/error notification system
- Wire `/todos` route in `App.tsx` to `TodosPage`
- Logout button visible on `TodosPage`

---

## 3. Out-of-Scope

- Pagination — FRS explicitly defers (MVP returns full array)
- Drag-and-drop reordering
- Bulk operations (bulk delete, bulk status update)
- Sorting options beyond default (`created_at DESC` from server)
- Optimistic UI for create, update, or delete — only toggle is optimistic (per Q3)
- Dark mode / theme switching
- Mobile-specific layout (responsive is nice-to-have but not required)

---

## 4. Clarifications Applied (from Q&A)

| Question | Decision |
|----------|----------|
| Add Todo form | Modal popup |
| Edit Todo flow | Same `TodoModal` component pre-filled with existing data |
| Optimistic UI | Toggle only — instant local flip before server confirms |
| Delete confirmation | Custom `DeleteConfirmModal` — not `window.confirm` |
| Expand todo details | Click row toggles expansion; expanded state is local (per-row `useState`) |

---

## 5. API Contracts Consumed

All calls use the existing `api` Axios instance (`src/frontend/utils/api.ts`).
No new API endpoints. All shapes match SDS §5 exactly.

| Action | Method | URL | Success |
|--------|--------|-----|---------|
| List todos | GET | `/api/todos?status=&priority=` | 200 `{ data: Todo[] }` |
| Create todo | POST | `/api/todos` | 201 `{ data: Todo }` |
| Get single | GET | `/api/todos/:id` | 200 `{ data: Todo }` |
| Update todo | PATCH | `/api/todos/:id` | 200 `{ data: Todo }` |
| Toggle status | PATCH | `/api/todos/:id/toggle` | 200 `{ data: Todo }` |
| Delete todo | DELETE | `/api/todos/:id` | 204 (no body) |

---

## 6. State Design

### `todoStore` (`src/frontend/store/todoStore.ts`)

```typescript
interface TodoState {
  todos: Todo[];
  filters: { status: TodoStatus; priority: TodoPriority | '' };
  isLoading: boolean;
  // Actions
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (todo: Todo) => void;
  removeTodo: (id: string) => void;
  setFilters: (filters: Partial<TodoState['filters']>) => void;
  setLoading: (loading: boolean) => void;
}
```

### `uiStore` (`src/frontend/store/uiStore.ts`)

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface UiState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}
```

---

## 7. Hook Design

### `useTodos` (`src/frontend/hooks/useTodos.ts`)

Wraps all 6 todo operations. Each method:
- Sets `isLoading` while in-flight
- Updates the store on success
- Calls `addToast` on success and error

```typescript
interface UseTodos {
  todos: Todo[];
  isLoading: boolean;
  filters: TodoState['filters'];
  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoData) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoData) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;   // optimistic
  deleteTodo: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TodoState['filters']>) => void;
}
```

**Optimistic toggle logic:**
1. Immediately flip `status` in the store (`pending` ↔ `completed`)
2. Call `PATCH /api/todos/:id/toggle`
3. On success: replace optimistic entry with server response
4. On error: revert to original status + show error toast

### `useToast` (`src/frontend/hooks/useToast.ts`)

```typescript
interface UseToast {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}
```

Toasts auto-dismiss after 3 seconds.

---

## 8. Component Responsibility Map

| Component | File | Responsibility |
|-----------|------|----------------|
| `TodosPage` | `pages/TodosPage.tsx` | Layout, trigger fetchTodos on mount, compose FilterBar + TodoList + modals + ToastContainer |
| `FilterBar` | `components/FilterBar.tsx` | Status + priority `<select>` dropdowns; calls `setFilters` on change; triggers `fetchTodos` |
| `TodoList` | `components/TodoList.tsx` | Maps `todos` array → `TodoItem`; shows empty state if empty |
| `TodoItem` | `components/TodoItem.tsx` | Row: checkbox (toggle), title, Badge(status), Badge(priority), due_date, edit/delete buttons; click row = expand description |
| `TodoModal` | `components/TodoModal.tsx` | Controlled form for create + edit; pre-filled when `todo` prop provided; calls `createTodo` or `updateTodo` |
| `DeleteConfirmModal` | `components/DeleteConfirmModal.tsx` | "Are you sure?" modal; calls `deleteTodo` on confirm |
| `Badge` | `components/Badge.tsx` | Color-coded span for `status` and `priority` values |
| `Spinner` | `components/Spinner.tsx` | Centered loading indicator; shown when `isLoading` is true |
| `Toast` | `components/Toast.tsx` | Single toast notification (success = green, error = red) |
| `ToastContainer` | `components/ToastContainer.tsx` | Absolute-positioned container; renders `Toast` list from `uiStore` |

---

## 9. Acceptance Criteria

Mapped 1-to-1 from FRS US-11 and US-12:

### Dashboard (US-11)

- **AC-11.1** `TodosPage` renders at `/todos` for authenticated users
- **AC-11.2** Todos list shows `title`, `status` badge, `priority` badge, `due_date`
- **AC-11.3** Filter bar with `status` (all/pending/completed) and `priority` (all/low/medium/high) dropdowns
- **AC-11.4** Changing a filter re-fetches todos with updated query params
- **AC-11.5** "Add Todo" button opens `TodoModal` (empty form)
- **AC-11.6** Submitting Add Todo form calls `POST /api/todos`, adds to list, shows success toast
- **AC-11.7** "Edit" button on a todo opens `TodoModal` pre-filled with existing todo data
- **AC-11.8** Submitting Edit form calls `PATCH /api/todos/:id`, updates list, shows success toast
- **AC-11.9** Clicking a todo row expands to show `description` (local state per row; collapse on second click)
- **AC-11.10** Toggle checkbox calls `PATCH /api/todos/:id/toggle`, updates status in list
- **AC-11.11** "Delete" button opens `DeleteConfirmModal`; confirming calls `DELETE /api/todos/:id`, removes todo from list, shows success toast
- **AC-11.12** Cancelling `DeleteConfirmModal` takes no action
- **AC-11.13** Logout button on `TodosPage` calls `useAuth.logout()` and redirects to `/login`
- **AC-11.14** Empty state message shown when no todos match current filters

### Feedback & Loading (US-12)

- **AC-12.1** `Spinner` shown while `isLoading` is true (initial fetch)
- **AC-12.2** Success toast shown after create, update, toggle, delete
- **AC-12.3** Error toast shown on API failure for any operation
- **AC-12.4** Optimistic toggle: status flips instantly in UI before server responds
- **AC-12.5** Optimistic toggle reverts to original state on API error

### Error/Auth edge cases

- **AC-E1** If `/api/todos` returns 401, Axios interceptor clears auth + redirects to `/login` (existing behavior — no new code needed)
- **AC-E2** API validation errors (422) shown as error toast with server message

---

## 10. No DB / API Changes

This feature is entirely frontend. No new backend endpoints, no DB migrations.

---

## 11. Spec Review Checklist

- [x] Every FRS acceptance criterion has a matching spec scenario
- [x] Every error case from FRS has a scenario
- [x] API shapes match SDS §5 contracts exactly (no new endpoints)
- [x] No invented business rules not in FRS
- [x] Out-of-scope section exists (pagination, drag-drop, bulk ops, optimistic create/delete)
