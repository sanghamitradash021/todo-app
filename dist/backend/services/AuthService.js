"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AuthRepository_1 = require("../repositories/AuthRepository");
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = require("../config/env");
const constants_1 = require("../config/constants");
const BCRYPT_SALT_ROUNDS = 10;
exports.AuthService = {
    async register(email, password) {
        const existing = await AuthRepository_1.AuthRepository.findByEmail(email);
        if (existing) {
            throw new errorHandler_1.AppError(409, constants_1.ERROR_CODES.EMAIL_ALREADY_EXISTS, 'An account with this email already exists');
        }
        const hash = await bcryptjs_1.default.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await AuthRepository_1.AuthRepository.create(email, hash);
        const token = jsonwebtoken_1.default.sign({ sub: user.id }, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
        return { token, user: { id: user.id, email: user.email } };
    },
    async login(email, password) {
        const user = await AuthRepository_1.AuthRepository.findByEmail(email);
        if (!user) {
            // Same error as wrong password — no user enumeration
            throw new errorHandler_1.AppError(401, constants_1.ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
        }
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            throw new errorHandler_1.AppError(401, constants_1.ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
        }
        const token = jsonwebtoken_1.default.sign({ sub: user.id }, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
        return { token, user: { id: user.id, email: user.email } };
    },
};
//# sourceMappingURL=AuthService.js.map