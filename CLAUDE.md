# CLAUDE.md

@AGENTS.md

---

## Claude Code-Specific Rules

### Permission Model
**Always ask [y/n] before:**
- `git push`
- Running DB migrations
- Deleting any file
- Installing new npm packages not in SDS tech stack

**Proceed without asking:**
- `npm run build`, `npm run lint`, `npm run test`
- `git add`, `git commit`
- Creating new files per the plan
- Editing existing files per the plan

---

### Context Management
- `/clear` after every completed ticket
- At 60k tokens: save progress summary to `session-context.md` → `/clear` → resume
- Never let context fill to limit without saving
- Resume with: "Read session-context.md and tasks.md, continue from Phase X Task Y"

---

### Thinking Depth
- Simple CRUD tasks: default thinking
- Auth, middleware, store design: `think hard before starting`
- Architecture or cross-cutting decisions: `ultrathink`

---

### Commit Format (commitlint enforced)
```
feat(scope): description

- bullet: what changed
- bullet: why

Relates to #<ticket>
```

Valid scopes: `auth`, `todos`, `frontend`, `backend`, `config`, `test`, `dx`

**Examples:**
```
feat(auth): implement JWT login and registration
feat(todos): add CRUD endpoints with soft delete
feat(frontend): build todo list page with filters
fix(auth): return 409 on duplicate email registration
chore(dx): add ESLint, husky, and commitlint setup
```

---

### Branch Naming
```
feature/<scope>/<short-description>
fix/<scope>/<short-description>
chore/<scope>/<short-description>
```
**Examples:**
```
feature/auth/jwt-login-register
feature/todos/crud-endpoints
feature/frontend/todo-dashboard
```

---

### Quality Gates (Non-Negotiable)

**After every implementation phase:**
```bash
npm run build     # must exit 0, 0 TypeScript errors
npm run lint      # must exit 0, 0 ESLint errors/warnings
npm run test      # all tests green
```

**Before every commit:**
```bash
npx commitlint --from HEAD~1   # must pass
```
Husky pre-commit runs lint automatically.

**Never commit if:**
- Any test is failing
- ESLint has errors
- TypeScript build has errors

---

### Implementation Order (Per Ticket)

Always implement in this order:
1. **Types/interfaces** first (`src/backend/types/` or `src/frontend/types/`)
2. **Repository** (SQL queries)
3. **Service** (business logic)
4. **Controller** (req/res wiring)
5. **Route** (register in Express router)
6. **Middleware** if needed
7. **Frontend store** (Zustand)
8. **Frontend hooks**
9. **Frontend components/pages**
10. **Tests** (write alongside or immediately after each layer)

---

### When Stuck or Uncertain
- Ask one focused clarifying question before guessing
- Never invent business rules not in FRS.md
- Never deviate from API contracts in SDS.md
- If SDS and FRS conflict → ask before proceeding

---

### File Creation Rules
- Check if a shared type/utility already exists before creating a new one
- One responsibility per file
- Export types from the file where they are defined
- Re-export from index files where appropriate
