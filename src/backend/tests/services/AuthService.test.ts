import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../services/AuthService';
import { AuthRepository } from '../../repositories/AuthRepository';
import { AppError } from '../../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserRow } from '../../types';

vi.mock('../../repositories/AuthRepository');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../config/env', () => ({
  env: { JWT_SECRET: 'test-secret-32-chars-long-minimum', JWT_EXPIRES_IN: '24h' },
}));

const mockUserRow: UserRow = {
  id: 'uuid-1',
  email: 'test@example.com',
  password: 'hashed-password',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('throws AppError 409 when email already exists', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(mockUserRow);

      await expect(
        AuthService.register('test@example.com', 'password123')
      ).rejects.toMatchObject({ statusCode: 409, errorCode: 'EMAIL_ALREADY_EXISTS' });
    });

    it('hashes the password with bcrypt before storing', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed' as never);
      vi.mocked(AuthRepository.create).mockResolvedValueOnce(mockUserRow);
      vi.mocked(jwt.sign).mockReturnValueOnce('token' as never);

      await AuthService.register('test@example.com', 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('never stores plaintext password', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-not-plaintext' as never);
      vi.mocked(AuthRepository.create).mockResolvedValueOnce(mockUserRow);
      vi.mocked(jwt.sign).mockReturnValueOnce('token' as never);

      await AuthService.register('test@example.com', 'password123');

      const createCall = vi.mocked(AuthRepository.create).mock.calls[0];
      expect(createCall[1]).not.toBe('password123');
      expect(createCall[1]).toBe('hashed-not-plaintext');
    });

    it('returns token and user on success — password excluded from result', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed' as never);
      vi.mocked(AuthRepository.create).mockResolvedValueOnce(mockUserRow);
      vi.mocked(jwt.sign).mockReturnValueOnce('signed-token' as never);

      const result = await AuthService.register('test@example.com', 'password123');

      expect(result).toEqual({
        token: 'signed-token',
        user: { id: 'uuid-1', email: 'test@example.com' },
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('throws AppError 401 when email is not found', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(null);

      const err = await AuthService.login('nobody@example.com', 'password123').catch(
        (e: unknown) => e
      );
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
      expect((err as AppError).errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('throws AppError 401 when password is wrong', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(mockUserRow);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const err = await AuthService.login('test@example.com', 'wrongpass').catch(
        (e: unknown) => e
      );
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
      expect((err as AppError).errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('unknown email and wrong password return identical error (no user enumeration)', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(null);
      const notFoundErr = await AuthService.login('nobody@example.com', 'pass').catch(
        (e: unknown) => e as AppError
      );

      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(mockUserRow);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
      const wrongPassErr = await AuthService.login('test@example.com', 'wrongpass').catch(
        (e: unknown) => e as AppError
      );

      expect(notFoundErr.statusCode).toBe(wrongPassErr.statusCode);
      expect(notFoundErr.errorCode).toBe(wrongPassErr.errorCode);
      expect(notFoundErr.message).toBe(wrongPassErr.message);
    });

    it('returns token and user on success', async () => {
      vi.mocked(AuthRepository.findByEmail).mockResolvedValueOnce(mockUserRow);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
      vi.mocked(jwt.sign).mockReturnValueOnce('signed-token' as never);

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result).toEqual({
        token: 'signed-token',
        user: { id: 'uuid-1', email: 'test@example.com' },
      });
    });
  });
});
