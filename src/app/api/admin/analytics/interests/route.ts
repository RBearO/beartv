import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth";
import prisma from "@/lib/prisma";

export type TopInterestResult = {
  rank: number;
  interestId: string;
  name: string;
  userCount: number;
  percentage: number;
};

export async function GET() {
  const { error } = await requireModerator();
  if (error) return error;

  try {
    const [rows, usersWithInterests] = await Promise.all([
      prisma.$queryRaw<
        Array<{ id: string; name: string; userCount: number }>
      >`
        SELECT
          i.id,
          i.name,
          COUNT(DISTINCT ui."userId")::int AS "userCount"
        FROM "UserInterest" ui
        INNER JOIN "Interest" i ON i.id = ui."interestId"
        GROUP BY i.id, i.name
        ORDER BY COUNT(DISTINCT ui."userId") DESC, i.name ASC
        LIMIT 5
      `,
      prisma.userInterest.findMany({
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);

    const totalUsersWithInterests = usersWithInterests.length;

    const interests: TopInterestResult[] = rows.map((row, index) => ({
      rank: index + 1,
      interestId: row.id,
      name: row.name,
      userCount: row.userCount,
      percentage:
        totalUsersWithInterests === 0
          ? 0
          : Math.round((row.userCount / totalUsersWithInterests) * 1000) / 10,
    }));

    return NextResponse.json({
      interests,
      totalUsersWithInterests: usersWithInterests.length,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load interest analytics" }, { status: 500 });
  }
}
