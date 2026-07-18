import { createHmac } from "crypto";

/**
 * Open Relay Project publishes this static-auth secret for free TURN use
 * (e.g. Nextcloud Talk). We mint short-lived username/credential pairs for
 * browser RTCPeerConnection — no Metered dashboard account required.
 *
 * Docs: https://www.metered.ca/tools/openrelay/
 */
const OPEN_RELAY_STATIC_SECRET = "openrelayprojectsecret";
const OPEN_RELAY_HOST = "staticauth.openrelay.metered.ca";

/** Coturn-style TURN REST: username = expiryUnix:id, credential = HMAC-SHA1 */
export function createOpenRelayIceServers(userId: string, ttlSeconds = 3600): RTCIceServer[] {
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "beartv";
  const username = `${expiry}:${safeId}`;
  const credential = createHmac("sha1", OPEN_RELAY_STATIC_SECRET)
    .update(username)
    .digest("base64");

  return [
    { urls: `stun:${OPEN_RELAY_HOST}:80` },
    { urls: `stun:${OPEN_RELAY_HOST}:443` },
    {
      urls: [
        `turn:${OPEN_RELAY_HOST}:80`,
        `turn:${OPEN_RELAY_HOST}:80?transport=tcp`,
        `turn:${OPEN_RELAY_HOST}:443`,
        `turns:${OPEN_RELAY_HOST}:443?transport=tcp`,
      ],
      username,
      credential,
    },
  ];
}
