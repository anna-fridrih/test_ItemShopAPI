import { createClient } from 'redis';
import { logger } from '@/config/logger';

export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
});

redisClient.on('connect', () => logger.info('Connecting to Redis...'));
redisClient.on('ready', () => logger.info('Redis connection established'));
redisClient.on('reconnecting', () => logger.warn('Redis reconnecting'));
redisClient.on('error', (err) => logger.error(err, 'Redis error'));