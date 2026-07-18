import { NextResponse } from "next/server";
import { auth, isModerator } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.moderationLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      moderator: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(logs);
}
