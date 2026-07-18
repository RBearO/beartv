import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseStunServers } from "@/lib/utils";

/**
 * Authenticated ICE server config.
 * STUN URLs are public; TURN credentials stay server-side.
 *
 * Supported TURN sources (first match wins for TURN entries):
 * 1. Static TURN_* / NEXT_PUBLIC_TURN_* env vars
 * 2. Metered / Open Relay REST: METERED_DOMAIN + METERED_TURN_API_KEY
 *    (fetches short-lived iceServers from their credentials API)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const iceServers: RTCIceServer[] = parseStunServers(
    process.env.NEXT_PUBLIC_STUN_SERVERS || process.env.NEXT_PUBLIC_STUN_URL
  );

  let turnConfigured = false;

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
    turnConfigured = true;
  } else {
    const meteredDomain = (
      process.env.METERED_DOMAIN ||
      process.env.METERED_TURN_DOMAIN ||
      ""
    ).trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const meteredApiKey = (
      process.env.METERED_TURN_API_KEY ||
      process.env.METERED_API_KEY ||
      ""
    ).trim();

    if (meteredDomain && meteredApiKey) {
      try {
        const url = `https://${meteredDomain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(meteredApiKey)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as RTCIceServer[] | { iceServers?: RTCIceServer[] };
          const servers = Array.isArray(data)
            ? data
            : Array.isArray(data.iceServers)
              ? data.iceServers
              : [];
          for (const server of servers) {
            if (server?.urls) iceServers.push(server);
          }
          turnConfigured = servers.some((s) => {
            const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
            return urls.some((u) => typeof u === "string" && u.startsWith("turn"));
          });
        } else {
          console.error("[ICE] Metered credentials fetch failed:", res.status);
        }
      } catch (err) {
        console.error("[ICE] Metered credentials error:", err);
      }
    }
  }

  return NextResponse.json({
    iceServers,
    turnConfigured,
  });
}
