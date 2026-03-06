"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.TODO_PRIORITY = exports.TODO_STATUS = exports.JWT_EXPIRES_IN = void 0;
exports.JWT_EXPIRES_IN = '24h';
exports.TODO_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
};
exports.TODO_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};
exports.ERROR_CODES = {
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
};
//# sourceMappingURL=constants.js.map