# /implement — Autonomous Phase-by-Phase Implementation

Implement: $ARGUMENTS

## Before Writing ONE Line of Code, Read:

1. `AGENTS.md` — structure, patterns, standards
2. `docs/FRS.md` — business rules for this feature
3. `docs/SDS.md` — API contracts, DB schema, design decisions
4. `CLAUDE.md` — permission model, quality gates
5. `openspec/changes/$ARGUMENTS/proposal.md`
6. `openspec/changes/$ARGUMENTS/plan.md`
7. `openspec/changes/$ARGUMENTS/tasks.md`

## Implementation Rules

- Ask [y/n] before every **new** file write
- Proceed without asking for edits to files already in the plan
- After **every phase**: `npm run build` → `npm run lint` → `npm run test`
- Write tests **alongside** implementation (not after)
- Never skip a failing test — fix before proceeding
- If a test reveals a design problem → ask before changing the design
- At 60k tokens: save progress to `session-context.md` → `/clear` → resume
- When all phases done: `openspec archive $ARGUMENTS`

## Implementation Order (always)

```
1. Types/interfaces
2. Repository (SQL)
3. Service (business logic)
4. Controller (req/res)
5. Routes (register in Express)
6. Middleware (if new middleware needed)
7. Zustand store
8. Custom hooks
9. Components
10. Pages
```

## Output When Done

```markdown
## Files Changed
- path/to/file.ts — reason

## Spec Scenarios Covered
- S1: <scenario name> → <test name>

## FRS Requirements Covered
- AC-01.1 → UserService.ts:47

## Assumptions Made
- (any decisions not explicitly in FRS/SDS)

## Follow-up Tasks
- (anything deferred or out of scope for this ticket)
```
