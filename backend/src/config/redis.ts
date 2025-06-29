import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Create Redis client
let redisClient: RedisClientType;

// Connect to Redis
const connectRedis = async (): Promise<RedisClientType | null> => {
  try {
    // Kiểm tra xem có sử dụng Redis không
    const useRedis = process.env.USE_REDIS === 'true';
    
    if (!useRedis) {
      console.log('Redis is disabled, skipping connection...');
      return null;
    }
    
    const url = REDIS_PASSWORD 
      ? `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
      : `redis://${REDIS_HOST}:${REDIS_PORT}`;
    
    redisClient = createClient({
      url
    });

    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    redisClient.on('connect', () => {
      console.log(`Redis connected to ${REDIS_HOST}:${REDIS_PORT}`);
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });

    redisClient.on('end', () => {
      console.log('Redis client disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  }
};

// Get Redis client
export const getRedisClient = (): RedisClientType | null => {
  if (!redisClient) {
    console.warn('Redis client is not initialized');
    return null;
  }
  return redisClient;
};

// Set cache
export const setCache = async (
  key: string,
  value: any,
  expireTime: number = 3600
): Promise<void> => {
  try {
    if (!redisClient) return;
    
    await redisClient.set(key, JSON.stringify(value), {
      EX: expireTime // TTL in seconds
    });
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
};

// Get cache
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient) return null;
    
    const data = await redisClient.get(key);
    
    if (!data) return null;
    
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

// Delete cache
export const deleteCache = async (key: string): Promise<void> => {
  try {
    if (!redisClient) return;
    
    await redisClient.del(key);
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
  }
};

// Clear all cache
export const clearCache = async (): Promise<void> => {
  try {
    if (!redisClient) return;
    
    await redisClient.flushAll();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export default connectRedis; 