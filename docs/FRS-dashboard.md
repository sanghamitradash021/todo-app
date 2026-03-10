# FRS-dashboard.md — Functional Requirements Specification
# Professional Animated Todo Dashboard

**Feature:** Professional Animated Dashboard UI Redesign
**Scope:** Frontend only — no backend changes required
**API Contract:** Unchanged — all existing endpoints remain as-is
**Base FRS:** Extends FRS.md (all existing requirements remain valid)
**Base SDS:** Extends SDS.md (all existing architecture patterns apply)

---

## 1. Overview

Replace the current flat `TodosPage` with a professional animated dashboard. The dashboard introduces a sidebar layout, summary stat cards, a donut progress chart, priority breakdown bars, and smooth enter/exit animations on every interactive element. The backend API and Zustand stores are untouched.

---

## 2. New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | `^11.x` | All animations — layout, enter/exit, gestures |
| `recharts` | `^2.x` | Donut chart (completion %) + priority bar chart |

No other packages. No backend changes.

---

## 3. Layout Architecture

### 3.1 Top-Level Shell — `DashboardLayout`

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (fixed, 240px)  │  MAIN CONTENT (flex-1)       │
│                           │                              │
│  [Logo + App name]        │  [PageHeader]                │
│                           │  [StatCards row]             │
│  ── Navigation ──         │  [Charts row]                │
│  · Dashboard              │  [FilterBar + Add button]    │
│  · All Todos              │  [AnimatedTodoList]          │
│  · Pending                │                              │
│  · Completed              │                              │
│                           │                              │
│  ── bottom ──             │                              │
│  [UserAvatar + email]     │                              │
│  [Logout button]          │                              │
└─────────────────────────────────────────────────────────┘
```

- Sidebar is **fixed left**, always visible on desktop
- On mobile (< 768px): sidebar collapses to a hamburger menu, slides in as an overlay
- Main content scrolls independently

---

## 4. User Stories & Acceptance Criteria

### US-D01: Stat Cards

**As a** logged-in user
**I want to** see a summary of my todos at a glance
**So that** I can quickly understand my task progress

**Acceptance Criteria:**
- AC-D01.1: Four stat cards are displayed: Total, Pending, Completed, Overdue
- AC-D01.2: Overdue = todos where `due_date < today AND status === 'pending'`
- AC-D01.3: Cards stagger in from bottom on mount (`y: 20 → 0`, `opacity: 0 → 1`), 80ms delay between each
- AC-D01.4: Number values animate from `0` to their real value over 800ms (count-up effect)
- AC-D01.5: On value change (e.g. a todo is toggled), the number re-animates with a brief scale pulse
- AC-D01.6: Cards are responsive — 2×2 grid on mobile, 4×1 row on desktop

**Card specs:**

| Card | Value | Color accent |
|------|-------|-------------|
| Total | `todos.length` | Blue |
| Pending | `todos.filter(pending).length` | Yellow |
| Completed | `todos.filter(completed).length` | Green |
| Overdue | pending todos where `due_date < today` | Red |

---

### US-D02: Completion Donut Chart

**As a** logged-in user
**I want to** see a visual representation of my completion rate
**So that** I feel motivated by my progress

**Acceptance Criteria:**
- AC-D02.1: A donut chart renders showing completed (green) vs pending (yellow) segments
- AC-D02.2: Center of the donut displays the completion percentage (e.g. `"67%"`)
- AC-D02.3: Chart arcs sweep in clockwise over 600ms on mount
- AC-D02.4: On data change, arcs transition smoothly to new values
- AC-D02.5: When `todos.length === 0`, chart shows a single gray ring with `"0%"` in center
- AC-D02.6: Chart is built with `recharts` `<PieChart>`

---

### US-D03: Priority Breakdown Bars

**As a** logged-in user
**I want to** see how my todos are distributed by priority
**So that** I can balance my workload

**Acceptance Criteria:**
- AC-D03.1: Three horizontal progress bars are shown: High, Medium, Low
- AC-D03.2: Each bar displays count and percentage of that priority out of total
- AC-D03.3: Bar fill colors: red (high), blue (medium), gray (low)
- AC-D03.4: Bars grow from `0%` to their real width on mount (600ms, spring easing)
- AC-D03.5: On todo list change, bars transition width smoothly
- AC-D03.6: When total is 0, all bars show `0%`

---

### US-D04: Animated Todo List

**As a** logged-in user
**I want to** see smooth animations when todos are added, removed, or reordered
**So that** the interface feels polished and responsive

**Acceptance Criteria:**
- AC-D04.1: Each `TodoItem` animates in on mount:
  ```
  initial: { opacity: 0, y: 16, scale: 0.97 }
  animate: { opacity: 1, y: 0, scale: 1 }
  transition: spring, stagger 40ms between items
  ```
- AC-D04.2: When a todo is deleted or filtered out, it exits:
  ```
  exit: { opacity: 0, x: -20, height: 0 }
  transition: 200ms ease
  ```
- AC-D04.3: When an item changes position (e.g. toggle re-orders the list), items animate to new positions using `layout` prop
- AC-D04.4: `<AnimatePresence mode="popLayout">` wraps the list so the layout reflows smoothly on removal

---

### US-D05: Enhanced Todo Item Card

**As a** logged-in user
**I want to** see each todo as a well-designed card with visual priority cues
**So that** I can scan my list faster

**Acceptance Criteria:**
- AC-D05.1: Each card has a 4px left color bar indicating priority: red (high), blue (medium), gray (low)
- AC-D05.2: The checkbox uses an animated SVG checkmark (`pathLength: 0 → 1`) when checked
- AC-D05.3: Expanding/collapsing description uses `<AnimatePresence>` with `height: 0 → auto` spring transition
- AC-D05.4: Card hover applies `scale: 1.01` lift with `box-shadow` CSS transition
- AC-D05.5: Completed title gets an animated strikethrough via CSS transition on `text-decoration`
- AC-D05.6: On delete, item exits with slide-left + fade + height collapse before removal from DOM

**Card layout:**
```
┌────────────────────────────────────────────────────────┐
│▌ [Priority bar]                                         │
│                                                         │
│  ☐  Buy groceries                [medium]  [pending]    │
│     Due: 2026-03-15                                     │
│                                                         │
│  ─ ─ ─ ─ (expanded: description text here) ─ ─ ─ ─    │
│                                                         │
│                               [Edit]   [Delete]         │
└────────────────────────────────────────────────────────┘
```

---

### US-D06: Modal Animations

**As a** logged-in user
**I want to** see smooth transitions when modals open and close
**So that** the experience feels fluid

**Acceptance Criteria:**
- AC-D06.1: Backdrop fades in: `opacity: 0 → 1` (200ms)
- AC-D06.2: Modal panel animates in:
  ```
  initial: { opacity: 0, scale: 0.95, y: 10 }
  animate: { opacity: 1, scale: 1, y: 0 }
  exit:    { opacity: 0, scale: 0.95, y: 10 }
  transition: spring, damping: 25
  ```
- AC-D06.3: `<AnimatePresence>` gates mount/unmount for both `TodoModal` and `DeleteConfirmModal`
- AC-D06.4: Clicking the backdrop closes the modal with the exit animation (not instant removal)

---

### US-D07: Toast Animations

**As a** logged-in user
**I want to** see toast notifications slide in and out
**So that** feedback feels natural

**Acceptance Criteria:**
- AC-D07.1: Toast slides in from the right:
  ```
  initial: { opacity: 0, x: 60 }
  animate: { opacity: 1, x: 0 }
  exit:    { opacity: 0, x: 60 }
  transition: spring
  ```
- AC-D07.2: `<AnimatePresence>` wraps the toast list in `ToastContainer`
- AC-D07.3: When a toast auto-dismisses after 3 seconds, it plays the exit animation before removal

---

### US-D08: Sidebar Navigation

**As a** logged-in user
**I want to** navigate and filter todos from a persistent sidebar
**So that** I can switch views without touching the filter dropdowns

**Acceptance Criteria:**
- AC-D08.1: Sidebar contains links: Dashboard, All Todos, Pending, Completed
- AC-D08.2: Clicking Pending sets `filters.status = 'pending'` in `todoStore`
- AC-D08.3: Clicking Completed sets `filters.status = 'completed'` in `todoStore`
- AC-D08.4: Clicking All Todos sets `filters.status = 'all'` in `todoStore`
- AC-D08.5: Active link is highlighted using a `motion.div` with `layoutId="sidebar-active"` that slides smoothly between links
- AC-D08.6: Sidebar bottom section shows the logged-in user's email and a Logout button
- AC-D08.7: On mobile, sidebar is hidden by default; a hamburger button in the top bar opens it as an overlay with a slide-in animation
- AC-D08.8: Sidebar overlay closes when the backdrop is clicked or a nav link is clicked

---

### US-D09: Skeleton Loading State

**As a** logged-in user
**I want to** see skeleton cards while todos are loading
**So that** the page does not feel broken during the initial fetch

**Acceptance Criteria:**
- AC-D09.1: On initial page load while `isLoading === true`, 3 skeleton cards are shown in place of the todo list
- AC-D09.2: Each skeleton card has a shimmer animation (gradient sweep left-to-right, repeating)
- AC-D09.3: Skeleton is NOT shown during filter changes — stale content remains visible while re-fetching
- AC-D09.4: Skeleton cards match the approximate height and layout of a real `TodoItem` card

---

### US-D10: Animated Empty State

**As a** logged-in user
**I want to** see a helpful message with an animation when no todos match the current view
**So that** the empty list does not look like a broken page

**Acceptance Criteria:**
- AC-D10.1: When the filtered list is empty, an empty state component is shown
- AC-D10.2: Empty state animates in: `y: 20 → 0`, `opacity: 0 → 1`
- AC-D10.3: Message is contextual:
  - No filter active: "No todos yet. Add one to get started."
  - Status filter = pending: "No pending todos. Great work!"
  - Status filter = completed: "Nothing completed yet."
- AC-D10.4: A clipboard SVG icon is shown above the message
- AC-D10.5: An "Add Todo" button is shown inside the empty state for the no-filter case

---

### US-D11: Reduced Motion Accessibility

**As a** user who has enabled `prefers-reduced-motion`
**I want** all animations to be instant
**So that** motion does not cause discomfort

**Acceptance Criteria:**
- AC-D11.1: All framer-motion animations check `prefers-reduced-motion` via the `useReducedMotion()` hook
- AC-D11.2: When reduced motion is preferred, all transitions use `duration: 0` and no spring physics
- AC-D11.3: Count-up animations in stat cards are skipped — the final number is rendered immediately
- AC-D11.4: Shimmer skeleton animation is replaced with a static gray fill

---

### US-D12: Responsive Layout

**As a** user on any device
**I want** the dashboard to adapt to my screen size
**So that** it is usable on mobile, tablet, and desktop

**Acceptance Criteria:**
- AC-D12.1: Mobile (< 768px): sidebar hidden, hamburger in top bar, stat cards 2×2 grid, charts stacked vertically
- AC-D12.2: Tablet (768px–1024px): sidebar visible as icon-only (48px); hover expands to full width; charts side-by-side
- AC-D12.3: Desktop (> 1024px): full sidebar (240px), stat cards in a 4-column row, charts side-by-side

---

## 5. Derived State

All computed values are derived from the existing `todos` array in `todoStore`. No new API calls or store modifications.

A new hook `useDashboardStats()` encapsulates the following:

```typescript
// src/frontend/hooks/useDashboardStats.ts
const total        = todos.length
const pending      = todos.filter(t => t.status === 'pending').length
const completed    = todos.filter(t => t.status === 'completed').length
const overdue      = todos.filter(t =>
  t.status === 'pending' &&
  t.due_date !== null &&
  new Date(t.due_date) < startOfToday()
).length
const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100)
const priorityCounts = {
  high:   todos.filter(t => t.priority === 'high').length,
  medium: todos.filter(t => t.priority === 'medium').length,
  low:    todos.filter(t => t.priority === 'low').length,
}
```

Returns: `{ total, pending, completed, overdue, completionPct, priorityCounts }`

---

## 6. Animation Tokens

All animation configuration lives in `src/frontend/config/animations.ts`. No hardcoded durations in component files.

```typescript
// src/frontend/config/animations.ts
export const SPRING_DEFAULT  = { type: 'spring', damping: 25, stiffness: 300 }
export const SPRING_GENTLE   = { type: 'spring', damping: 30, stiffness: 200 }
export const FADE_FAST       = { duration: 0.15 }
export const FADE_NORMAL     = { duration: 0.2 }
export const STAGGER_DELAY   = 0.04   // 40ms between list items
export const STAGGER_CARD    = 0.08   // 80ms between stat cards
export const COUNT_DURATION  = 0.8    // seconds for number count-up
export const BAR_DURATION    = 0.6    // seconds for priority bar grow
```

---

## 7. Component Map

### 7.1 New Components

| Component | Path | Responsibility |
|-----------|------|---------------|
| `DashboardLayout` | `components/layout/DashboardLayout.tsx` | Sidebar + main content shell |
| `Sidebar` | `components/layout/Sidebar.tsx` | Nav links, user info, logout, mobile overlay |
| `StatsRow` | `components/dashboard/StatsRow.tsx` | 4-card responsive row |
| `StatCard` | `components/dashboard/StatCard.tsx` | Single animated counter card |
| `ChartsRow` | `components/dashboard/ChartsRow.tsx` | Donut + priority bars layout |
| `CompletionDonut` | `components/dashboard/CompletionDonut.tsx` | Recharts donut chart |
| `PriorityBars` | `components/dashboard/PriorityBars.tsx` | Animated priority breakdown |
| `AnimatedTodoList` | `components/todos/AnimatedTodoList.tsx` | `AnimatePresence` list wrapper |
| `AnimatedTodoItem` | `components/todos/AnimatedTodoItem.tsx` | Framer-motion enhanced card |
| `SkeletonCard` | `components/todos/SkeletonCard.tsx` | Shimmer loading placeholder |
| `EmptyState` | `components/todos/EmptyState.tsx` | Animated empty list state |
| `useDashboardStats` | `hooks/useDashboardStats.ts` | Derived stat computations |

### 7.2 Modified Components

| Component | Change |
|-----------|--------|
| `TodoModal` | Add framer-motion enter/exit (AC-D06) |
| `DeleteConfirmModal` | Add framer-motion enter/exit (AC-D06) |
| `Toast` | Add slide-in/out animation (AC-D07) |
| `ToastContainer` | Wrap with `<AnimatePresence>` (AC-D07) |
| `TodosPage` | Mount `DashboardLayout`; remove old layout divs; wire stat cards and charts |
| `App.tsx` | Wrap route changes with `<AnimatePresence>` for page transitions |

### 7.3 Unchanged

`useAuth`, `useTodos`, `useToast`, `authStore`, `todoStore`, `uiStore`, `api.ts`, `FilterBar`, `Badge`, `Spinner` (kept as fallback), all backend files.

---

## 8. File Structure (New Files Only)

```
src/frontend/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx
│   ├── dashboard/
│   │   ├── StatsRow.tsx
│   │   ├── StatCard.tsx
│   │   ├── ChartsRow.tsx
│   │   ├── CompletionDonut.tsx
│   │   └── PriorityBars.tsx
│   └── todos/
│       ├── AnimatedTodoList.tsx
│       ├── AnimatedTodoItem.tsx
│       ├── SkeletonCard.tsx
│       └── EmptyState.tsx
├── hooks/
│   └── useDashboardStats.ts
└── config/
    └── animations.ts          ← new (animation token constants)
