import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeBan = await prisma.ban.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      OR: [
        { type: "PERMANENT" },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (activeBan) {
    return NextResponse.json(
      { banned: true, reason: activeBan.reason, type: activeBan.type },
      { status: 403 }
    );
  }

  return NextResponse.json({ banned: false });
}
