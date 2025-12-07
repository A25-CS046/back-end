const { drizzle } = require("drizzle-orm/node-postgres");
const {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
} = require("drizzle-orm/pg-core");
const { pool } = require("./database");

const db = drizzle(pool);

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull(),
  password: text("password").notNull(),
  name: varchar("name", { length: 256 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

module.exports = { db, users };
