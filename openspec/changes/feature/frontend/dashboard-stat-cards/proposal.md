# Spec Proposal — Phase 3: Stat Cards
**Feature:** Professional Animated Dashboard — Phase 3 only
**Scope:** Frontend only. No backend changes. No new packages.
**Base FRS:** `docs/FRS-dashboard.md` US-D01 + §5 Derived State + §6 Animation Tokens
**Base SDS:** `docs/SDS.md` (existing API contract unchanged)
**Depends on:** Phase 1 (animations.ts tokens), Phase 2 (AnimatedTodoList in place)

---

## 1. Business Intent

Users need a persistent, always-accurate summary of their todo workload regardless of which filter is active in the list. Four metrics — Total, Pending, Completed, Overdue — must reflect the **full unfiltered dataset** so that switching the list to "Pending only" does not make the "Completed" stat card show 0. Stats are computed from a separate, unfiltered fetch and update reactively whenever the user performs a CRUD operation (create, update, toggle, delete).

Relevant FRS sections: US-D01 (AC-D01.1 – AC-D01.6), §5 Derived State, §6 Animation Tokens.

---

## 2. Decisions Made (Clarifications Resolved)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Stats data source | Full unfiltered fetch (`GET /api/todos` no params). Stats are independent of the active filter. |
| Q2 | Count-up mechanism | framer-motion `animate()` + `useMotionValue`. No new deps. |
| Q3 | Count-up restart on change | Animate **old → new value** (not 0 → new). Scale pulse accompanies every value change. |
| Q4 | Responsive grid | Implement full responsive grid now: `grid-cols-2 md:grid-cols-4`. |
| Q5 | `startOfToday()` | Shared utility in `src/frontend/utils/date.ts`. |

---

## 3. In-Scope

- `src/frontend/utils/date.ts` — `startOfToday()` helper
- `src/frontend/hooks/useDashboardStats.ts` — unfiltered fetch + stat derivation
- `src/frontend/components/dashboard/StatCard.tsx` — single animated counter card
- `src/frontend/components/dashboard/StatsRow.tsx` — 4-card responsive row
- `src/frontend/pages/TodosPage.tsx` — mount `<StatsRow />` above FilterBar
- Unit tests for every new file

---

## 4. Out of Scope

- Charts (Phase 4)
- Sidebar / layout shell (Phase 5)
- Reduced-motion guard (Phase 6 — will be added then)
- Dark mode
- Any backend changes
- New Zustand stores or modifications to existing stores (`todoStore`, `authStore`, `uiStore`)

---

## 5. API Contract (Unchanged)

`useDashboardStats` calls the existing endpoint with no filter params:

```
GET /api/todos
Authorization: Bearer <token>
(no query params — returns all non-deleted todos for the user)
```

Response shape (unchanged SDS contract):
```json
{ "data": [ Todo ] }
```

No new endpoints. No request body. HTTP 200 on success, 401 if unauthenticated.

---

## 6. Data Flow

```
todoStore.todos (filtered list)
    │
    └─► useDashboardStats                   ← subscribes to todoStore.todos as
            │  (change trigger)                a re-fetch signal (any mutation
            │                                  causes filtered list to change)
            ▼
        GET /api/todos (no params)
            │
            ▼
        allTodos: Todo[]  (local state, unfiltered)
            │
            ▼
        derived stats  ──► StatsRow ──► StatCard × 4
```

**Re-fetch trigger:** `useDashboardStats` watches `todoStore.todos` via `useEffect`. Any create / update / toggle / delete replaces the `todos` reference in the store, which triggers the stats re-fetch. Filter changes also trigger a re-fetch — this is acceptable (one extra call, no functional issue).

---

## 7. File Specifications

### 7.1 `src/frontend/utils/date.ts`

```typescript
/** Returns midnight of the current local day as a Date object. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
```

No imports. Pure function. Exported for reuse.

---

### 7.2 `src/frontend/hooks/useDashboardStats.ts`

**Interface:**
```typescript
interface DashboardStats {
  total:          number;
  pending:        number;
  completed:      number;
  overdue:        number;       // pending AND due_date < startOfToday()
  completionPct:  number;       // Math.round((completed / total) * 100), 0 if total === 0
  priorityCounts: { high: number; medium: number; low: number };
  isStatsLoading: boolean;
}
```

**Behaviour:**
1. Maintains local `allTodos: Todo[]` state (initialised `[]`).
2. On mount: fetches `GET /api/todos` (no params) via the existing `api` Axios instance. Sets `isStatsLoading` during fetch.
3. Watches `useTodoStore(state => state.todos)` — on change, re-fetches the unfiltered list.
4. Derives all six stat values from `allTodos`.
5. On error: silently logs; `isStatsLoading` returns to `false`; stale stats remain visible.
6. Returns the `DashboardStats` object.

**Derivations (exact formulas from FRS §5):**
```typescript
const total         = allTodos.length
const pending       = allTodos.filter(t => t.status === 'pending').length
const completed     = allTodos.filter(t => t.status === 'completed').length
const overdue       = allTodos.filter(t =>
  t.status === 'pending' &&
  t.due_date !== null &&
  new Date(t.due_date) < startOfToday()
).length
const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100)
const priorityCounts = {
  high:   allTodos.filter(t => t.priority === 'high').length,
  medium: allTodos.filter(t => t.priority === 'medium').length,
  low:    allTodos.filter(t => t.priority === 'low').length,
}
```

---

### 7.3 `src/frontend/components/dashboard/StatCard.tsx`

