import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const redisEnabled = (process.env.REDIS_ENABLED || "true").toLowerCase() !== "false";
const redisUrl = process.env.REDIS_URL || null;

let redis = null;
let Redis = null;

try {
  const module = await import("ioredis");
  Redis = module.default;
} catch (err) {
  console.warn("Redis cache disabled: ioredis package not installed.");
}

if (redisEnabled && Redis) {
  const options = {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy(times) {
      return Math.min(times * 1000, 30000);
    },
  };

  redis = redisUrl
    ? new Redis(redisUrl, options)
    : new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DB || 0),
        ...options,
      });

  redis.on("error", (err) => {
    if (err.code === "ECONNREFUSED") {
      if (!global.lastRedisClientError || Date.now() - global.lastRedisClientError > 60000) {
        console.warn("⚠️ Redis not available on 127.0.0.1:6379 (using in-memory/direct DB fallback)");
        global.lastRedisClientError = Date.now();
      }
    } else {
      console.error("Redis error:", err.message);
    }
  });
}

export const isRedisReady = () => Boolean(redis && redis.status === "ready");
export default redis;
