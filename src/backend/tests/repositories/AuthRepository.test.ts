import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryResult } from 'pg';
import { AuthRepository } from '../../repositories/AuthRepository';
import { pool } from '../../config/db';
import type { UserRow } from '../../types';

vi.mock('../../config/db', () => ({
  pool: { query: vi.fn() },
}));

const mockUser: UserRow = {
  id: 'uuid-1',
  email: 'test@example.com',
  password: 'hashed-password',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

function mockQueryResult(rows: UserRow[]): QueryResult<UserRow> {
  return { rows, rowCount: rows.length, command: '', oid: 0, fields: [] };
}

describe('AuthRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns null when user does not exist', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([]));
      const result = await AuthRepository.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });

    it('returns UserRow when user exists', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([mockUser]));
      const result = await AuthRepository.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('queries with correct SQL and parameter', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([]));
      await AuthRepository.findByEmail('test@example.com');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        ['test@example.com']
      );
    });
  });

  describe('findById', () => {
    it('returns null when user does not exist', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([]));
      const result = await AuthRepository.findById('uuid-999');
      expect(result).toBeNull();
    });

    it('returns UserRow when user exists', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([mockUser]));
      const result = await AuthRepository.findById('uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail after create', () => {
    it('returns the row that was just created', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([mockUser]));
      await AuthRepository.create('test@example.com', 'hashed-password');

      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([mockUser]));
      const found = await AuthRepository.findByEmail('test@example.com');
      expect(found).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('inserts and returns the new user row', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([mockUser]));
      const result = await AuthRepository.create('test@example.com', 'hashed-password');
      expect(result).toEqual(mockUser);
    });

    it('calls INSERT with correct parameters', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockQueryResult([mockUser]));
      await AuthRepository.create('test@example.com', 'hashed-password');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'hashed-password']
      );
    });
  });
});
