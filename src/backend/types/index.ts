export interface AuthenticatedUser {
  id: string;
  email: string;
}

// Raw row returned by node-postgres from the users table.
// password stays inside the repository/service layer — never sent to clients.
export interface UserRow {
  id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

// Returned by AuthService.register() and AuthService.login()
export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// Raw row returned by node-postgres from the todos table.
// due_date comes back as a JS Date from pg DATE column.
// deleted_at is internal — never exposed to clients.
export interface TodoRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// Client-facing todo shape — matches SDS §5 Todo interface exactly.
// deleted_at excluded; dates formatted as strings by the service layer.
export interface TodoResult {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;   // YYYY-MM-DD
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
}

// Query-param filters for GET /api/todos
export interface TodoFilters {
  status?: 'pending' | 'completed' | 'all';
  priority?: 'low' | 'medium' | 'high';
}

// Validated POST /api/todos body
export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

// Validated PATCH /api/todos/:id body — nullable fields allow explicit clearing
export interface UpdateTodoData {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
