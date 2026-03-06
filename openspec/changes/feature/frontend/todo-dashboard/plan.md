# Plan: feature/frontend/todo-dashboard

**Branch:** `feature/frontend/todo-dashboard`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-06

---

## 1. Existing Code to Reuse (No Duplication)

| Existing | Location | Reuse |
|----------|----------|-------|
| `Todo`, `TodoStatus`, `TodoPriority`, `ApiSuccess`, `ApiError` | `src/frontend/types/index.ts` | All already defined — no new types needed |
| `api` Axios instance | `src/frontend/utils/api.ts` | All API calls go through this |
| `useAuthStore` | `src/frontend/store/authStore.ts` | `useAuthStore((s) => s.user)` for email display; `logout` for logout button |
| `useAuth().logout` | `src/frontend/hooks/useAuth.ts` | Reuse directly for logout button on TodosPage |
| `TODO_STATUS`, `TODO_PRIORITY`, `ROUTES` | `src/frontend/config/constants.ts` | Use throughout; no additions needed |
| Tailwind class patterns | `LoginPage.tsx`, `RegisterPage.tsx` | Match button, input, card styles for consistency |

---

## 2. New Types Needed

None. All types are already in `src/frontend/types/index.ts`:
- `Todo` — full todo shape
- `TodoStatus` (`'pending' | 'completed' | 'all'`)
- `TodoPriority` (`'low' | 'medium' | 'high'`)
- `ApiSuccess<T>` — success envelope

Two local interfaces defined inline in their respective files (not exported — single use):
- `CreateTodoData` (in `useTodos.ts`) — `{ title, description?, priority?, due_date? }`
- `UpdateTodoData` (in `useTodos.ts`) — `{ title?, description?, priority?, due_date? }`

---

## 3. Exact File Paths

### Create (new files)
```
src/frontend/store/todoStore.ts
src/frontend/store/uiStore.ts
src/frontend/hooks/useTodos.ts
src/frontend/hooks/useToast.ts
src/frontend/pages/TodosPage.tsx
src/frontend/components/Badge.tsx
src/frontend/components/Spinner.tsx
src/frontend/components/Toast.tsx
src/frontend/components/ToastContainer.tsx
src/frontend/components/FilterBar.tsx
src/frontend/components/TodoList.tsx
src/frontend/components/TodoItem.tsx
src/frontend/components/TodoModal.tsx
src/frontend/components/DeleteConfirmModal.tsx
```

### Modify (existing files)
```
src/frontend/App.tsx     — replace <div>Todos coming soon</div> with <TodosPage />
```

### Test files
```
src/frontend/store/todoStore.test.ts
src/frontend/store/uiStore.test.ts
src/frontend/hooks/useTodos.test.ts
src/frontend/hooks/useToast.test.ts
src/frontend/pages/TodosPage.test.tsx
src/frontend/components/TodoItem.test.tsx
src/frontend/components/TodoModal.test.tsx
src/frontend/components/FilterBar.test.tsx
```

---

## 4. Interface Shapes (Final)

### todoStore
```typescript
interface TodoFilters {
  status: TodoStatus;      // default: 'all'
  priority: TodoPriority | ''; // '' = no filter
}

interface TodoState {
  todos: Todo[];
  filters: TodoFilters;
  isLoading: boolean;
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (todo: Todo) => void;
  removeTodo: (id: string) => void;
  setFilters: (filters: Partial<TodoFilters>) => void;
  setLoading: (loading: boolean) => void;
}
```

### uiStore
```typescript
interface Toast {
  id: string;        // crypto.randomUUID()
  type: 'success' | 'error';
  message: string;
}

interface UiState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}
```

### useTodos return shape
```typescript
interface CreateTodoData {
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

interface UpdateTodoData {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

interface UseTodosReturn {
  todos: Todo[];
  isLoading: boolean;
  filters: TodoFilters;
  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoData) => Promise<boolean>;
  updateTodo: (id: string, data: UpdateTodoData) => Promise<boolean>;
  toggleTodo: (id: string) => Promise<void>;  // optimistic
  deleteTodo: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<TodoFilters>) => void;
}
```

`createTodo`, `updateTodo`, `deleteTodo` return `boolean` so the caller (modal/page) knows whether to close the modal or keep it open on error.

---

## 5. Architecture Decisions

### A1 — `useTodos` owns all side effects
All API calls live in `useTodos`. Components receive callbacks via props or call the hook directly. No `api` calls in components.

**Reasoning:** Matches AGENTS.md §5 "Never call API directly from components".

### A2 — Optimistic toggle — store-first, then server
Toggle immediately calls `updateTodo(id, { status: flipped })` on the store before the API call. On error, reverts. No intermediate "toggling" state.

**Reasoning:** FRS US-12 requires instant visual feedback for toggle only.

### A3 — `createTodo`/`updateTodo` return `boolean` success signal
The `TodoModal` uses the return value to decide whether to close. If `false`, modal stays open (error toast already shown by the hook).

