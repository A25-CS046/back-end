CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL CHECK (role IN ('supervisor', 'technician')),
	"specialization" varchar(100),
	"phone" varchar(20),
	"status" varchar(10) NOT NULL CHECK (status IN ('active', 'inactive')),
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
