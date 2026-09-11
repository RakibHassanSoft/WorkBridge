/**
 * Create (or reset) two MODERATOR accounts directly in the database.
 *
 * This is an admin script: it bypasses the public MODERATOR_SIGNUP_CODE gate,
 * so you don't need that env var set to get your coordinators in.
 *
 * Run from the `server/` folder, with DATABASE_URL pointing at the database you
 * want them in (your Render Postgres *External* URL, or whatever is already in
 * server/.env):
 *
 *   # uses the DATABASE_URL from server/.env
 *   npx tsx scripts/create-moderators.ts
 *
 *   # or target a specific database explicitly
 *   DATABASE_URL="postgresql://...render-external-url..." npx tsx scripts/create-moderators.ts
 *
 * Re-running it is safe: it upserts by email and simply resets the password.
 * Change the emails/passwords below to whatever you want before running.
 */
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MODERATORS = [
  { email: "mod1@bdfreshers.app", name: "Moderator One", password: "WorkBridge@2026" },
  { email: "mod2@bdfreshers.app", name: "Moderator Two", password: "WorkBridge@2026" },
];

async function main() {
  for (const m of MODERATORS) {
    const email = m.email.toLowerCase();
    const password = await bcrypt.hash(m.password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { password, role: Role.MODERATOR, name: m.name, isActive: true },
      create: { email, password, role: Role.MODERATOR, name: m.name, isActive: true },
    });
    console.log(`✓ moderator ready: ${user.email}  (login password: ${m.password})`);
  }
  console.log("\nDone. Log in at your site with either email + its password.");
}

main()
  .catch((e) => {
    console.error("Failed to create moderators:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
