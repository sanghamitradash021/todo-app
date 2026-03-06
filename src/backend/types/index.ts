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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
