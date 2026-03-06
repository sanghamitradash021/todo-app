# /plan — Generate Technical Plan

Create technical plan for: $ARGUMENTS

## Steps

1. Read `openspec/changes/$ARGUMENTS/proposal.md`
2. Read `docs/SDS.md` — architecture, DB schema, API contracts
3. Read `AGENTS.md` — folder structure + coding standards
4. Scan existing codebase for reusable patterns (types, utils, middleware already written)
5. Generate `openspec/changes/$ARGUMENTS/plan.md` covering:
   - **Exact file paths** to create or modify (use SDS folder structure)
   - **TypeScript interfaces** with final shapes matching SDS contracts
   - **Architecture decisions** with reasoning
   - **DB changes** — migration SQL if needed, always backward compatible
   - **Reuse of existing code** — call out what exists and can be reused
   - **Phase checkpoints** — build + lint + test after each phase
6. Save plan to `openspec/changes/$ARGUMENTS/plan.md`
7. **Wait for dev approval before any implementation**

## Format

```
/plan feature/auth/jwt-login-register
/plan feature/todos/crud-endpoints
```

## Plan Review Checklist (Dev verifies)

- [ ] File paths follow `src/backend/` and `src/frontend/` structure from AGENTS.md?
- [ ] API shapes match SDS contracts exactly?
- [ ] DB schema matches SDS exactly?
- [ ] No duplication of types/utils that already exist?
- [ ] DB migrations are planned before service code?
- [ ] Backend layers respected: controller → service → repository?
