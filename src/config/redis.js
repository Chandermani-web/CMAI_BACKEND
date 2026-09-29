import Redis from 'ioredis';

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL || (
  upstashUrl && upstashToken
    ? `rediss://default:${encodeURIComponent(upstashToken)}@${new URL(upstashUrl).hostname}:6379`
    : undefined
);

const redis = new Redis(redisUrl || 'redis://127.0.0.1:6379');

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

export default redis;