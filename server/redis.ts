import Redis from "ioredis";
import { MemoryRedis } from "./memory-redis";

type RedisLike = Redis | MemoryRedis;

let redis: RedisLike | null = null;

export function getRedis(): RedisLike {
  if (!redis) {
    const url = process.env.REDIS_URL?.trim();
    const allowMemory =
      process.env.ALLOW_INMEMORY_REDIS === "true" ||
      process.env.ALLOW_INMEMORY_REDIS === "1";

    if (!url) {
      if (process.env.NODE_ENV === "production" && !allowMemory) {
        throw new Error(
          "[BearTV Socket] REDIS_URL is required in production (or set ALLOW_INMEMORY_REDIS=true for single-instance free tier)."
        );
      }
      if (allowMemory || process.env.NODE_ENV !== "production") {
        console.warn(
          "[BearTV Socket] Using in-memory Redis stand-in. Not multi-instance safe."
        );
        redis = new MemoryRedis();
        return redis;
      }
    }

    redis = new Redis(url || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
  }
  return redis;
}

export const QUEUE_KEY = "beartv:matchmaking:queue";
export const ONLINE_KEY = "beartv:online:users";
export const SOCKET_USER_PREFIX = "beartv:socket:";
