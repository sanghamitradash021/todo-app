import { UserRow } from '../types';
export declare const AuthRepository: {
    findByEmail(email: string): Promise<UserRow | null>;
    findById(id: string): Promise<UserRow | null>;
    create(email: string, passwordHash: string): Promise<UserRow>;
};
//# sourceMappingURL=AuthRepository.d.ts.map