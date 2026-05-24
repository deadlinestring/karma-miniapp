import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs"
  },
  datasource: {
    // Prisma CLI commands such as migrate should use the direct/session pooler.
    url: env("DIRECT_DATABASE_URL")
  }
});
