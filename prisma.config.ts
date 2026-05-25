import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const isMigrationCommand = process.argv.includes("migrate");
const datasourceUrl =
  isMigrationCommand || process.env.DIRECT_DATABASE_URL ? env("DIRECT_DATABASE_URL") : env("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs"
  },
  datasource: {
    // Migrations use the direct/session pooler. Generate/build can run with runtime DATABASE_URL on Vercel.
    url: datasourceUrl
  }
});
