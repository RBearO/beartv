import { NextResponse } from "next/server";
import { verifyTurnstile } from "@/services/turnstile";
import { getClientIp } from "@/services/rate-limit";
import { z } from "zod";

const schema = z.object({ token: z.string() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const ip = getClientIp(request);
    const valid = await verifyTurnstile(parsed.data.token, ip);

    return NextResponse.json({ success: valid });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
