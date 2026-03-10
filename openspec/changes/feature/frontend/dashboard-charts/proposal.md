# Spec Proposal — Phase 4: Charts
**Feature:** Professional Animated Dashboard — Phase 4 only
**Scope:** Frontend only. No backend changes. No new packages beyond already-installed recharts + framer-motion.
**Base FRS:** `docs/FRS-dashboard.md` US-D02, US-D03, AC-D12.1–D12.3 (responsive)
**Depends on:** Phase 3 (useDashboardStats hook + DashboardStats type in place)

---

## 1. Business Intent

Provide two visual representations of the user's todo workload:

1. **Completion Donut** — motivates users by showing progress as a percentage ring (completed vs pending)
2. **Priority Breakdown** — helps users balance workload by showing how many todos fall into each priority level

Both charts draw from the same full-unfiltered dataset already fetched by `useDashboardStats()`. Stats are computed once in `TodosPage` and passed down via props to avoid duplicate hook execution.

Relevant FRS sections: US-D02 (AC-D02.1 – AC-D02.6), US-D03 (AC-D03.1 – AC-D03.6), AC-D12.1–D12.3.

---

## 2. Decisions Made (Clarifications Resolved)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Data source | Props flow: `TodosPage` → `ChartsRow` → child charts. Stats calculated once in `useDashboardStats()`. |
| Q2 | Donut animation | recharts built-in `<Pie animationBegin animationDuration>` for arc sweep. No framer-motion for SVG arcs. |
| Q3 | Center label | Absolutely positioned `<div>` overlay centered in the chart container. Full CSS control. |
| Q4 | Priority bars | Custom `motion.div` bars with animated `width`. Not a recharts component. |
| Q5 | ChartsRow responsive | Full `flex-col md:flex-row` layout implemented now. Works correctly before and after Phase 5 sidebar. |

---

## 3. In-Scope

- `src/frontend/components/dashboard/CompletionDonut.tsx` — recharts PieChart + absolute overlay label
- `src/frontend/components/dashboard/PriorityBars.tsx` — framer-motion animated progress bars
- `src/frontend/components/dashboard/ChartsRow.tsx` — responsive layout wrapper
- `src/frontend/pages/TodosPage.tsx` — mount `<ChartsRow>` below `<StatsRow>`
- Unit tests for every new file

---

## 4. Out of Scope

- Sidebar / layout shell (Phase 5)
- Reduced-motion guard (Phase 6)
- Dark mode
- Any backend changes
- Tooltips on chart segments (not in FRS)
- Legend component (not specified in FRS)
- recharts `<BarChart>` for priority (replaced by custom motion bars per Q4)

---

## 5. API Contract

No API changes. Charts consume `DashboardStats` passed via props. The underlying data comes from the existing `GET /api/todos` (no params) call already established in Phase 3's `useDashboardStats()`.

---

## 6. Data Flow

```
TodosPage
  └─ useDashboardStats()  →  stats: DashboardStats
       │
       ├─ <StatsRow stats={stats} />          (Phase 3)
       │
       └─ <ChartsRow stats={stats} />         (Phase 4 — NEW)
               ├─ <CompletionDonut completionPct={stats.completionPct}
               │                   completed={stats.completed}
               │                   pending={stats.pending}
               │                   total={stats.total} />
               │
               └─ <PriorityBars priorityCounts={stats.priorityCounts}
                                total={stats.total} />
```

---

## 7. File Specifications

### 7.1 `src/frontend/components/dashboard/CompletionDonut.tsx`

**Props:**
```typescript
interface CompletionDonutProps {
  completionPct: number;   // 0–100, already rounded
  completed:     number;
  pending:       number;
  total:         number;
}
```

**Behaviour:**

- Uses recharts `<PieChart>` with a single `<Pie>` configured as a donut (`innerRadius`, `outerRadius`).
- Two segments:
  - Completed: fill `#16a34a` (green-600)
  - Pending: fill `#ca8a04` (yellow-600)
- Empty state (AC-D02.5): when `total === 0`, renders a single gray segment (`#e5e7eb`, gray-200) filling the ring with `"0%"` label.
- **Arc sweep animation (AC-D02.3):** `animationBegin={0}` and `animationDuration={600}` on `<Pie>`. recharts animates arcs clockwise on mount.
- **Data-change transition (AC-D02.4):** recharts re-animates automatically when `data` prop changes (built-in behaviour, no extra code needed).
- **Center label (AC-D02.2):** The `<PieChart>` wrapper `<div>` has `position: relative`. An absolutely positioned child `<div>` is centered using `inset-0 flex items-center justify-center` — displays `"{completionPct}%"` in bold.
- Chart dimensions: fixed `width={180}` `height={180}` on `<PieChart>`. Container div uses `mx-auto`.

**Recharts data array:**
```typescript
// empty state
const emptyData = [{ value: 1, fill: '#e5e7eb' }]

// normal state
const data = [
  { name: 'Completed', value: completed, fill: '#16a34a' },
  { name: 'Pending',   value: pending,   fill: '#ca8a04' },
]
// guard: if both are 0 but total > 0 (shouldn't occur), fall back to emptyData
```

**No recharts tooltip, no legend** (not in FRS).

---

### 7.2 `src/frontend/components/dashboard/PriorityBars.tsx`

**Props:**
```typescript
interface PriorityBarsProps {
  priorityCounts: { high: number; medium: number; low: number };
  total:          number;
}
```

**Behaviour:**

