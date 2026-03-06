"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
exports.env = {
    PORT: parseInt(process.env['PORT'] ?? '3001', 10),
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    DATABASE_URL: requireEnv('DATABASE_URL'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '24h',
    LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
};
//# sourceMappingURL=env.js.map