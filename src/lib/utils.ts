import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function parseStunServers(env?: string): RTCIceServer[] {
  if (!env) {
    return [{ urls: "stun:stun.l.google.com:19302" }];
  }
  return env.split(",").map((url) => ({ urls: url.trim() }));
}

/** Client-safe fallback ICE list (STUN + optional public NEXT_PUBLIC TURN). Prefer /api/ice. */
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = parseStunServers(
    process.env.NEXT_PUBLIC_STUN_SERVERS || process.env.NEXT_PUBLIC_STUN_URL
  );

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl && process.env.NEXT_PUBLIC_TURN_USERNAME && process.env.NEXT_PUBLIC_TURN_CREDENTIAL) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  return servers;
}

export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch("/api/ice");
    if (!res.ok) return getIceServers();
    const data = (await res.json()) as { iceServers?: RTCIceServer[] };
    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return data.iceServers;
    }
  } catch {
    // fall through
  }
  return getIceServers();
}
