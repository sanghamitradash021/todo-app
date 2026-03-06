"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.connectDB = connectDB;
const pg_1 = require("pg");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
});
exports.pool.on('connect', () => {
    logger_1.logger.info('PostgreSQL pool: new client connected');
});
exports.pool.on('error', (err) => {
    logger_1.logger.error('PostgreSQL pool: unexpected error on idle client', { error: err });
    process.exit(1);
});
async function connectDB() {
    const client = await exports.pool.connect();
    client.release();
    logger_1.logger.info('PostgreSQL connection established');
}
//# sourceMappingURL=db.js.map