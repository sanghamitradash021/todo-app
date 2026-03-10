# Plan: feature/frontend/dashboard-charts

**Branch:** `feature/frontend/dashboard-charts`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-10

---

## 1. Existing Code to Reuse (No Duplication)

| Existing | Location | Reuse |
|----------|----------|-------|
| `DashboardStats` interface | `src/frontend/hooks/useDashboardStats.ts` | Import and pass via props — no re-derivation |
| `useDashboardStats` | `src/frontend/hooks/useDashboardStats.ts` | Called once in `TodosPage`; `stats` passed down to both `StatsRow` and `ChartsRow` |
| `ANIMATION_TOKENS` / `animations.ts` | `src/frontend/config/animations.ts` | `BAR_DURATION` (0.6s) for priority bar motion |
| framer-motion | already installed | `motion.div` for animated priority bars |
| recharts | already installed | `PieChart`, `Pie`, `Cell` for completion donut |

---

## 2. New Types Needed

None. All types flow from the existing `DashboardStats` interface (Phase 3). Three local prop interfaces defined inline in their respective files:

```typescript
// CompletionDonut.tsx
interface CompletionDonutProps {
  completionPct: number;
  completed:     number;
  pending:       number;
  total:         number;
}

// PriorityBars.tsx
interface PriorityBarsProps {
  priorityCounts: { high: number; medium: number; low: number };
  total:          number;
}

// ChartsRow.tsx
interface ChartsRowProps {
  stats: DashboardStats;
}
```

---

## 3. Exact File Paths

### Create (new files)
```
src/frontend/components/dashboard/CompletionDonut.tsx
src/frontend/components/dashboard/PriorityBars.tsx
src/frontend/components/dashboard/ChartsRow.tsx
```

### Modify (existing files)
```
src/frontend/pages/TodosPage.tsx   — mount <ChartsRow> below <StatsRow>
```

### Test files
```
src/frontend/components/dashboard/CompletionDonut.test.tsx
src/frontend/components/dashboard/PriorityBars.test.tsx
src/frontend/components/dashboard/ChartsRow.test.tsx
```

---

## 4. Architecture Decisions

### A1 — Props-down data flow; no duplicate hook call
`TodosPage` already calls `useDashboardStats()` (from Phase 3). `ChartsRow` receives `stats` as props. No second call to the hook.

**Reasoning:** Avoids a duplicate unfiltered fetch on the same page. Single data source.

### A2 — recharts `<Pie>` for donut arc animation
`<Pie animationBegin={0} animationDuration={600}>` for mount arc sweep. recharts auto-re-animates on `data` prop changes.

**Reasoning:** No framer-motion for SVG arcs — recharts handles this natively without additional complexity.

### A3 — Absolute `<div>` overlay for donut center label
The `<PieChart>` container uses `position: relative`. A child `<div>` with `inset-0 flex items-center justify-center` overlays the percentage.

**Reasoning:** Full CSS control over typography; avoids recharts `<Label>` customisation complexity.

### A4 — Custom `motion.div` bars for PriorityBars (not recharts BarChart)
`initial={{ width: '0%' }}`, `animate={{ width: '{pct}%' }}`, `transition={{ duration: BAR_DURATION, ease: 'easeOut' }}`.

**Reasoning:** Matches FRS AC-D03.4/D03.5 spring/ease animation spec. recharts BarChart animation does not support framer-motion.

### A5 — Empty state guard
`total === 0`: donut shows single gray ring + "0%" center. Priority bars all animate to `width: '0%'`.

**Reasoning:** Prevents division-by-zero and renders a meaningful empty state per FRS AC-D02.5 / AC-D03.6.

---

## 5. Donut Chart Specs

| State | Data |
|-------|------|
| Normal | `[{ name: 'Completed', value: completed, fill: '#16a34a' }, { name: 'Pending', value: pending, fill: '#ca8a04' }]` |
| Empty (`total === 0`) | `[{ value: 1, fill: '#e5e7eb' }]` + center label "0%" |

Chart dimensions: `width={180} height={180}`, `innerRadius={55}`, `outerRadius={80}`.

---

## 6. Priority Bar Colour Map

| Priority | Bar class    |
|----------|-------------|
| High     | `bg-red-500` |
| Medium   | `bg-blue-500`|
| Low      | `bg-gray-400`|

Track: `bg-gray-100 rounded-full`, bar height: `h-2 rounded-full`.

---

## 7. ChartsRow Layout

```
flex flex-col md:flex-row gap-6 mb-6
├── CompletionDonut card  (bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5)
└── PriorityBars card     (bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 flex-1)
```

Mobile: stacked vertically. Tablet+: side-by-side (AC-D12.1–D12.3).

---

## 8. Implementation Phases

### Phase 1 — Chart Components
1.1 Create `src/frontend/components/dashboard/CompletionDonut.tsx`
1.2 Create `src/frontend/components/dashboard/PriorityBars.tsx`
1.3 Create `src/frontend/components/dashboard/ChartsRow.tsx`
1.4 Create `src/frontend/components/dashboard/CompletionDonut.test.tsx`
1.5 Create `src/frontend/components/dashboard/PriorityBars.test.tsx`
1.6 Create `src/frontend/components/dashboard/ChartsRow.test.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 2 — Page Integration
2.1 Modify `src/frontend/pages/TodosPage.tsx` — mount `<ChartsRow stats={stats} />` between `<StatsRow>` and FilterBar controls

Layout order after this phase:
```
[Header] → [StatsRow] → [ChartsRow] → [FilterBar + Add Todo] → [AnimatedTodoList]
```

**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## 9. No DB / Backend Changes

Purely frontend. No new API endpoints. No new packages (recharts + framer-motion already installed).

---

## 10. Plan Review Checklist

- [x] File paths follow `src/frontend/` structure from AGENTS.md
- [x] No duplicate API calls — uses `DashboardStats` props from Phase 3 hook
- [x] No new npm packages
- [x] No DB migrations needed
- [x] Empty state handled for both charts
- [x] Responsive layout (mobile: stacked, tablet+: side-by-side) implemented
