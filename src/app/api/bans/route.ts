import { NextResponse } from "next/server";
import { auth, isModerator } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/services/rate-limit";
import { z } from "zod";

const banSchema = z.object({
  userId: z.string(),
  type: z.enum(["TEMPORARY", "PERMANENT"]),
  reason: z.string().min(3),
  durationHours: z.number().optional(),
  ipAddress: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = banSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId, type, reason, durationHours, ipAddress } = parsed.data;
    const ip = ipAddress || getClientIp(request);

    const ban = await prisma.ban.create({
      data: {
        userId,
        type,
        reason,
        ipAddress: ip,
        issuedBy: session.user.id,
        expiresAt:
          type === "TEMPORARY" && durationHours
            ? new Date(Date.now() + durationHours * 3600000)
            : null,
      },
    });

    await prisma.moderationLog.create({
      data: {
        moderatorId: session.user.id,
        action: `ban_${type.toLowerCase()}`,
        targetId: userId,
        details: reason,
        ipAddress: ip,
      },
    });

    return NextResponse.json(ban, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create ban" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active") !== "false";

  const bans = await prisma.ban.findMany({
    where: active ? { isActive: true } : {},
    include: {
      user: { select: { id: true, name: true, email: true } },
      issuer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bans);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const banId = searchParams.get("id");
  if (!banId) {
    return NextResponse.json({ error: "Ban ID required" }, { status: 400 });
  }

  const ban = await prisma.ban.update({
    where: { id: banId },
    data: { isActive: false },
  });

  await prisma.moderationLog.create({
    data: {
      moderatorId: session.user.id,
      action: "ban_lifted",
      targetId: ban.userId,
      details: `Lifted ban ${banId}`,
      ipAddress: getClientIp(request),
    },
  });

  return NextResponse.json({ success: true });
}
