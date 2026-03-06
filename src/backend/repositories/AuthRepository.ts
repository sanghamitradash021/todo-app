import { pool } from '../config/db';
import { UserRow } from '../types';

export const AuthRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(
      'SELECT id, email, password, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(
      'SELECT id, email, password, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(email: string, passwordHash: string): Promise<UserRow> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, password, created_at, updated_at`,
      [email, passwordHash]
    );
    return result.rows[0];
  },
};
