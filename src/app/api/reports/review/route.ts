import { NextResponse } from "next/server";
import { auth, isModerator } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  reportId: z.string(),
  status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]),
  reviewNote: z.string().optional(),
  banUser: z.boolean().optional(),
  banType: z.enum(["TEMPORARY", "PERMANENT"]).optional(),
  banDuration: z.number().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { reportId, status, reviewNote, banUser, banType, banDuration } = parsed.data;

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewNote,
        reviewedBy: session.user.id,
      },
    });

    if (banUser && banType) {
      await prisma.ban.create({
        data: {
          userId: report.reportedId,
          type: banType,
          reason: `Report: ${report.reason}`,
          issuedBy: session.user.id,
          expiresAt:
            banType === "TEMPORARY" && banDuration
              ? new Date(Date.now() + banDuration * 3600000)
              : null,
        },
      });
    }

    await prisma.moderationLog.create({
      data: {
        moderatorId: session.user.id,
        action: `report_${status.toLowerCase()}`,
        targetId: report.reportedId,
        details: reviewNote,
      },
    });

    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isModerator(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    where: { status: { in: ["PENDING", "REVIEWING"] } },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reported: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}
