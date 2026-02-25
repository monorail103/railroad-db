import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Drizzleに .env.local を明示的に読み込ませる
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Neonは中身PostgreSQLです
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});