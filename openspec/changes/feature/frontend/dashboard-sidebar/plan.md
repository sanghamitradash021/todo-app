# Plan: feature/frontend/dashboard-sidebar

**Branch:** `feature/frontend/dashboard-sidebar`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-10

---

## 1. Existing Code to Reuse (No Duplication)

| Existing | Location | Reuse |
|----------|----------|-------|
| `useAuthStore` | `src/frontend/store/authStore.ts` | `user.email` for sidebar bottom display |
| `useAuth` | `src/frontend/hooks/useAuth.ts` | `logout()` callback passed to Sidebar |
| `useTodoStore` | `src/frontend/store/todoStore.ts` | `setFilters` for Pending/Completed/All Todos nav links |
| `StatsRow` | `src/frontend/components/dashboard/StatsRow.tsx` | Moved to DashboardPage |
| `ChartsRow` | `src/frontend/components/dashboard/ChartsRow.tsx` | Moved to DashboardPage |
| `useDashboardStats` | `src/frontend/hooks/useDashboardStats.ts` | Moved to DashboardPage |
| `ProtectedRoute` | already in `App.tsx` | Wrap DashboardLayout inside ProtectedRoute via `<Outlet>` |
| framer-motion | already installed | `AnimatePresence`, `motion.div` for mobile overlay |
| React Router `useNavigate`, `useLocation` | already installed | Active link detection + programmatic navigation |

---

## 2. New Types Needed

Three local prop interfaces, defined inline in their respective files (not exported globally):

```typescript
// Sidebar.tsx
interface SidebarProps {
  isOpen:   boolean;
  onClose:  () => void;
  onLogout: () => void;
  email:    string | null;
}

// NavLink config (internal constant, not exported)
interface NavLinkConfig {
  label:        string;
  to:           string;
  statusFilter: 'all' | 'pending' | 'completed' | null;
}
```

---

## 3. Exact File Paths

### Create (new files)
```
src/frontend/components/layout/DashboardLayout.tsx
src/frontend/components/layout/Sidebar.tsx
src/frontend/pages/DashboardPage.tsx
```

### Modify (existing files)
```
src/frontend/App.tsx              — add /dashboard route, wrap protected routes in DashboardLayout
src/frontend/pages/TodosPage.tsx  — remove StatsRow, ChartsRow, useDashboardStats, header with email+logout
```

### Test files
```
src/frontend/components/layout/Sidebar.test.tsx
src/frontend/components/layout/DashboardLayout.test.tsx
src/frontend/pages/DashboardPage.test.tsx
```

### Test files to update
```
src/frontend/pages/TodosPage.test.tsx  — remove assertions for StatsRow/spinner from slimmed page
```

---

## 4. Route Tree After This Phase

```
<BrowserRouter>
  <Routes>
    <Route path="/"         element={<Navigate to="/dashboard" replace />} />
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/todos"     element={<TodosPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

---

## 5. Architecture Decisions

### A1 — DashboardLayout wraps all protected routes via `<Outlet>`
Both `/dashboard` and `/todos` share the same sidebar and layout shell. No per-page sidebar rendering.

**Reasoning:** Single layout instance avoids sidebar re-mounting on route change. Matches FRS §3 "persistent sidebar".

### A2 — DashboardLayout owns mobile sidebar open/close state
`isSidebarOpen` is `useState` in `DashboardLayout`. Passed to `<Sidebar isOpen={...} onClose={...} />`.

**Reasoning:** Sidebar visibility is layout-level state. Neither DashboardPage nor TodosPage should own this.

### A3 — Sidebar active state derived from `useLocation` + `useTodoStore`
"All Todos / Pending / Completed" active = `pathname === '/todos' && filters.status === X`. "Dashboard" active = `pathname === '/dashboard'`.

**Reasoning:** Filter state already lives in `todoStore`. No new state needed.

### A4 — Nav link click mutates filter then navigates
Filter links: `setFilters({ status: X })` → `navigate('/todos')`. Dashboard link: `navigate('/dashboard')` only (no filter mutation).

**Reasoning:** Ensures the todos page opens with the correct filter already set before fetching.

### A5 — Mobile overlay uses `AnimatePresence` + `motion.div`
Backdrop: `opacity: 0 → 0.4`. Drawer: `x: '-100%' → 0`. Both exit when `isSidebarOpen` becomes `false`.

**Reasoning:** Matches FRS AC-D08.7/D08.8 slide-in/slide-out requirement.

### A6 — Content split: DashboardPage owns stats + charts
`TodosPage` is slimmed to: FilterBar + Add Todo + AnimatedTodoList + modals + ToastContainer. All stats/charts/user-header logic moves to `DashboardPage` and `Sidebar`.

**Reasoning:** Clean separation of concerns. Dashboard = overview. Todos = task management.

---

## 6. Sidebar Nav Links

```typescript
const NAV_LINKS: NavLinkConfig[] = [
  { label: 'Dashboard',  to: '/dashboard', statusFilter: null        },
  { label: 'All Todos',  to: '/todos',     statusFilter: 'all'       },
  { label: 'Pending',    to: '/todos',     statusFilter: 'pending'   },
  { label: 'Completed',  to: '/todos',     statusFilter: 'completed' },
];
```

Active indicator: `motion.div` with `layoutId="sidebar-active"` absolutely positioned behind active link.

---

## 7. Content to Remove from TodosPage

| Was in TodosPage | Moved to |
|-----------------|----------|
| `useDashboardStats()` call | `DashboardPage` |
| `<StatsRow stats={stats} />` | `DashboardPage` |
| `<ChartsRow stats={stats} />` | `DashboardPage` |
| Header `<div>` with email + Logout button | `Sidebar` bottom section |

---

## 8. Implementation Phases

### Phase 1 — Layout Shell
1.1 Create `src/frontend/components/layout/Sidebar.tsx`
1.2 Create `src/frontend/components/layout/DashboardLayout.tsx`
1.3 Create `src/frontend/components/layout/Sidebar.test.tsx`
1.4 Create `src/frontend/components/layout/DashboardLayout.test.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 2 — Dashboard Page
2.1 Create `src/frontend/pages/DashboardPage.tsx`
2.2 Create `src/frontend/pages/DashboardPage.test.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 3 — Route + Page Updates
3.1 Modify `src/frontend/App.tsx` — add `/dashboard` route, wrap protected routes in `DashboardLayout`, change `/` redirect to `/dashboard`
3.2 Modify `src/frontend/pages/TodosPage.tsx` — remove stats/charts/header; add `hidden md:block` on `<h1>`
3.3 Update `src/frontend/pages/TodosPage.test.tsx` — remove assertions for StatsRow/chartsRow/stats-spinner
**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## 9. No DB / Backend Changes

Purely frontend. No new API endpoints. No new npm packages.

---

## 10. Plan Review Checklist

- [x] File paths follow `src/frontend/` structure from AGENTS.md
- [x] Route changes documented (new `/dashboard`, redirect change)
- [x] Content split documented (what moves to DashboardPage vs stays in TodosPage)
- [x] No new npm packages
- [x] No DB migrations needed
- [x] Depends on Phases 1–4 (all components + hooks in place)
- [x] Test files to update listed explicitly
