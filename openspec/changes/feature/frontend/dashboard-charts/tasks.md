# Tasks: feature/frontend/dashboard-charts

**Branch:** `feature/frontend/dashboard-charts`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-10

---

## Phase 1: Chart Components

- [ ] **1.1** Create `src/frontend/components/dashboard/CompletionDonut.tsx`
  - Props: `completionPct`, `completed`, `pending`, `total`
  - Use recharts `<PieChart width={180} height={180}>` with single `<Pie>` (donut shape via `innerRadius`/`outerRadius`)
  - Normal: two segments — Completed (`#16a34a`) + Pending (`#ca8a04`)
  - Empty state (`total === 0`): single gray segment (`#e5e7eb`)
  - Arc animation: `<Pie animationBegin={0} animationDuration={600}>`
  - Center label: absolutely positioned `<div>` with `inset-0 flex items-center justify-center` showing `"{completionPct}%"` in bold
  - No tooltip, no legend (not in FRS)

- [ ] **1.2** Create `src/frontend/components/dashboard/PriorityBars.tsx`
  - Props: `priorityCounts: { high, medium, low }`, `total`
  - Renders three rows in order: High → Medium → Low
  - Per row: priority label, count, percentage (`total === 0 ? 0 : Math.round(count/total * 100)`), animated bar
  - Bar: `motion.div` with `initial={{ width: '0%' }}`, `animate={{ width: '{pct}%' }}`, `transition={{ duration: BAR_DURATION, ease: 'easeOut' }}`
  - Bar colors: High = `bg-red-500`, Medium = `bg-blue-500`, Low = `bg-gray-400`
  - Track: `bg-gray-100 rounded-full`, bar height: `h-2 rounded-full`
  - Empty state: all bars animate to `width: '0%'` when `total === 0`

- [ ] **1.3** Create `src/frontend/components/dashboard/ChartsRow.tsx`
  - Props: `stats: DashboardStats`
  - Layout: `flex flex-col md:flex-row gap-6 mb-6`
  - Renders `<CompletionDonut>` and `<PriorityBars>` each in a `bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5` card
  - PriorityBars card has `flex-1` to fill remaining horizontal space
  - When `stats.isStatsLoading` on initial mount: render skeleton placeholder divs matching card dimensions with `animate-pulse`

- [ ] **1.4** Create `src/frontend/components/dashboard/CompletionDonut.test.tsx`
  - Test: renders without crashing with valid props
  - Test: displays `"0%"` center label when `total === 0`
  - Test: displays correct `completionPct` in center label for non-zero total
  - Test: renders gray segment (`#e5e7eb`) when `total === 0`

- [ ] **1.5** Create `src/frontend/components/dashboard/PriorityBars.test.tsx`
  - Test: renders all three priority labels ("High", "Medium", "Low")
  - Test: displays correct count for each priority
  - Test: displays "0%" for all priorities when `total === 0`
  - Test: percentage calculation rounds correctly (e.g. 1/3 → "33%")

- [ ] **1.6** Create `src/frontend/components/dashboard/ChartsRow.test.tsx`
  - Test: renders CompletionDonut section (donut or skeleton)
  - Test: renders PriorityBars section (bars or skeleton)
  - Test: renders skeleton placeholders when `stats.isStatsLoading` is `true`
  - Test: renders real components when `stats.isStatsLoading` is `false`

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 2: Page Integration

- [ ] **2.1** Modify `src/frontend/pages/TodosPage.tsx`
  - Import `ChartsRow` from `../components/dashboard/ChartsRow`
  - Mount `<ChartsRow stats={stats} />` immediately below `<StatsRow stats={stats} />`
  - Final layout order: `[Header] → [StatsRow] → [ChartsRow] → [FilterBar + Add Todo] → [AnimatedTodoList]`
  - `stats` is already in scope from Phase 3's `useDashboardStats()` call

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## Phase 3: Final Verification

- [ ] **3.1** All AC from proposal §8 covered?
  - AC-D02.1 → AC-D02.6 (CompletionDonut) all implemented
  - AC-D03.1 → AC-D03.6 (PriorityBars) all implemented
  - AC-D12.1, D12.2/3 (responsive layout) implemented in ChartsRow ✓
  - Edge cases: empty state, all-completed, zero-priority ✓

- [ ] **3.2** All test scenarios from proposal §10 have a test?

- [ ] **3.3** Run full quality gates:
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
- [ ] Depends on Phase 3 (`DashboardStats` type + `useDashboardStats` hook) being in place?
