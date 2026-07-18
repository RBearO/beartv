import prisma from "@/lib/prisma";

export async function checkUserBan(userId: string) {
  return prisma.ban.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [
        { type: "PERMANENT" },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
}

export async function checkIpBan(ipAddress: string) {
  return prisma.ban.findFirst({
    where: {
      ipAddress,
      isActive: true,
      OR: [
        { type: "PERMANENT" },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
}

export async function logMatch(userId: string, partnerId: string, status: string) {
  return prisma.matchHistory.create({
    data: {
      userId,
      partnerId,
      status: status as "CONNECTED" | "SKIPPED" | "DISCONNECTED" | "REPORTED",
    },
  });
}
