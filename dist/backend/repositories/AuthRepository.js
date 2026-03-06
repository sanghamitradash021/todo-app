"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const db_1 = require("../config/db");
exports.AuthRepository = {
    async findByEmail(email) {
        const result = await db_1.pool.query('SELECT id, email, password, created_at, updated_at FROM users WHERE email = $1', [email]);
        return result.rows[0] ?? null;
    },
    async findById(id) {
        const result = await db_1.pool.query('SELECT id, email, password, created_at, updated_at FROM users WHERE id = $1', [id]);
        return result.rows[0] ?? null;
    },
    async create(email, passwordHash) {
        const result = await db_1.pool.query(`INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, password, created_at, updated_at`, [email, passwordHash]);
        return result.rows[0];
    },
};
//# sourceMappingURL=AuthRepository.js.map