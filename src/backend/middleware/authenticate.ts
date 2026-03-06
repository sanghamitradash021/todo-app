import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../config/constants';
import { AuthRepository } from '../repositories/AuthRepository';
import { asyncHandler } from '../utils/asyncHandler';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }

    const token = authHeader.slice(7);
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }

    const user = await AuthRepository.findById(payload.sub);
    if (!user) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }

    req.user = { id: user.id, email: user.email };
    next();
  }
);
