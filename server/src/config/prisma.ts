import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Single PrismaClient instance shared across the app (avoids exhausting
// connections during dev hot-reload). The datasource URL is taken from the
// resolved env (which loads .env and .env.local), so the client works even
// when only .env.local is present.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: env.databaseUrl,
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