**Reasoning:** Prevents modal closing on API error; cleaner than lifting error state up.

### A4 — `uiStore` for toasts, not component state
Toast queue lives in Zustand so any hook or component can enqueue without prop-drilling.

**Reasoning:** Matches AGENTS.md §5 "Stores hold global state".

### A5 — `TodoItem` expand state is `useState` (local)
`isExpanded` is a local boolean in `TodoItem`. Not stored in Zustand — ephemeral UI state.

**Reasoning:** Per Q5 clarification. Expansion doesn't need to survive re-renders or be shared.

### A6 — Toast auto-dismiss via `setTimeout` in `addToast`
`uiStore.addToast` sets a 3-second timeout that calls `removeToast(id)`.

**Reasoning:** Self-contained — no effect cleanup needed in components.

### A7 — `TodoModal` controlled form, no Zod on frontend
Form fields managed with `useState`. Client-side validation: title required only. Server-side errors shown via toast.

**Reasoning:** Avoids duplicating Zod on frontend for MVP. Server already validates fully.

### A8 — Filter changes trigger `fetchTodos` via `useEffect`
`TodosPage` has a `useEffect([filters])` that calls `fetchTodos()` whenever filters change.

**Reasoning:** Single source of truth — filters in store, fetch driven by store state.

---

## 6. Component Props

```typescript
// Badge.tsx
interface BadgeProps {
  type: 'status' | 'priority';
  value: string;
}

// Spinner.tsx  (no props)

// Toast.tsx
interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

// ToastContainer.tsx  (reads from uiStore directly, no props)

// FilterBar.tsx
interface FilterBarProps {
  filters: TodoFilters;
  onChange: (filters: Partial<TodoFilters>) => void;
}

// TodoList.tsx
interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

// TodoItem.tsx
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

// TodoModal.tsx
interface TodoModalProps {
  todo?: Todo;            // undefined = add mode, defined = edit mode
  onClose: () => void;
  onSubmit: (data: CreateTodoData | UpdateTodoData) => Promise<boolean>;
}

// DeleteConfirmModal.tsx
interface DeleteConfirmModalProps {
  todo: Todo;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

---

## 7. Tailwind Style Conventions (match existing pages)

- Card: `bg-white rounded-lg shadow p-6`
- Primary button: `bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50`
- Secondary button: `bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50`
- Danger button: `bg-red-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-red-700`
- Input: `w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
- Modal overlay: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`
- Modal panel: `bg-white rounded-lg shadow-xl w-full max-w-lg p-6`
- Badge — status pending: `bg-yellow-100 text-yellow-800`; completed: `bg-green-100 text-green-800`
- Badge — priority low: `bg-gray-100 text-gray-700`; medium: `bg-blue-100 text-blue-700`; high: `bg-red-100 text-red-700`
- Toast success: `bg-green-600 text-white`; error: `bg-red-600 text-white`

---

## 8. Implementation Phases

### Phase 1 — Stores
1.1 Create `src/frontend/store/todoStore.ts`
1.2 Create `src/frontend/store/uiStore.ts`
1.3 Create `src/frontend/store/todoStore.test.ts`
1.4 Create `src/frontend/store/uiStore.test.ts`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 2 — Hooks
2.1 Create `src/frontend/hooks/useTodos.ts`
2.2 Create `src/frontend/hooks/useToast.ts`
2.3 Create `src/frontend/hooks/useTodos.test.ts`
2.4 Create `src/frontend/hooks/useToast.test.ts`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 3 — Primitive Components
3.1 Create `src/frontend/components/Badge.tsx`
3.2 Create `src/frontend/components/Spinner.tsx`
3.3 Create `src/frontend/components/Toast.tsx`
3.4 Create `src/frontend/components/ToastContainer.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 4 — Feature Components
4.1 Create `src/frontend/components/FilterBar.tsx`
4.2 Create `src/frontend/components/TodoItem.tsx`
4.3 Create `src/frontend/components/TodoList.tsx`
4.4 Create `src/frontend/components/TodoModal.tsx`
4.5 Create `src/frontend/components/DeleteConfirmModal.tsx`
4.6 Create component tests: `TodoItem.test.tsx`, `TodoModal.test.tsx`, `FilterBar.test.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 5 — Page + Wiring
5.1 Create `src/frontend/pages/TodosPage.tsx`
5.2 Modify `src/frontend/App.tsx` — wire `<TodosPage />`
5.3 Create `src/frontend/pages/TodosPage.test.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## 9. No DB Changes

This is a purely frontend feature. No migrations, no new backend files.

---

## 10. Plan Review Checklist

- [x] File paths follow `src/frontend/` structure from AGENTS.md
- [x] API shapes match SDS §5 contracts exactly (no new endpoints)
- [x] No duplication of types/utils that already exist
- [x] No DB migrations needed
- [x] Frontend layers in order: store → hooks → components → page