- Renders three rows in order: High → Medium → Low.
- Each row shows:
  - Priority label (e.g. "High")
  - Count (e.g. "3")
  - Percentage (e.g. "30%") — `total === 0 ? 0 : Math.round((count / total) * 100)`
  - `motion.div` fill bar
- **Mount animation (AC-D03.4):** `initial={{ width: '0%' }}`, `animate={{ width: '{pct}%' }}`, `transition={{ duration: BAR_DURATION, ease: 'easeOut' }}`. (`BAR_DURATION = 0.6` from `animations.ts`)
- **Data-change animation (AC-D03.5):** `animate={{ width: '{pct}%' }}` — framer-motion transitions to new width whenever `pct` changes.
- **Empty state (AC-D03.6):** when `total === 0`, all bars animate to `width: '0%'`.
- Bar fill colors (AC-D03.3):
  - High: `bg-red-500`
  - Medium: `bg-blue-500`
  - Low: `bg-gray-400`
- Track (background of bar): `bg-gray-100 rounded-full`
- Bar height: `h-2 rounded-full`

**Row layout:**
```
[High]   3  ████░░░░░░░░░  30%
[Medium] 5  ████████░░░░░  50%
[Low]    2  ████░░░░░░░░░  20%
```

---

### 7.3 `src/frontend/components/dashboard/ChartsRow.tsx`

**Props:**
```typescript
interface ChartsRowProps {
  stats: DashboardStats;
}
```

**Behaviour:**

- Renders `CompletionDonut` and `PriorityBars` side-by-side on tablet+ and stacked on mobile (AC-D12.1–D12.3).
- Layout: `flex flex-col md:flex-row gap-6 mb-6`
- Each chart is wrapped in a `bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5` card.
- `CompletionDonut` card: fixed-width label + chart centred.
- `PriorityBars` card: `flex-1` fills remaining space.

---

### 7.4 `src/frontend/pages/TodosPage.tsx` (modification)

Mount `<ChartsRow>` between `<StatsRow>` and the filter controls:

```
[Header]
[StatsRow]      (Phase 3)
[ChartsRow]     (Phase 4 — NEW)
[FilterBar + Add Todo button]
[AnimatedTodoList]
```

Pass `stats` (already in scope from Phase 3) to `ChartsRow`.

---

## 8. Acceptance Criteria

| AC | Requirement | Implementation |
|----|-------------|----------------|
| AC-D02.1 | Donut shows completed (green) + pending (yellow) segments | recharts `<Pie>` with two data entries, hard-coded fills |
| AC-D02.2 | Center displays completion percentage | Absolute `<div>` overlay: `"{completionPct}%"` |
| AC-D02.3 | Arcs sweep clockwise 600ms on mount | `<Pie animationBegin={0} animationDuration={600}>` |
| AC-D02.4 | On data change, arcs transition smoothly | recharts built-in re-animation on `data` prop change |
| AC-D02.5 | Empty state: single gray ring + "0%" | `total === 0` → single gray segment; center label shows "0%" |
| AC-D02.6 | Built with recharts `<PieChart>` | `import { PieChart, Pie, Cell } from 'recharts'` |
| AC-D03.1 | Three rows: High, Medium, Low | Three `PriorityBar` rows rendered in order |
| AC-D03.2 | Each bar shows count + percentage | Count and `Math.round(count/total * 100)%` rendered per row |
| AC-D03.3 | Colors: red (high), blue (medium), gray (low) | Tailwind classes `bg-red-500` / `bg-blue-500` / `bg-gray-400` |
| AC-D03.4 | Bars grow 0% → real width on mount, 600ms spring | `initial={{ width:'0%' }}`, `animate={{ width:'{pct}%' }}`, `BAR_DURATION` |
| AC-D03.5 | On list change, bars transition smoothly | `animate={{ width }}` re-runs on `pct` change via framer-motion |
| AC-D03.6 | When total is 0, all bars show 0% | `pct = 0` when `total === 0` → bars animate to `width: '0%'` |
| AC-D12.1 | Mobile: charts stacked vertically | `flex-col` (default) |
| AC-D12.2/3 | Tablet+: charts side-by-side | `md:flex-row` |

---

## 9. Error / Edge-Case Scenarios

| Scenario | Behaviour |
|----------|-----------|
| `total === 0` (no todos) | Donut: gray ring + "0%". Bars: all at 0%. No crash. |
| All todos completed | Donut: full green ring + "100%". Bars reflect counts normally. |
| All todos pending | Donut: full yellow ring + "0%". Bars reflect counts normally. |
| One priority has 0 todos | That bar shows count=0, percentage=0%, width=0% |
| Stats still loading | `ChartsRow` renders with `isStatsLoading` state — show skeleton placeholders matching card dimensions |

---

## 10. Test Plan

| File | Scenarios |
|------|-----------|
| `CompletionDonut.test.tsx` | Renders without crashing; shows "0%" when total=0; shows correct pct label; renders gray segment when total=0 |
| `PriorityBars.test.tsx` | Renders all three priority labels; shows correct count per priority; shows "0%" for all when total=0; percentage rounds correctly |
| `ChartsRow.test.tsx` | Renders both CompletionDonut and PriorityBars sections; renders skeleton when isStatsLoading=true |

---

## 11. Spec Review Checklist

- [x] Every FRS AC (AC-D02.1–D02.6, AC-D03.1–D03.6) has a matching scenario
- [x] Every edge case (empty state, all-completed, zero priority) has a scenario
- [x] No new API calls — uses existing `DashboardStats` props
- [x] No invented business rules — percentage formula identical to FRS §5 `priorityCounts`
- [x] Out-of-scope section exists
