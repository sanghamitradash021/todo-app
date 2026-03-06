import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ERROR_CODES } from '../config/constants';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly fields?: string[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      ...(err.fields && { fields: err.fields }),
    });
    return;
  }

  if (err instanceof ZodError) {
    // Filter empty strings: root-level .refine() errors have path [] which joins to ''
    const fields = err.errors
      .map((e) => e.path.join('.'))
      .filter((f) => f.length > 0);
    const message = err.errors[0]?.message ?? 'Validation failed';
    res.status(422).json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message,
      fields,
    });
    return;
  }

  logger.error('Unhandled error', { error: err });

  res.status(500).json({
    error: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
  });
}
