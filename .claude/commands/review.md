# /review — Spec + FRS Compliance Check

Review implementation for: $ARGUMENTS

**READ-ONLY MODE — do NOT modify any files.**

## Steps

1. Read `openspec/archive/$ARGUMENTS/` (or `openspec/changes/$ARGUMENTS/` if not yet archived)
2. Read `docs/FRS.md` — original acceptance criteria
3. Read `docs/SDS.md` — API contracts, status codes, error codes
4. Compare implementation against spec scenarios AND FRS criteria
5. Read the actual implementation files

## Output Format

```
✅ PASS:     [Scenario/AC] → [file:line]
❌ MISSING:  [Scenario/AC] — not implemented
⚠️  DRIFTED:  [Scenario/AC] — spec says X, code does Y
🔒 SECURITY: [concern] — [file:line]
📋 FRS GAP:  [FRS section + AC] — not addressed
```

## What to Check

- Every FRS acceptance criterion → implemented + tested?
- Every spec scenario → has a matching test?
- HTTP status codes → match SDS exactly?
- Error codes → match SDS exactly (`"error": "ERROR_CODE"`)?
- Response shape → always `{ "data": ... }` or `{ "error": "..." }`?
- Auth middleware → applied on all protected routes?
- Soft delete → `deleted_at` set, not hard delete?
- No passwords/hashes in API responses?
- Logger used instead of console.log?
- No business logic in controllers?
- No SQL outside repositories?

**No style feedback — compliance only.**

## Format

```
/review feature/auth/jwt-login-register
/review feature/todos/crud-endpoints
```
