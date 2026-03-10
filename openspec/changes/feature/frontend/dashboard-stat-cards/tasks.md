# Tasks: feature/frontend/dashboard-stat-cards

**Branch:** `feature/frontend/dashboard-stat-cards`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-10

---

## Phase 1: Utility + Hook

- [ ] **1.1** Create `src/frontend/utils/date.ts`
  - Export `startOfToday(): Date` — sets hours/minutes/seconds/ms to 0 on current date
  - Pure function, no imports

- [ ] **1.2** Create `src/frontend/hooks/useDashboardStats.ts`
  - Define and export `DashboardStats` interface: `total`, `pending`, `completed`, `overdue`, `completionPct`, `priorityCounts`, `isStatsLoading`
  - Maintains local `allTodos: Todo[]` state (initialised `[]`)
  - On mount: fetch `GET /api/todos` (no params) via `api` Axios instance; set `isStatsLoading` during fetch
  - Watch `useTodoStore(state => state.todos)` via `useEffect` — re-fetch on change
  - Derive all stats from `allTodos` using exact formulas from proposal §7.2
  - On error: `logger.error(...)`, return to `isStatsLoading: false`, keep stale stats visible (no toast)
  - Return `DashboardStats` object

- [ ] **1.3** Create `src/frontend/utils/date.test.ts`
  - Test: `startOfToday()` returns a Date object
  - Test: returned Date has hours = 0, minutes = 0, seconds = 0, ms = 0
  - Test: returned Date year/month/day matches `new Date()`

- [ ] **1.4** Create `src/frontend/hooks/useDashboardStats.test.ts`
  - Mock `api` via `vi.mock('../utils/api')`
  - Test: returns correct `total`, `pending`, `completed` counts for mixed dataset
  - Test: `overdue` excludes completed todos (only `pending` with `due_date < today`)
  - Test: `overdue` excludes todos with `due_date === null`
  - Test: `completionPct` rounds correctly (e.g. 1/3 → 33)
  - Test: `completionPct` is `0` when `total === 0` (no division by zero)
  - Test: `priorityCounts` sums correctly per priority level

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 2: Components

- [ ] **2.1** Create `src/frontend/components/dashboard/StatCard.tsx`
  - Props: `label: string`, `value: number`, `accent: 'blue' | 'yellow' | 'green' | 'red'`
  - Card entrance: `motion.div` with `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
  - Count-up: `useMotionValue` + framer-motion `animate()` animates old → new value over `COUNT_DURATION` on every `value` change
  - Scale pulse on value change: separate `scaleMotionValue` triggers `[1, 1.15, 1]` pulse (skip on mount)
  - Number `<span>` has `aria-live="polite"` (AC-D01 accessibility)
  - Accent → Tailwind class map per plan §6

- [ ] **2.2** Create `src/frontend/components/dashboard/StatsRow.tsx`
  - Props: `stats: DashboardStats`
  - Renders 4 `<StatCard>` in order: Total (blue), Pending (yellow), Completed (green), Overdue (red)
  - Each card wrapped in `motion.div` with stagger delay: `index * STAGGER_CARD`
  - Grid: `grid grid-cols-2 md:grid-cols-4 gap-4`
  - When `stats.isStatsLoading` on initial mount: renders 4 skeleton placeholder `<div>`s with `animate-pulse` matching StatCard dimensions

- [ ] **2.3** Create `src/frontend/components/dashboard/StatCard.test.tsx`
  - Test: renders the `label` string
  - Test: renders the `value` number
  - Test: applies correct accent bg class (e.g. `bg-blue-50` for `accent="blue"`)
  - Test: number element has `aria-live="polite"`

- [ ] **2.4** Create `src/frontend/components/dashboard/StatsRow.test.tsx`
  - Test: renders all four stat card labels ("Total", "Pending", "Completed", "Overdue")
  - Test: passes correct `value` to each card
  - Test: renders 4 skeleton placeholders when `isStatsLoading` is `true`
  - Test: renders real cards (not skeletons) when `isStatsLoading` is `false`

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 3: Page Integration

- [ ] **3.1** Modify `src/frontend/pages/TodosPage.tsx`
  - Import `useDashboardStats` and `StatsRow`
  - Call `useDashboardStats()` at top of component
  - Mount `<StatsRow stats={stats} />` between the header section and the FilterBar + Add Todo controls
  - Layout order: `[Header] → [StatsRow] → [FilterBar + Add Todo] → [AnimatedTodoList]`

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 4: Final Verification

- [ ] **4.1** All AC from proposal §8 covered?
  - AC-D01.1 → AC-D01.6 all implemented
  - Stats source: full unfiltered fetch ✓
  - Reactivity: re-fetch on `todoStore.todos` change ✓
  - Error scenarios: silent failure + stale stats ✓

- [ ] **4.2** All test scenarios from proposal §10 have a test?

- [ ] **4.3** Run full quality gates:
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
- [ ] No backend or DB tasks (purely frontend)?
- [ ] No new npm packages installed?
