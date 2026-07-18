import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;

// Queue keys
export const QUEUE_KEY = "beartv:matchmaking:queue";
export const ONLINE_KEY = "beartv:online:users";
export const RATE_LIMIT_PREFIX = "beartv:ratelimit:";
export const SPAM_PREFIX = "beartv:spam:";
