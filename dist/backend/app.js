"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const index_1 = __importDefault(require("./routes/index"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
    });
    next();
});
// API routes
app.use('/api', index_1.default);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Global error handler — must be last
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map