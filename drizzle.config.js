const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

