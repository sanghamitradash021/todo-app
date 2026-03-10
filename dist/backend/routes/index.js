"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const todos_1 = require("./todos");
const router = (0, express_1.Router)();
router.use('/auth', auth_1.default);
router.use('/todos', todos_1.todosRouter);
exports.default = router;
//# sourceMappingURL=index.js.map