```

---

## 9. Implementation Phases

### Phase 1 — Animation Foundation
- Install `framer-motion` and `recharts`
- Create `src/frontend/config/animations.ts` with all tokens
- Add enter/exit animations to `Toast`, `ToastContainer`, `TodoModal`, `DeleteConfirmModal`
- Wrap modal mounts in `TodosPage` with `<AnimatePresence>`
- **Quality gate:** build + lint + test pass

### Phase 2 — Animated Todo List
- Build `AnimatedTodoItem` (left color bar, animated checkbox, expand animation, hover lift, exit animation)
- Build `AnimatedTodoList` with `<AnimatePresence mode="popLayout">`
- Build `SkeletonCard` with shimmer
- Build `EmptyState` with contextual messages
- Replace `TodoList` usage in `TodosPage` with `AnimatedTodoList`
- Wire skeleton: show on initial load only
- **Quality gate:** build + lint + test pass

### Phase 3 — Stat Cards
- Build `useDashboardStats` hook
- Build `StatCard` with count-up animation and pulse on change
- Build `StatsRow` with stagger entrance
- Mount `StatsRow` in `TodosPage` above the filter bar
- **Quality gate:** build + lint + test pass

### Phase 4 — Charts
- Build `CompletionDonut` using `recharts`
- Build `PriorityBars` with animated width transitions
- Build `ChartsRow` layout
- Mount `ChartsRow` in `TodosPage` below stat cards
- **Quality gate:** build + lint + test pass

### Phase 5 — Sidebar & Layout Shell
- Build `Sidebar` with animated active indicator (`layoutId="sidebar-active"`)
- Build `DashboardLayout` shell
- Build mobile hamburger + overlay with slide animation
- Restructure `TodosPage` to render inside `DashboardLayout`
- Move user info and logout button from page header to sidebar
- Wire sidebar filter shortcuts to `todoStore.setFilters`
- **Quality gate:** build + lint + test pass

### Phase 6 — Polish & Accessibility
- Implement `useReducedMotion()` guard across all animated components
- Replace skeleton shimmer with static fill when reduced motion is active
- Add `aria-live="polite"` to stat card numbers
- Add `aria-current="page"` to active sidebar link
- Audit focus management in modals
- Full responsive QA: mobile, tablet, desktop
- **Quality gate:** build + lint + test pass

---

## 10. Quality Gates (Non-Negotiable)

After every phase:
```bash
npm run build    # 0 TypeScript errors, 0 warnings
npm run lint     # 0 ESLint errors
npm run test     # all tests green
```

Before every commit:
```bash
npx commitlint --from HEAD~1
```

Valid commit scopes for this feature: `frontend`, `dx`

Example commits:
```
feat(frontend): add framer-motion animation tokens and modal transitions
feat(frontend): implement animated todo list with enter/exit animations
feat(frontend): add dashboard stat cards with count-up animation
feat(frontend): add completion donut and priority breakdown charts
feat(frontend): add sidebar layout with animated active indicator
feat(frontend): add reduced-motion accessibility guard
```

---

## 11. Out of Scope

- Drag-and-drop reordering (no `sort_order` field in DB)
- Dark mode
- Real-time updates (WebSocket / polling)
- Any backend changes
- New API endpoints
- Pagination
- Route-level page transition animations (nice-to-have, deferred)
