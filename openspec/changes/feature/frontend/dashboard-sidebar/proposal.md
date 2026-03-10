# Spec Proposal — Phase 5: Sidebar & Layout Shell
**Feature:** Professional Animated Dashboard — Phase 5 only
**Scope:** Frontend only. No backend changes. No new packages.
**Base FRS:** `docs/FRS-dashboard.md` §3 Layout Architecture, US-D08 (AC-D08.1–D08.8), AC-D12.1/D12.3
**Depends on:** Phases 1–4 (all components and hooks in place)

---

## 1. Business Intent

Introduce a persistent sidebar shell that:
1. Provides persistent navigation to a dedicated **Dashboard** view (stats + charts) and **filtered Todo** views (All, Pending, Completed)
2. Centralises user info and logout in one place
3. Gives mobile users a slide-in overlay drawer via a hamburger button

This phase is architecturally the most significant change: a new `/dashboard` route, a new `DashboardPage`, a shared `DashboardLayout` shell wrapping all protected routes, and a slimmed-down `TodosPage` that focuses only on the task list.

Relevant FRS sections: §3 (layout), US-D08 (AC-D08.1–D08.8), AC-D12.1/D12.3.

---

## 2. Decisions Made (Clarifications Resolved)

| # | Question | Decision |
|---|----------|----------|
| Q1 | "Dashboard" link | Navigates to `/dashboard` route. Active state = path match (`/dashboard`). |
| Q2 | DashboardLayout integration | Wraps **all** protected routes in `App.tsx` via `<Outlet>`. DashboardLayout = sidebar + content area. |
| Q3 | Tablet icon-only sidebar | **Deferred to Phase 6.** Phase 5 = desktop full sidebar + mobile hamburger overlay only. |
| Q4 | Mobile hamburger placement | **Left** of mobile top bar, before page title. Logout + user info move to sidebar bottom. |
| Q5 | Sidebar branding | Clipboard SVG icon + **"Todo App"** text. |

---

## 3. Route Changes

| Before | After | Notes |
|--------|-------|-------|
| `/` → redirect `/todos` | `/` → redirect `/dashboard` | New default landing page |
| `/todos` → `TodosPage` | `/todos` → `TodosPage` (slimmed) | Wrapped inside DashboardLayout |
| _(none)_ | `/dashboard` → `DashboardPage` | **New route** |

All protected routes render inside `<DashboardLayout>` via `<Outlet>`.

---

## 4. In-Scope

**New files:**
- `src/frontend/components/layout/DashboardLayout.tsx` — sidebar + mobile top bar + `<Outlet>`
- `src/frontend/components/layout/Sidebar.tsx` — nav links, animated active indicator, user info, logout, mobile overlay
- `src/frontend/pages/DashboardPage.tsx` — stats cards + charts (content moved from TodosPage)
- `src/frontend/components/layout/Sidebar.test.tsx`
- `src/frontend/components/layout/DashboardLayout.test.tsx`
- `src/frontend/pages/DashboardPage.test.tsx`

**Modified files:**
- `src/frontend/App.tsx` — add `/dashboard` route, wrap protected routes with `DashboardLayout`
- `src/frontend/pages/TodosPage.tsx` — remove `StatsRow`, `ChartsRow`, `useDashboardStats`, user header div (moved to sidebar + DashboardPage)
- `src/frontend/pages/TodosPage.test.tsx` — update to reflect slimmed page

---

## 5. Out of Scope

- Tablet icon-only hover-expand sidebar (Phase 6)
- `prefers-reduced-motion` guard (Phase 6)
- `aria-current="page"` on active sidebar link (Phase 6)
- Dark mode
- Any backend changes
- Route-level page transition animations (FRS §11 deferred)

---

## 6. Architecture

### 6.1 App.tsx Route Tree (after Phase 5)

```
<BrowserRouter>
  <Routes>
    <Route path="/"         element={<Navigate to="/dashboard" replace />} />
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>          ← NEW shell
        <Route path="/dashboard" element={<DashboardPage />} />   ← NEW
        <Route path="/todos"     element={<TodosPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

### 6.2 DashboardLayout Structure

```
DashboardLayout
├── <Sidebar />                      ← desktop: fixed left 240px
│     ├── Logo + "Todo App"
│     ├── Nav links (Dashboard, All Todos, Pending, Completed)
│     │     └── layoutId="sidebar-active" indicator
│     └── Bottom: user email + Logout
│
├── Mobile top bar (md:hidden)       ← only on mobile
│     ├── [☰ hamburger] opens overlay
│     └── [Page title from route]
│
└── Main content area (flex-1, overflow-y-auto)
      └── <Outlet />                 ← DashboardPage or TodosPage renders here
