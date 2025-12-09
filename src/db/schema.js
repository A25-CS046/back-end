const {
  pgTable,
  bigserial,
  varchar,
  timestamp,
  check,
} = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  specialization: varchar("specialization", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  status: varchar("status", { length: 10 }).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

module.exports = { users };
