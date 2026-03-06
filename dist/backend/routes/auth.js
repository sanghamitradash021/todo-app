"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../middleware/validate");
const asyncHandler_1 = require("../utils/asyncHandler");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
const AuthSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
router.post('/register', (0, validate_1.validate)(AuthSchema), (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.register));
router.post('/login', (0, validate_1.validate)(AuthSchema), (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.login));
exports.default = router;
//# sourceMappingURL=auth.js.map