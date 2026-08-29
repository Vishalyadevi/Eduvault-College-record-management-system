import Redis from 'ioredis';

// Setup Redis client connection
let redisClient;

const options = {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  retryStrategy(times) {
    return Math.min(times * 1000, 30000);
  },
};

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, options);
} else {
  // Graceful fallback to localhost
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    ...options,
  });
}

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  // Silent warning instead of loud error to prevent log spamming if Redis is not used
  if (err.code === 'ECONNREFUSED') {
    // only log once per minute to avoid spam
    if (!global.lastRedisError || Date.now() - global.lastRedisError > 60000) {
      console.warn('⚠️ Redis not available on 127.0.0.1:6379 (using in-memory/direct DB fallback)');
      global.lastRedisError = Date.now();
    }
  } else {
    console.error('❌ Redis error:', err.message);
  }
});

export default redisClient;
