import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { appearanceSchema } from "@/lib/appearance";
import {
  MAX_INTERESTS,
  normalizeInterestLabel,
  validateInterest,
} from "@/lib/interests";

const settingsSchema = z.object({
  darkMode: z.boolean().optional(),
  countryFilter: z.string().nullable().optional(),
  genderPreference: z
    .enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"])
    .nullable()
    .optional(),
  enableNotifications: z.boolean().optional(),
  autoConnect: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  language: z.string().optional(),
  appearance: appearanceSchema.partial().optional(),
  appearanceUpdatedAt: z.string().datetime().optional(),
});

const profileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  country: z.string().max(50).optional(),
  interests: z.array(z.string()).max(MAX_INTERESTS).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settingsParsed = settingsSchema.safeParse(body);
    const profileParsed = profileSchema.safeParse(body);

    if (settingsParsed.success && Object.keys(settingsParsed.data).length > 0) {
      const { appearance, appearanceUpdatedAt, ...rest } = settingsParsed.data;

      await prisma.settings.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...rest,
          appearance: appearance ?? undefined,
          appearanceUpdatedAt: appearanceUpdatedAt
            ? new Date(appearanceUpdatedAt)
            : appearance
              ? new Date()
              : undefined,
        },
        update: {
          ...rest,
          ...(appearance !== undefined
            ? {
                appearance,
                appearanceUpdatedAt: appearanceUpdatedAt
                  ? new Date(appearanceUpdatedAt)
                  : new Date(),
              }
            : {}),
        },
      });
    }

    if (profileParsed.success && Object.keys(profileParsed.data).length > 0) {
      const { interests, ...profileData } = profileParsed.data;

      if (Object.keys(profileData).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: profileData,
        });
      }

      if (interests) {
        const normalized: { label: string; slug: string }[] = [];
        const seen = new Set<string>();

        for (const raw of interests) {
          const result = validateInterest(raw, []);
          if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 400 });
          }
          if (seen.has(result.slug)) continue;
          seen.add(result.slug);
          normalized.push({ label: result.label, slug: result.slug });
          if (normalized.length >= MAX_INTERESTS) break;
        }

        await prisma.userInterest.deleteMany({
          where: { userId: session.user.id },
        });

        for (const item of normalized) {
          const interest = await prisma.interest.upsert({
            where: { slug: item.slug },
            create: {
              name: normalizeInterestLabel(item.label),
              slug: item.slug,
            },
            update: {},
          });

          await prisma.userInterest.create({
            data: { userId: session.user.id, interestId: interest.id },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
