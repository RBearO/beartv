import { NextResponse } from "next/server";
import { auth, isAdmin, isModerator } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, pendingReports, activeBans, matchesToday, moderationLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.ban.count({ where: { isActive: true } }),
      prisma.matchHistory.count({ where: { createdAt: { gte: today } } }),
      prisma.moderationLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { moderator: { select: { name: true } } },
      }),
    ]);

  return NextResponse.json({
    totalUsers,
    onlineUsers: 0,
    pendingReports,
    activeBans,
    matchesToday,
    moderationLogs,
    isAdmin: await isAdmin(session.user.email),
  });
}
