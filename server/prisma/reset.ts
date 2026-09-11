import prisma from "../src/config/prisma";

// Every table, quoted, for a single cascading truncate.
export const TABLES = [
  "ChatMessage",
  "Dispute",
  "SupportTicket",
  "Evaluation",
  "PointEntry",
  "TrialAttempt",
  "TrialCheck",
  "Trial",
  "Payment",
  "PaymentMethod",
  "Task",
  "Job",
  "KycSubmission",
  "StudentProfile",
  "ClientProfile",
  "Sector",
  "User",
];

/** Delete ALL rows from every table in one statement. */
export async function clearAll() {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

async function main() {
  await clearAll();
  // eslint-disable-next-line no-console
  console.log("✓ All WorkBridge data deleted.");
}

// Run when invoked directly (npm run db:reset).
main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
