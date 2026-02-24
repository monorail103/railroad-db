import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Neonは中身PostgreSQLです
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});