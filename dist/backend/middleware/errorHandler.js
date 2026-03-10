"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const constants_1 = require("../config/constants");
class AppError extends Error {
    constructor(statusCode, errorCode, message, fields) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.fields = fields;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.errorCode,
            message: err.message,
            ...(err.fields && { fields: err.fields }),
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        // Filter empty strings: root-level .refine() errors have path [] which joins to ''
        const fields = err.errors
            .map((e) => e.path.join('.'))
            .filter((f) => f.length > 0);
        const message = err.errors[0]?.message ?? 'Validation failed';
        res.status(422).json({
            error: constants_1.ERROR_CODES.VALIDATION_ERROR,
            message,
            fields,
        });
        return;
    }
    logger_1.logger.error('Unhandled error', { error: err });
    res.status(500).json({
        error: constants_1.ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
    });
}
//# sourceMappingURL=errorHandler.js.map