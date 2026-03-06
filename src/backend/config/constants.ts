export const JWT_EXPIRES_IN = '24h';

export const TODO_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export const TODO_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const ERROR_CODES = {
  // Auth
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  // Todos
  TODO_NOT_FOUND: 'TODO_NOT_FOUND',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
