# Tasks: feature/frontend/dashboard-sidebar

**Branch:** `feature/frontend/dashboard-sidebar`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-10

---

## Phase 1: Layout Shell

- [ ] **1.1** Create `src/frontend/components/layout/Sidebar.tsx`
  - Props: `isOpen: boolean`, `onClose: () => void`, `onLogout: () => void`, `email: string | null`
  - Define `NAV_LINKS` constant (Dashboard, All Todos, Pending, Completed) per plan §6
  - Active state logic:
    - "Dashboard": `pathname === '/dashboard'`
    - Others: `pathname === '/todos' && filters.status === statusFilter`
  - Active indicator: `motion.div` with `layoutId="sidebar-active"` absolutely positioned behind active link
  - Link click: if `statusFilter !== null` → `setFilters({ status })` + `navigate('/todos')`; else `navigate('/dashboard')`
  - On mobile: call `onClose()` after any link click (AC-D08.8)
  - Desktop: `hidden md:flex flex-col fixed inset-y-0 w-60` — always visible
  - Mobile overlay: `AnimatePresence` wrapping a `motion.div` drawer (`x: '-100%' → 0`) + backdrop (`opacity: 0 → 0.4`); backdrop click → `onClose()`
  - Branding: Clipboard SVG icon + `<span>Todo App</span>` in bold
  - Bottom section: user `email` (truncated) + Logout button calling `onLogout` (AC-D08.6)

- [ ] **1.2** Create `src/frontend/components/layout/DashboardLayout.tsx`
  - No props (renders `<Outlet>`)
  - Local state: `isSidebarOpen: boolean` (default `false`)
  - Reads from stores: `useAuthStore` → `user?.email`, `useAuth` → `logout`, `useTodoStore` → `setFilters`
  - Page title map: `{ '/dashboard': 'Dashboard', '/todos': 'My Todos' }` derived from `useLocation`
  - Mobile top bar (`md:hidden`): hamburger button (left) + page title (centre)
  - Renders: `<Sidebar isOpen onClose onLogout email />` + mobile top bar + `<main><Outlet /></main>`
  - Layout: `flex h-screen overflow-hidden`; main: `flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8`

- [ ] **1.3** Create `src/frontend/components/layout/Sidebar.test.tsx`
  - Test: renders all four nav link labels (Dashboard, All Todos, Pending, Completed)
  - Test: clicking "Pending" calls `setFilters({ status: 'pending' })` and navigates to `/todos`
  - Test: clicking "Completed" calls `setFilters({ status: 'completed' })` and navigates to `/todos`
  - Test: clicking "All Todos" calls `setFilters({ status: 'all' })` and navigates to `/todos`
  - Test: clicking "Dashboard" navigates to `/dashboard` without calling `setFilters`
  - Test: Logout button calls `onLogout`
  - Test: user email is displayed in the bottom section
  - Test (mobile overlay): backdrop click calls `onClose`
  - Test (mobile overlay): nav link click calls `onClose`

- [ ] **1.4** Create `src/frontend/components/layout/DashboardLayout.test.tsx`
  - Test: renders `<Outlet>` content (mock route child renders correctly)
  - Test: desktop sidebar has `md:flex` class (not visible on mobile by default)
  - Test: hamburger button is present in mobile top bar
  - Test: clicking hamburger opens the sidebar overlay (`isSidebarOpen` becomes `true`)

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 2: Dashboard Page

- [ ] **2.1** Create `src/frontend/pages/DashboardPage.tsx`
  - Calls `useDashboardStats()` at top of component
  - Renders:
    - `<h1 className="... hidden md:block">Dashboard</h1>` (mobile title is in DashboardLayout top bar)
    - `<StatsRow stats={stats} />`
    - `<ChartsRow stats={stats} />`
  - Container: `max-w-5xl mx-auto`

- [ ] **2.2** Create `src/frontend/pages/DashboardPage.test.tsx`
  - Mock `useDashboardStats` to return `isStatsLoading: true` and fixed stats
  - Test: renders loading stat card skeletons when `isStatsLoading` is `true`
  - Test: renders real stat card labels when `isStatsLoading` is `false`
  - Test: renders chart skeleton when `isStatsLoading` is `true`

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 3: Route + Page Updates

- [ ] **3.1** Modify `src/frontend/App.tsx`
  - Change `/` redirect: `<Navigate to="/dashboard" replace />`
  - Add `<Route path="/dashboard" element={<DashboardPage />} />` inside `DashboardLayout` + `ProtectedRoute`
  - Wrap existing `/todos` route inside `<Route element={<DashboardLayout />}>`
  - Import `DashboardLayout` and `DashboardPage`
  - Final protected route tree per plan §4

- [ ] **3.2** Modify `src/frontend/pages/TodosPage.tsx`
  - Remove: `useDashboardStats()` call
  - Remove: `<StatsRow stats={stats} />`
  - Remove: `<ChartsRow stats={stats} />`
  - Remove: header `<div>` containing user email + Logout button (now in Sidebar)
  - Add: `hidden md:block` on `<h1>My Todos</h1>` heading
  - Retain: `FilterBar`, Add Todo button, `AnimatedTodoList`, all modals, `ToastContainer`, `isInitialLoad` tracking

- [ ] **3.3** Update `src/frontend/pages/TodosPage.test.tsx`
  - Remove assertions that expected `StatsRow` component
  - Remove assertions that expected `ChartsRow` component
  - Remove assertions that expected stats-related spinner
  - Remove assertions for user email / Logout button in page header
  - Update to reflect that TodosPage now renders only: FilterBar, Add Todo, todo list, modals, ToastContainer

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 4: Final Verification

- [ ] **4.1** All AC from proposal §8 covered?
  - AC-D08.1 → AC-D08.8 all implemented
  - Route changes: `/dashboard` route added, `/` redirects to `/dashboard` ✓
  - Layout: desktop sidebar 240px fixed, mobile hamburger + overlay ✓
  - AC-D12.1, D12.3 (responsive) ✓

- [ ] **4.2** All test scenarios from proposal §10 have a test?

- [ ] **4.3** Edge cases covered per proposal §9?
  - User navigates to `/` → redirects to `/dashboard` ✓
  - Mobile backdrop click → closes sidebar ✓
  - Cross-route nav: /todos → Dashboard, /dashboard → Pending ✓

- [ ] **4.4** Run full quality gates:
  ```bash
  npm run build
  npm run lint
  npm run test
  npx commitlint --from HEAD~1
  ```

---

## Tasks Review Checklist

- [ ] Every spec scenario has at least one TEST task?
- [ ] Every phase ends with a build + lint + test checkpoint?
- [ ] Test files to update explicitly listed (TodosPage.test.tsx)?
- [ ] No backend or DB tasks (purely frontend)?
- [ ] No new npm packages installed?
- [ ] Depends on Phases 1–4 (StatsRow, ChartsRow, useDashboardStats all in place)?
