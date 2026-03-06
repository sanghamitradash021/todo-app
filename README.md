# Todo App — Spec-Driven Dev Setup

## What's in This Folder

```
docs/
  FRS.md              ← Business requirements (what to build)
  SDS.md              ← Technical design (how to build it)
AGENTS.md             ← Universal AI context (all AI tools read this)
CLAUDE.md             ← Claude Code rules + quality gates
.claude/
  commands/
    start.md          ← /start
    spec.md           ← /spec
    plan.md           ← /plan
    tasks.md          ← /tasks
    implement.md      ← /implement
    review.md         ← /review
    pr.md             ← /pr
  agents/
    reviewer.md       ← read-only compliance checker
    test-writer.md    ← test-only writer
```

---

## Step 1 — Drop These Files Into Your Repo

```
your-todo-app/
├── docs/
│   ├── FRS.md
│   └── SDS.md
├── AGENTS.md
├── CLAUDE.md
└── .claude/
    ├── commands/
    └── agents/
```

---

## Step 2 — Open Claude Code

```bash
cd your-todo-app
claude
/start
```

Claude will confirm it has loaded everything.

---

## Step 3 — Ask Claude to Bootstrap the Project

After `/start`, run this prompt:

```
Read docs/FRS.md, docs/SDS.md, and AGENTS.md thoroughly.

Now scaffold the full project:
1. Initialize package.json at root with scripts: dev, dev:frontend, dev:backend, build, lint, lint:fix, test, test:watch
2. Set up TypeScript (tsconfig.json, strict mode)
3. Create src/frontend/ and src/backend/ folder structures per AGENTS.md
4. Install all dependencies from SDS.md tech stack
5. Set up ESLint (eslint.config.js or .eslintrc.json) for TypeScript + React
6. Set up commitlint (.commitlintrc.json) with conventional commits
7. Set up Husky (.husky/) with pre-commit hook running lint
8. Set up Vite for frontend (vite.config.ts)
9. Create .env.example with all vars from SDS section 9
10. Create a basic Express server entry point (src/backend/app.ts, src/backend/server.ts)
11. Create a basic React entry point (src/frontend/main.tsx, src/frontend/App.tsx)
12. Set up Winston logger at src/backend/utils/logger.ts per AGENTS.md section 11
13. Set up PostgreSQL pool at src/backend/config/db.ts
14. Create global error handler middleware at src/backend/middleware/errorHandler.ts
15. Create asyncHandler util at src/backend/utils/asyncHandler.ts

Run: npm run build → npm run lint → confirm 0 errors before finishing.
```

---

## Step 4 — Develop Ticket by Ticket

For each feature (auth, todos, frontend), follow this flow:

```bash
# 1. Create a branch
git checkout -b feature/auth/jwt-login-register

# 2. Open Claude
claude
/start

# 3. Generate spec (Claude will ask clarifying questions)
/spec feature/auth/jwt-login-register

# 4. Review proposal → approve

# 5. Generate technical plan
/plan feature/auth/jwt-login-register

# 6. Review plan → approve

# 7. Break into tasks
/tasks feature/auth/jwt-login-register

# 8. Review tasks → approve

# 9. Implement (Claude works autonomously, phase by phase)
/implement feature/auth/jwt-login-register

# 10. Review in fresh terminal
claude
/review feature/auth/jwt-login-register

# 11. Fix anything flagged, then commit + push
/pr feature/auth/jwt-login-register
```

---

## Suggested Ticket Order

```
1. feature/dx/project-scaffold         ← Setup (Step 3 above)
2. feature/auth/jwt-login-register     ← Backend auth (US-01, US-02)
3. feature/todos/crud-endpoints        ← Backend todos (US-04–09)
4. feature/frontend/auth-pages         ← Login + Register UI (US-10)
5. feature/frontend/todo-dashboard     ← Main UI (US-11, US-12)
```

---

## Quality Gates (Always)

```bash
npm run build   # 0 TypeScript errors
npm run lint    # 0 ESLint errors
npm run test    # all green
```

These must pass before every commit. Claude will enforce this automatically.
