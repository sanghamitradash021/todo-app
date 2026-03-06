import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { AuthRepository } from '../repositories/AuthRepository';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { ERROR_CODES } from '../config/constants';
import { AuthResult } from '../types';

const BCRYPT_SALT_ROUNDS = 10;

export const AuthService = {
  async register(email: string, password: string): Promise<AuthResult> {
    const existing = await AuthRepository.findByEmail(email);
    if (existing) {
      throw new AppError(
        409,
        ERROR_CODES.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists'
      );
    }

    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await AuthRepository.create(email, hash);
    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as StringValue,
    });

    return { token, user: { id: user.id, email: user.email } };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      // Same error as wrong password — no user enumeration
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as StringValue,
    });

    return { token, user: { id: user.id, email: user.email } };
  },
};