**Props:**
```typescript
interface StatCardProps {
  label:   string;
  value:   number;
  accent:  'blue' | 'yellow' | 'green' | 'red';
}
```

**Accent → colour map:**
| accent   | bg class          | text class       | icon/ring class    |
|----------|-------------------|------------------|--------------------|
| blue     | `bg-blue-50`      | `text-blue-600`  | `ring-blue-200`    |
| yellow   | `bg-yellow-50`    | `text-yellow-600`| `ring-yellow-200`  |
| green    | `bg-green-50`     | `text-green-600` | `ring-green-200`   |
| red      | `bg-red-50`       | `text-red-600`   | `ring-red-200`     |

**Animation behaviour (AC-D01.3 / AC-D01.4 / AC-D01.5):**

- Card entrance: `motion.div` with `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`. Delay injected via `transition` prop (stagger applied in `StatsRow`).
- Count-up: `useMotionValue(value)` + framer-motion `animate()` called in `useEffect` when `value` changes. Animates from **previous display value → new value** over `COUNT_DURATION` (0.8s). `useTransform` + `Math.round` converts the motion value to a displayable integer.
- Scale pulse on change: on every `value` change (after mount), a `useEffect` triggers a brief `animate(scale, [1, 1.15, 1], { duration: 0.3 })` on a separate `scaleMotionValue`. The number `span` uses `style={{ scale }}`.
- The `aria-live="polite"` attribute is set on the number element (AC-D06 accessibility note for this phase).

**Layout:**
```
┌──────────────────────────┐
│  [label]                 │
│                          │
│    [large number]        │
└──────────────────────────┘
```
Card uses `rounded-xl`, `p-5`, `shadow-sm`, ring border matching accent.

---

### 7.4 `src/frontend/components/dashboard/StatsRow.tsx`

**Props:**
```typescript
interface StatsRowProps {
  stats: DashboardStats;
}
```

**Behaviour:**
- Renders four `<StatCard>` components in order: Total (blue), Pending (yellow), Completed (green), Overdue (red).
- Each card is wrapped in a `motion.div` with stagger: `delay = index * STAGGER_CARD` (0.08s per card). (AC-D01.3)
- Grid: `grid grid-cols-2 md:grid-cols-4 gap-4` — 2×2 on mobile, 4×1 on desktop (AC-D01.6).
- When `isStatsLoading` is `true` on initial mount, renders 4 skeleton-like placeholder cards (gray `animate-pulse` divs matching StatCard dimensions) instead of real cards.

---

### 7.5 `src/frontend/pages/TodosPage.tsx` (modification)

Mount `<StatsRow />` between the header and the controls bar:

```
[Header: title + logout]
[StatsRow]                ← NEW
[FilterBar + Add Todo]
[AnimatedTodoList]
```

Add `useDashboardStats` call at top of component. Pass `stats` to `StatsRow`.

---

## 8. Acceptance Criteria

| AC | Requirement | Implementation |
|----|-------------|----------------|
| AC-D01.1 | Four stat cards: Total, Pending, Completed, Overdue | `StatsRow` renders 4 `StatCard` components |
| AC-D01.2 | Overdue = pending todos where `due_date < today` | `useDashboardStats` — `new Date(due_date) < startOfToday()` |
| AC-D01.3 | Cards stagger in from bottom (y:20→0, opacity:0→1), 80ms between each | `motion.div` per card, delay = `index * STAGGER_CARD` |
| AC-D01.4 | Numbers animate 0→value over 800ms on mount | `useMotionValue` + framer-motion `animate()`, `COUNT_DURATION` token |
| AC-D01.5 | On value change: animate old→new + scale pulse | `useEffect` on `value` → `animate()` prev→new; separate scale pulse |
| AC-D01.6 | 2×2 grid mobile, 4×1 desktop | `grid-cols-2 md:grid-cols-4` |
| Stats source | Stats reflect full unfiltered dataset | `useDashboardStats` calls `GET /api/todos` with no params |
| Reactivity | Stats update after any CRUD operation | Re-fetch triggered by `todoStore.todos` change |

---

## 9. Error Scenarios

| Scenario | Behaviour |
|----------|-----------|
| Stats fetch fails (network error / 401) | Error logged; stale stats remain; no error toast (stats are secondary UI) |
| `todos.length === 0` | All cards show `0`; `completionPct = 0` |
| All todos have no `due_date` | Overdue = `0` (correct, no todos can be overdue without a due date) |

---

## 10. Test Plan

| File | Scenarios |
|------|-----------|
| `utils/date.test.ts` | `startOfToday()` returns midnight of today; hours/minutes/seconds/ms are 0 |
| `hooks/useDashboardStats.test.ts` | Returns correct counts for mixed dataset; overdue excludes completed todos; overdue excludes null due_date; completionPct rounds correctly; completionPct is 0 when total is 0 |
| `components/dashboard/StatCard.test.tsx` | Renders label and value; renders correct accent class; has aria-live="polite" on number |
| `components/dashboard/StatsRow.test.tsx` | Renders all four cards with correct labels; shows skeleton placeholders when isStatsLoading; passes correct value to each card |

---

## 11. Spec Review Checklist

- [x] Every FRS acceptance criterion (AC-D01.1 – AC-D01.6) has a matching spec scenario
- [x] Every error case from FRS has a scenario (no FRS error cases for stat cards; only silent failure path)
- [x] API shape matches SDS contract exactly (GET /api/todos, existing response envelope)
- [x] No invented business rules not in FRS (stats source decision explicitly approved by product owner in clarification)
- [x] Out-of-scope section exists
