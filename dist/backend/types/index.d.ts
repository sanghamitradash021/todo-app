export interface AuthenticatedUser {
    id: string;
    email: string;
}
export interface UserRow {
    id: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
}
export interface AuthResult {
    token: string;
    user: {
        id: string;
        email: string;
    };
}
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
export interface TodoResult {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    created_at: string;
    updated_at: string;
}
export interface TodoFilters {
    status?: 'pending' | 'completed' | 'all';
    priority?: 'low' | 'medium' | 'high';
}
export interface CreateTodoData {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
}
export interface UpdateTodoData {
    title?: string;
    description?: string | null;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string | null;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
//# sourceMappingURL=index.d.ts.map