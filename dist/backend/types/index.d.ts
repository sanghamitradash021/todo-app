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
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
//# sourceMappingURL=index.d.ts.map