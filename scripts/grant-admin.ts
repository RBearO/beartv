/**
 * Grant ADMIN role to an existing user by verified email.
 *
 * Usage:
 *   npm run admin:grant -- --email=rexdancer@beartv.com
 *
 * Safe to run more than once. Refuses to create users.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseEmailArg(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--email="));
  if (!arg) return null;
  return arg.slice("--email=".length).trim().toLowerCase();
}

async function main() {
  const email = parseEmailArg();
  if (!email || !email.includes("@")) {
    console.error('Usage: npm run admin:grant -- --email="user@example.com"');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    console.error(`No user found for ${email}. They must register/sign in first.`);
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`OK: ${email} is already ADMIN (id=${user.id}).`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  await prisma.moderationLog.create({
    data: {
      moderatorId: user.id,
      action: "ADMIN_ROLE_GRANTED",
      details: `Granted ADMIN via admin:grant for ${email}`,
    },
  });

  console.log(`OK: Granted ADMIN to ${email} (id=${user.id}).`);
  console.log("Ask them to sign out and back in so their session role refreshes.");
}

main()
  .catch((err) => {
    console.error("Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
