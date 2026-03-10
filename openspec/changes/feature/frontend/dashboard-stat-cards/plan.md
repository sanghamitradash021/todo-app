# Plan: feature/frontend/dashboard-stat-cards

**Branch:** `feature/frontend/dashboard-stat-cards`
**Status:** Draft — awaiting dev approval
**Generated:** 2026-03-10

---

## 1. Existing Code to Reuse (No Duplication)

| Existing | Location | Reuse |
|----------|----------|-------|
| `Todo`, `TodoStatus` | `src/frontend/types/index.ts` | Already defined — no new types needed |
| `api` Axios instance | `src/frontend/utils/api.ts` | `useDashboardStats` calls `GET /api/todos` through this |
| `useTodoStore` | `src/frontend/store/todoStore.ts` | Subscribe to `todos` as re-fetch trigger |
| `ANIMATION_TOKENS` / `animations.ts` | `src/frontend/config/animations.ts` | `COUNT_DURATION`, `STAGGER_CARD` tokens |
| `logger` | `src/frontend/utils/logger.ts` | Silent error logging on stats fetch failure |
| framer-motion | already installed | `useMotionValue`, `animate`, `motion.div` |

---

## 2. New Types Needed

One new interface defined in `useDashboardStats.ts` (not exported globally — used within the hook and passed via props):

```typescript
interface DashboardStats {
  total:          number;
  pending:        number;
  completed:      number;
  overdue:        number;
  completionPct:  number;
  priorityCounts: { high: number; medium: number; low: number };
  isStatsLoading: boolean;
}
```

---

## 3. Exact File Paths

### Create (new files)
```
src/frontend/utils/date.ts
src/frontend/hooks/useDashboardStats.ts
src/frontend/components/dashboard/StatCard.tsx
src/frontend/components/dashboard/StatsRow.tsx
```

### Modify (existing files)
```
src/frontend/pages/TodosPage.tsx   — mount <StatsRow /> between header and FilterBar
```

### Test files
```
src/frontend/utils/date.test.ts
src/frontend/hooks/useDashboardStats.test.ts
src/frontend/components/dashboard/StatCard.test.tsx
src/frontend/components/dashboard/StatsRow.test.tsx
```

---

## 4. Interface Shapes (Final)

### StatCard props
```typescript
interface StatCardProps {
  label:  string;
  value:  number;
  accent: 'blue' | 'yellow' | 'green' | 'red';
}
```

### StatsRow props
```typescript
interface StatsRowProps {
  stats: DashboardStats;
}
```

---

## 5. Architecture Decisions

### A1 — Separate unfiltered fetch in `useDashboardStats`
Stats always call `GET /api/todos` with no query params. Stats are independent of the active filter in `todoStore`.

**Reasoning:** FRS §5 — stats must reflect the full dataset regardless of which filter is active in the list.

### A2 — Re-fetch triggered by `todoStore.todos` change
`useDashboardStats` watches `useTodoStore(state => state.todos)` via `useEffect`. Any CRUD mutation replaces the `todos` reference in the store, causing a stats re-fetch.

**Reasoning:** Avoids a global event bus. Single source of truth in the store.

### A3 — Count-up: animate from previous value to new value
`useMotionValue(value)` + framer-motion `animate()` animates **old → new** (not 0 → new on every change).

**Reasoning:** Less jarring on data updates. Matches FRS AC-D01.5.

### A4 — Scale pulse on value change
A separate `scaleMotionValue` triggers a `[1, 1.15, 1]` pulse on every value change (skipped on mount).

**Reasoning:** Provides visual confirmation of stat update without full re-animation.

### A5 — Silent failure for stats fetch
On error, log with `logger.error`, keep stale stats visible, return `isStatsLoading: false`. No error toast.

**Reasoning:** Stats are secondary UI. A failing stats fetch should not interrupt the user's primary task list workflow.

---

## 6. Accent → Tailwind Class Map

| accent   | bg            | text             | ring            |
|----------|---------------|------------------|-----------------|
| blue     | `bg-blue-50`  | `text-blue-600`  | `ring-blue-200` |
| yellow   | `bg-yellow-50`| `text-yellow-600`| `ring-yellow-200`|
| green    | `bg-green-50` | `text-green-600` | `ring-green-200`|
| red      | `bg-red-50`   | `text-red-600`   | `ring-red-200`  |

---

## 7. StatsRow Card Order

| Index | Label     | Value              | Accent  | Delay          |
|-------|-----------|--------------------|---------|----------------|
| 0     | Total     | `stats.total`      | blue    | 0s             |
| 1     | Pending   | `stats.pending`    | yellow  | STAGGER_CARD   |
| 2     | Completed | `stats.completed`  | green   | STAGGER_CARD×2 |
| 3     | Overdue   | `stats.overdue`    | red     | STAGGER_CARD×3 |

Grid: `grid grid-cols-2 md:grid-cols-4 gap-4`

---

## 8. Implementation Phases

### Phase 1 — Utility + Hook
1.1 Create `src/frontend/utils/date.ts` — `startOfToday()` pure function
1.2 Create `src/frontend/hooks/useDashboardStats.ts` — fetch + derive stats
1.3 Create `src/frontend/utils/date.test.ts`
1.4 Create `src/frontend/hooks/useDashboardStats.test.ts`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 2 — Components
2.1 Create `src/frontend/components/dashboard/StatCard.tsx`
2.2 Create `src/frontend/components/dashboard/StatsRow.tsx`
2.3 Create `src/frontend/components/dashboard/StatCard.test.tsx`
2.4 Create `src/frontend/components/dashboard/StatsRow.test.tsx`
**Checkpoint:** `npm run build && npm run lint && npm run test`

### Phase 3 — Page Integration
3.1 Modify `src/frontend/pages/TodosPage.tsx` — add `useDashboardStats`, mount `<StatsRow>` above FilterBar
**Checkpoint:** `npm run build && npm run lint && npm run test`

---

## 9. No DB / Backend Changes

Purely frontend. No new API endpoints. No new packages.

---

## 10. Plan Review Checklist

- [x] File paths follow `src/frontend/` structure from AGENTS.md
- [x] API shape matches SDS contract exactly (GET /api/todos, existing response envelope)
- [x] No duplication of types/utils that already exist
- [x] No DB migrations needed
- [x] No new npm packages
- [x] Frontend layers in order: utils → hooks → components → page modification
