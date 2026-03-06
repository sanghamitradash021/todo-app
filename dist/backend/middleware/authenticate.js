"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const constants_1 = require("../config/constants");
const AuthRepository_1 = require("../repositories/AuthRepository");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.authenticate = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errorHandler_1.AppError(401, constants_1.ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }
    const token = authHeader.slice(7);
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    }
    catch {
        throw new errorHandler_1.AppError(401, constants_1.ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }
    const user = await AuthRepository_1.AuthRepository.findById(payload.sub);
    if (!user) {
        throw new errorHandler_1.AppError(401, constants_1.ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
    }
    req.user = { id: user.id, email: user.email };
    next();
});
//# sourceMappingURL=authenticate.js.map