```

Mobile sidebar renders as `<AnimatePresence>` overlay with:
- Backdrop: `motion.div` `opacity: 0 → 0.4` (dark overlay)
- Drawer: `motion.div` `x: '-100%' → 0` (slides from left)

### 6.3 Content Split

| Before Phase 5 (TodosPage) | After Phase 5 |
|---------------------------|---------------|
| Header + user email + logout | Moved to Sidebar bottom (AC-D08.6) |
| StatsRow | Moved to DashboardPage |
| ChartsRow | Moved to DashboardPage |
| FilterBar + Add Todo | Stays in TodosPage |
| AnimatedTodoList + modals | Stays in TodosPage |
| useDashboardStats | Moved to DashboardPage |

---

## 7. File Specifications

### 7.1 `src/frontend/components/layout/Sidebar.tsx`

**Props:**
```typescript
interface SidebarProps {
  isOpen:   boolean;          // mobile overlay state
  onClose:  () => void;       // close mobile overlay
  onLogout: () => void;       // logout callback
  email:    string | null;    // logged-in user email
}
```

**Nav links:**
```typescript
const NAV_LINKS = [
  { label: 'Dashboard',  to: '/dashboard', statusFilter: null              },
  { label: 'All Todos',  to: '/todos',     statusFilter: 'all' as const   },
  { label: 'Pending',    to: '/todos',     statusFilter: 'pending' as const },
  { label: 'Completed',  to: '/todos',     statusFilter: 'completed' as const },
];
```

**Active state logic:**
- "Dashboard" → active when `location.pathname === '/dashboard'`
- "All Todos" → active when `pathname === '/todos' && filters.status === 'all'`
- "Pending"   → active when `pathname === '/todos' && filters.status === 'pending'`
- "Completed" → active when `pathname === '/todos' && filters.status === 'completed'`

**Animated active indicator (AC-D08.5):**
Each link is wrapped `position: relative`. When `isActive`, renders a `motion.div` with `layoutId="sidebar-active"` absolutely positioned behind the link text. framer-motion animates the indicator sliding between link positions when the active link changes.

**Link click behaviour (AC-D08.2–D08.4):**
- If link has `statusFilter !== null` → calls `setFilters({ status: statusFilter })` + navigates to `/todos`
- If link is "Dashboard" → navigates to `/dashboard` (no filter mutation)
- On mobile: calls `onClose()` after any link click (AC-D08.8)

**Mobile overlay (AC-D08.7/D08.8):**
- Sidebar component renders **two** layouts depending on screen size:
  - Desktop (`hidden md:flex`): fixed sidebar column
  - Mobile: conditionally rendered overlay via `AnimatePresence`
- Backdrop click → `onClose()` (AC-D08.8)

**Sidebar branding:**
Clipboard SVG icon (reuse from EmptyState) + `<span>Todo App</span>` in bold.

**Bottom section (AC-D08.6):**
- User email (truncated with `truncate` class if long)
- Logout button

---

### 7.2 `src/frontend/components/layout/DashboardLayout.tsx`

**Props:** none (reads from Router `<Outlet>`)

**Internal state:**
```typescript
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
```

**Mobile top bar (rendered only on `md:hidden`):**
- Left: hamburger `<button>` (`☰` or SVG) that sets `isSidebarOpen(true)`
- Centre: page title derived from current pathname:
  ```typescript
  const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/todos':     'My Todos',
  };
  ```

**Reads from stores:**
- `useAuthStore` → `user.email` passed to `<Sidebar email={...} />`
- `useAuth` → `logout` passed to `<Sidebar onLogout={...} />`
- `useTodoStore` → `setFilters` passed down via Sidebar props

**Layout structure:**
```tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar
    isOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
    onLogout={logout}
    email={user?.email ?? null}
  />

  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Mobile top bar */}
    <header className="md:hidden ...">
      <button onClick={() => setIsSidebarOpen(true)}>☰</button>
      <span>{pageTitle}</span>
    </header>

    {/* Page content */}
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
      <Outlet />
    </main>
  </div>
