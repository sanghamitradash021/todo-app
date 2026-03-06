# /spec — Generate Spec for Ticket

Run spec generation for: $ARGUMENTS

## Steps

1. Read `AGENTS.md` (constraints + patterns)
2. Read `docs/FRS.md` → find all requirements relevant to this ticket
3. Read `docs/SDS.md` → find relevant API contracts + DB schema + design decisions
4. Ask **3–6 clarifying questions** before proposing anything (catch bugs before code)
5. Generate `openspec/changes/$ARGUMENTS/proposal.md` with:
   - Business intent (linked FRS sections)
   - In-scope scenarios
   - Out-of-scope
   - API changes (must match SDS)
   - DB changes (if any)
   - Acceptance criteria (one per FRS AC item)
6. Show the proposal for review
7. **Do NOT proceed to implementation**

## Format

```
/spec feature/auth/jwt-login-register
/spec feature/todos/crud-endpoints
/spec feature/frontend/todo-dashboard
```

## Spec Review Checklist (Dev verifies)

- [ ] Every FRS acceptance criterion has a matching spec scenario?
- [ ] Every error case from FRS has a scenario?
- [ ] API shapes match SDS contracts exactly?
- [ ] No invented business rules not in FRS?
- [ ] Out-of-scope section exists?
