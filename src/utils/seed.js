// seed.js
const { drizzle } = require("drizzle-orm/node-postgres");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const schema = require("../db/schema"); // Pastikan path ini benar
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const db = drizzle(client, { schema });

  console.log("🌱 Memulai proses seeding...");

  // Daftar User yang akan dibuat
  const usersToSeed = [
    {
      name: "Super Admin",
      email: "supervisor@aegis.com",
      plainPassword: "supervisor123",
      role: "supervisor",
      status: "active",
      phone: "081299998888",
      specialization: "Factory Manager", // Supervisor punya jabatan general
    },
    {
      name: "Budi Teknisi",
      email: "tech@aegis.com",
      plainPassword: "tech123",
      role: "technician",
      status: "active",
      phone: "081277776666",
      specialization: "Hydraulic Pump Specialist", // Biar keren di UI Profile nanti
    },
  ];

  for (const user of usersToSeed) {
    try {
      // 1. Cek apakah user sudah ada (opsional, tapi insert akan gagal jika duplicate)
      // Kita langsung hash saja passwordnya
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.plainPassword, salt);

      // 2. Insert ke Database
      await db.insert(schema.users).values({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        status: user.status,
        phone: user.phone,
        specialization: user.specialization,
        last_login: new Date().toISOString(),
      });

      console.log(`✅ User dibuat: ${user.email} | Pass: ${user.plainPassword} | Role: ${user.role}`);

    } catch (error) {
      if (error.code === '23505') {
        console.log(`⚠️  User ${user.email} sudah ada. Skip.`);
      } else {
        console.error(`❌ Gagal membuat user ${user.email}:`, error.message);
      }
    }
  }

  console.log("🏁 Seeding selesai!");
  await client.end();
}

main();