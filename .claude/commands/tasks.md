# /tasks — Break Down Into Phased Task Checklist

Break down into tasks for: $ARGUMENTS

## Steps

1. Read `openspec/changes/$ARGUMENTS/proposal.md`
2. Read `openspec/changes/$ARGUMENTS/plan.md`
3. Generate a sequenced task checklist in `openspec/changes/$ARGUMENTS/tasks.md`

## Task Structure

```
## Phase 1: Foundation
- [ ] 1.1 Create/update TypeScript types and interfaces
- [ ] 1.2 Write DB migration SQL (if schema changes needed)
- [ ] 1.3 Create config/constants additions
**Checkpoint:** npm run build → npm run lint → npm run test

## Phase 2: Backend — Repository Layer
- [ ] 2.1 Write repository SQL queries
- [ ] 2.2 Write repository unit tests
**Checkpoint:** npm run build → npm run lint → npm run test

## Phase 3: Backend — Service Layer
- [ ] 3.1 Write service business logic
- [ ] 3.2 Write service unit tests
**Checkpoint:** npm run build → npm run lint → npm run test

## Phase 4: Backend — Controller + Routes
- [ ] 4.1 Write controller (req/res wiring only)
- [ ] 4.2 Register routes in Express router
- [ ] 4.3 Write integration/smoke tests
**Checkpoint:** npm run build → npm run lint → npm run test

## Phase 5: Frontend — Store + Hooks
- [ ] 5.1 Write/update Zustand store
- [ ] 5.2 Write custom hook(s)
**Checkpoint:** npm run build → npm run lint → npm run test

## Phase 6: Frontend — Components + Pages
- [ ] 6.1 Write reusable components
- [ ] 6.2 Write page component
- [ ] 6.3 Wire up routing
- [ ] 6.4 Write component tests
**Checkpoint:** npm run build → npm run lint → npm run test

## Phase 7: Archive
- [ ] 7.1 All spec scenarios covered?
- [ ] 7.2 All FRS acceptance criteria implemented + tested?
- [ ] 7.3 Archive: openspec archive $ARGUMENTS
```

4. Save to `openspec/changes/$ARGUMENTS/tasks.md`
5. **Wait for approval before implementing**

## Tasks Review Checklist

- [ ] Every spec scenario has at least one TEST task?
- [ ] Every phase ends with a build + lint + test checkpoint?
- [ ] Backend layers in correct order (types → repo → service → controller → route)?
- [ ] DB migrations before any service code?
- [ ] Frontend layers in correct order (store → hooks → components → pages)?
