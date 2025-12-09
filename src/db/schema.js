const { 
  pgTable, 
  text, 
  timestamp, 
  bigint, 
  index, 
  bigserial, 
  jsonb, 
  doublePrecision, 
  primaryKey, 
  integer, 
  pgEnum, 
  varchar 
} = require("drizzle-orm/pg-core");

// =========================================
// 1. TABEL BARU (USERS)
// =========================================

const roleEnum = pgEnum('role', ['supervisor', 'technician']);
const statusEnum = pgEnum('status', ['active', 'inactive']);

const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  
  // Enum Role & Status
  role: roleEnum('role').notNull(),
  status: statusEnum('status').notNull().default('active'),
  
  specialization: varchar("specialization", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  
  last_login: timestamp("last_login", { withTimezone: true, mode: 'string' }),
  created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// =========================================
// 2. TABEL LAMA (EXISTING)
// =========================================

const retrainPointer = pgTable("retrain_pointer", {
  modelName: text("model_name").primaryKey().notNull(),
  lastRetrainTs: timestamp("last_retrain_ts", { withTimezone: true, mode: 'string' }).default('1970-01-01 08:00:00+08'),
  lastRetrainId: bigint("last_retrain_id", { mode: "number" }),
});

const modelArtifact = pgTable("model_artifact", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  modelName: text("model_name").notNull(),
  version: text().notNull(),
  metadata: jsonb(),
  promotedAt: timestamp("promoted_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index("model_artifact_idx").using("btree", table.modelName.asc().nullsLast().op("text_ops"), table.promotedAt.asc().nullsLast().op("text_ops")),
]);

const maintenanceSchedule = pgTable("maintenance_schedule", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  scheduleId: text("schedule_id").notNull(),
  productId: text("product_id").notNull(),
  unitId: text("unit_id").notNull(),
  recommendedStart: timestamp("recommended_start", { withTimezone: true, mode: 'string' }).notNull(),
  recommendedEnd: timestamp("recommended_end", { withTimezone: true, mode: 'string' }).notNull(),
  reason: text().notNull(),
  riskScore: doublePrecision("risk_score"),
  modelVersion: text("model_version"),
  actions: jsonb(),
  constraintsApplied: jsonb("constraints_applied"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  status: text(),
}, (table) => [
  index("maintenance_schedule_unit_idx").using("btree", table.productId.asc().nullsLast().op("text_ops"), table.unitId.asc().nullsLast().op("text_ops"), table.recommendedStart.asc().nullsLast().op("text_ops")),
]);

const conversationHistory = pgTable("conversation_history", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  sessionId: text("session_id").notNull(),
  message: jsonb().notNull(),
}, (table) => [
  index("ix_conversation_history_session_id").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
]);

const telemetry = pgTable("telemetry", {
  productId: text("product_id").notNull(),
  unitId: text("unit_id").notNull(),
  timestamp: text().notNull(),
  stepIndex: integer("step_index"),
  engineType: text("engine_type"),
  airTemperatureK: doublePrecision("air_temperature_K"),
  processTemperatureK: doublePrecision("process_temperature_K"),
  rotationalSpeedRpm: doublePrecision("rotational_speed_rpm"),
  torqueNm: doublePrecision("torque_Nm"),
  toolWearMin: doublePrecision("tool_wear_min"),
  isFailure: integer("is_failure"),
  failureType: text("failure_type"),
  syntheticRul: doublePrecision("synthetic_RUL"),
}, (table) => [
  index("telemetry_failure_idx").using("btree", table.isFailure.asc().nullsLast().op("int4_ops")),
  index("telemetry_unit_idx").using("btree", table.unitId.asc().nullsLast().op("text_ops")),
  primaryKey({ columns: [table.unitId, table.timestamp, table.productId], name: "telemetry_pkey"}),
]);

module.exports = {
  roleEnum,
  statusEnum,
  users,
  retrainPointer,
  modelArtifact,
  maintenanceSchedule,
  conversationHistory,
  telemetry
};