</div>
```

---

### 7.3 `src/frontend/pages/DashboardPage.tsx` (new)

**Content:** Stats + Charts (moved from TodosPage).

```tsx
function DashboardPage() {
  const stats = useDashboardStats();
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 hidden md:block">Dashboard</h1>
      <StatsRow stats={stats} />
      <ChartsRow stats={stats} />
    </div>
  );
}
```

(The mobile title "Dashboard" is shown in the DashboardLayout top bar, so the `h1` is hidden on mobile with `hidden md:block`.)

---

### 7.4 `src/frontend/pages/TodosPage.tsx` (slimmed)

Remove: `useDashboardStats`, `StatsRow`, `ChartsRow`, header `<div>` with email + logout.

Retain: `FilterBar`, `Add Todo` button, `AnimatedTodoList`, all modals, `ToastContainer`, `isInitialLoad` tracking.

Add: `hidden md:block` on the `<h1>My Todos</h1>` heading (mobile title is in the DashboardLayout top bar).

---

## 8. Acceptance Criteria

| AC | Requirement | Implementation |
|----|-------------|----------------|
| AC-D08.1 | Sidebar has: Dashboard, All Todos, Pending, Completed links | `NAV_LINKS` array in `Sidebar` |
| AC-D08.2 | Clicking Pending → `filters.status = 'pending'` | `setFilters({ status: 'pending' })` + navigate `/todos` |
| AC-D08.3 | Clicking Completed → `filters.status = 'completed'` | `setFilters({ status: 'completed' })` + navigate `/todos` |
| AC-D08.4 | Clicking All Todos → `filters.status = 'all'` | `setFilters({ status: 'all' })` + navigate `/todos` |
| AC-D08.5 | Active link has sliding `layoutId="sidebar-active"` indicator | `motion.div layoutId="sidebar-active"` inside each active link |
| AC-D08.6 | Sidebar bottom: user email + Logout | Bottom section in `Sidebar` |
| AC-D08.7 | Mobile: hamburger opens slide-in overlay | `AnimatePresence` + `motion.div x: '-100%' → 0` |
| AC-D08.8 | Overlay closes on backdrop click or nav link click | `onClose()` in backdrop click + link click handlers |
| Route | `/dashboard` renders DashboardPage | `App.tsx` route tree change |
| Route | `/` redirects to `/dashboard` | `<Navigate to="/dashboard" />` |
| Layout | Desktop: sidebar 240px fixed left | `w-60 hidden md:flex flex-col fixed inset-y-0` |
| Layout | Mobile: no sidebar by default, hamburger top-left | `md:hidden` top bar |
| AC-D12.1 | Mobile: sidebar hidden by default | `hidden md:flex` on desktop sidebar |
| AC-D12.3 | Desktop: full 240px sidebar | `w-60` fixed |

---

## 9. Edge / Error Scenarios

| Scenario | Behaviour |
|----------|-----------|
| User navigates to `/` | Redirected to `/dashboard` |
| User opens mobile sidebar, clicks backdrop | Sidebar closes with slide-out animation |
| User on `/todos` clicks Dashboard sidebar link | Navigates to `/dashboard`; no filter mutation |
| User on `/dashboard` clicks Pending | `setFilters({ status: 'pending' })` + navigate to `/todos` |
| User refreshes on `/dashboard` | Protected route guards apply; if authenticated, DashboardPage loads |
| Mobile sidebar open, user clicks nav link | Link action executes + sidebar closes (AC-D08.8) |

---

## 10. Test Plan

| File | Scenarios |
|------|-----------|
| `Sidebar.test.tsx` | Renders all four nav links; clicking Pending calls setFilters + navigate; clicking All Todos calls setFilters; clicking Dashboard navigates to /dashboard (no setFilters); Logout button calls onLogout; email displayed; mobile overlay: onClose called on backdrop click; nav link click calls onClose |
| `DashboardLayout.test.tsx` | Renders Outlet content; mobile top bar hidden on desktop (class check); renders hamburger button; hamburger opens sidebar |
| `DashboardPage.test.tsx` | Renders StatsRow (checks loading stat cards); renders ChartsRow (checks loading chart skeleton) |

---

## 11. Tests to Update

| File | Change Required |
|------|----------------|
| `TodosPage.test.tsx` | Remove test expecting `StatsRow` / spinner; update snapshot/assertions to reflect slimmed page (no stat card labels, no chart section) |

---

## 12. Spec Review Checklist

- [x] Every FRS AC (AC-D08.1–D08.8) has a matching implementation entry
- [x] Route changes documented (new `/dashboard`, redirect `/` → `/dashboard`)
- [x] Edge cases: backdrop close, link-then-close, cross-route navigation
- [x] No new packages or backend changes
- [x] Tablet icon-only sidebar explicitly marked as out of scope (deferred)
- [x] Out-of-scope section exists
