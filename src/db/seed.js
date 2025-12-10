require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  console.log("🌱 Starting seeding...");

  try {
    const supervisorPassword = await bcrypt.hash("supervisor123", 10);
    const techPassword = await bcrypt.hash("tech123", 10);

    const users = [
      {
        email: "supervisor@aegis.com",
        password: supervisorPassword,
        name: "Demo Supervisor",
        role: "supervisor",
        specialization: null,
        phone: null,
        status: "active",
      },
      {
        email: "tech@aegis.com",
        password: techPassword,
        name: "Demo Technician",
        role: "technician",
        specialization: "General Maintenance",
        phone: null,
        status: "active",
      },
    ];

    for (const user of users) {
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  User "${user.email}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO users (email, password, name, role, specialization, phone, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          user.email,
          user.password,
          user.name,
          user.role,
          user.specialization,
          user.phone,
          user.status,
        ]
      );
      console.log(`✅ User "${user.email}" seeded`);
    }

    console.log("🎉 Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();
