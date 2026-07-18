import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseStunServers } from "@/lib/utils";

/**
 * Authenticated ICE server config.
 * STUN URLs are public; TURN credentials stay server-side when TURN_USERNAME/TURN_PASSWORD are set.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const iceServers: RTCIceServer[] = parseStunServers(
    process.env.NEXT_PUBLIC_STUN_SERVERS || process.env.NEXT_PUBLIC_STUN_URL
  );

  const turnUrls = [
    process.env.TURN_URL || process.env.NEXT_PUBLIC_TURN_URL,
    process.env.TURNS_URL || process.env.NEXT_PUBLIC_TURNS_URL,
  ].filter((u): u is string => Boolean(u?.trim()));

  const turnUser =
    process.env.TURN_USERNAME || process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass =
    process.env.TURN_PASSWORD ||
    process.env.TURN_CREDENTIAL ||
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrls.length > 0 && turnUser && turnPass) {
    iceServers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: turnUser,
      credential: turnPass,
    });
  }

  return NextResponse.json({
    iceServers,
    turnConfigured: Boolean(turnUrls.length && turnUser && turnPass),
  });
}
