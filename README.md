# Todo App

## Folder Structure

```
todo-app/
├── src/
│   ├── frontend/
│   │   ├── components/     ← Reusable UI components
│   │   ├── hooks/          ← Custom React hooks
│   │   ├── pages/          ← Route-level pages
│   │   ├── store/          ← Zustand state stores
│   │   ├── utils/          ← API client, helpers
│   │   ├── config/         ← Constants, env vars
│   │   ├── types/          ← Shared TypeScript types
│   │   └── App.tsx
│   │
│   └── backend/
│       ├── controllers/    ← Route handlers
│       ├── services/       ← Business logic
│       ├── repositories/   ← SQL queries
│       ├── middleware/     ← Auth, validation, error handler
│       ├── routes/         ← Express routers
│       ├── config/         ← DB, env, constants
│       ├── utils/          ← Logger, asyncHandler
│       └── types/          ← Backend TypeScript types
│
├── migrations/             ← SQL migration files
├── docs/
│   ├── FRS.md
│   └── SDS.md
└── package.json
```

---

## Developer Guide

### 1. Create the `.env` file

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/todo_db
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h
LOG_LEVEL=debug
VITE_API_URL=http://localhost:3001
```

### 2. Create the database and run migrations

```bash
psql -U YOUR_USER -c "CREATE DATABASE todo_db;"
psql -U YOUR_USER -d todo_db -f migrations/001_create_users.sql
psql -U YOUR_USER -d todo_db -f migrations/002_create_todos.sql
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Other commands

```bash
npm run dev:frontend   # Vite only
npm run dev:backend    # nodemon only
npm run build          # TypeScript + Vite build
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run test           # Run all tests
```
