const { drizzle } = require("drizzle-orm/node-postgres");
const { pool } = require("./database");
const schema = require("../db/schema");

const db = drizzle(pool, { schema });

module.exports = { db, ...schema };