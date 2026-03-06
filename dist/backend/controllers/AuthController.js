"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
exports.AuthController = {
    async register(req, res) {
        const { email, password } = req.body;
        const result = await AuthService_1.AuthService.register(email, password);
        res.status(201).json({ data: result, message: 'Account created successfully' });
    },
    async login(req, res) {
        const { email, password } = req.body;
        const result = await AuthService_1.AuthService.login(email, password);
        res.status(200).json({ data: result, message: 'Login successful' });
    },
};
//# sourceMappingURL=AuthController.js.map