import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { AuthRepository } from '../../repositories/AuthRepository';
import jwt from 'jsonwebtoken';
import type { UserRow } from '../../types';

vi.mock('../../repositories/AuthRepository');
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

// Helper: calls middleware and resolves with the value passed to next()
function callMiddleware(
  mw: RequestHandler,
  req: Partial<Request>
): Promise<unknown> {
  return new Promise((resolve) => {
    const next = vi.fn().mockImplementation(resolve) as NextFunction;
    const res = {} as Response;
    mw(req as Request, res, next);
  });
}

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next(AppError 401) when Authorization header is missing', async () => {
    const req: Partial<Request> = { headers: {} };
    const err = await callMiddleware(authenticate, req);
    expect(err).toMatchObject({ statusCode: 401, errorCode: 'UNAUTHORIZED' });
  });

  it('calls next(AppError 401) when Authorization header is not Bearer scheme', async () => {
    const req: Partial<Request> = {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    };
    const err = await callMiddleware(authenticate, req);
    expect(err).toMatchObject({ statusCode: 401, errorCode: 'UNAUTHORIZED' });
  });

  it('calls next(AppError 401) when token is malformed', async () => {
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('invalid token');
    });
    const req: Partial<Request> = {
      headers: { authorization: 'Bearer bad.token.here' },
    };
    const err = await callMiddleware(authenticate, req);
    expect(err).toMatchObject({ statusCode: 401, errorCode: 'UNAUTHORIZED' });
  });

  it('calls next(AppError 401) when token is expired', async () => {
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('jwt expired');
    });
    const req: Partial<Request> = {
      headers: { authorization: 'Bearer expired.token.here' },
    };
    const err = await callMiddleware(authenticate, req);
    expect(err).toMatchObject({ statusCode: 401, errorCode: 'UNAUTHORIZED' });
  });

  it('calls next(AppError 401) when user from token does not exist in DB', async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ sub: 'uuid-ghost', iat: 0, exp: 9999999999 } as never);
    vi.mocked(AuthRepository.findById).mockResolvedValueOnce(null);

    const req: Partial<Request> = {
      headers: { authorization: 'Bearer valid.token.here' },
    };
    const err = await callMiddleware(authenticate, req);
    expect(err).toMatchObject({ statusCode: 401, errorCode: 'UNAUTHORIZED' });
  });

  it('attaches req.user and calls next() with no error on valid token + existing user', async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ sub: 'uuid-1', iat: 0, exp: 9999999999 } as never);
    vi.mocked(AuthRepository.findById).mockResolvedValueOnce(mockUserRow);

    const req: Partial<Request> = {
      headers: { authorization: 'Bearer valid.token.here' },
    };
    const err = await callMiddleware(authenticate, req);

    expect(err).toBeUndefined();
    expect((req as Request).user).toEqual({ id: 'uuid-1', email: 'test@example.com' });
  });
});
