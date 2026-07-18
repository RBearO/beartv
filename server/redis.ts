import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL?.trim()) {
      throw new Error("[BearTV Socket] REDIS_URL is required in production.");
    }
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
  }
  return redis;
}

export const QUEUE_KEY = "beartv:matchmaking:queue";
export const ONLINE_KEY = "beartv:online:users";
export const SOCKET_USER_PREFIX = "beartv:socket:";
