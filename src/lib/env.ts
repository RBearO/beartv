/**
 * Validates required production environment variables.
 * Import from server entry points only — never from client components.
 */
export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const required = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SOCKET_URL",
  ] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `[BearTV] Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    throw new Error("[BearTV] AUTH_SECRET must be at least 32 characters in production.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
  if (appUrl.startsWith("http://") && !appUrl.includes("localhost")) {
    throw new Error("[BearTV] NEXT_PUBLIC_APP_URL must use HTTPS in production.");
  }
  if (socketUrl.startsWith("http://") && !socketUrl.includes("localhost")) {
    throw new Error("[BearTV] NEXT_PUBLIC_SOCKET_URL must use HTTPS in production.");
  }
}

/** Socket / signaling process validation */
export function assertSocketProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const required = ["REDIS_URL"] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `[BearTV Socket] Missing required production environment variables: ${missing.join(", ")}`
    );
  }
}

export function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
