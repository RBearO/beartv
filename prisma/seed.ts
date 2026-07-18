import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const interests = [
    "gaming", "music", "sports", "art", "tech", "travel",
    "movies", "books", "cooking", "fitness", "photography", "anime",
  ];

  for (const name of interests) {
    await prisma.interest.upsert({
      where: { slug: name },
      create: { name, slug: name },
      update: {},
    });
  }

  const adminPassword = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@beartv.com" },
    create: {
      email: "admin@beartv.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
      mustChangePassword: false,
      settings: { create: {} },
    },
    update: { role: "ADMIN" },
  });

  // Rex — temporary password; must change on first sign-in
  const rexPassword = await bcrypt.hash("rexdancer123!", 12);
  const rex = await prisma.user.upsert({
    where: { email: "rexdancer@beartv.com" },
    create: {
      email: "rexdancer@beartv.com",
      name: "Rex",
      password: rexPassword,
      role: "ADMIN" satisfies Role,
      mustChangePassword: true,
      settings: { create: {} },
    },
    update: {
      role: "ADMIN",
      // Do not overwrite password if Rex already changed it
    },
  });

  // Ensure new installs / reset seeds get the temp password only when still flagged
  if (rex.mustChangePassword) {
    await prisma.user.update({
      where: { id: rex.id },
      data: {
        password: rexPassword,
        mustChangePassword: true,
        role: "ADMIN",
      },
    });
  }

  const existingGrant = await prisma.moderationLog.findFirst({
    where: {
      moderatorId: rex.id,
      action: "ADMIN_ROLE_GRANTED",
      details: { contains: "rexdancer@beartv.com" },
    },
  });
  if (!existingGrant) {
    await prisma.moderationLog.create({
      data: {
        moderatorId: rex.id,
        action: "ADMIN_ROLE_GRANTED",
        details: "Seeded administrator account for rexdancer@beartv.com",
      },
    });
  }

  console.log("Seed completed:");
  console.log("  - Interests upserted");
  console.log("  - Admin: admin@beartv.com (existing bootstrap admin)");
  console.log("  - Rex: rexdancer@beartv.com (ADMIN, must change password on sign-in)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
