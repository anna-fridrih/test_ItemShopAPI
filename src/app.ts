import Fastify from 'fastify';
import itemsRoutes from './routes/itemsRoutes';
import purchasesRoute from './routes/purchaseRoutes';
import { logger } from './utils/logger';
import {redisClient} from "src/config/redis";

export const buildApp = () => {
    const fastify = Fastify({
        logger: logger, // Используем кастомный логгер
        disableRequestLogging: process.env.NODE_ENV === 'production'
    });

    redisClient.connect().then(() => {
        logger.info('Redis client connected');
    }).catch((err) => {
        logger.fatal(err, 'Redis connection failed');
        process.exit(1);
    });

    fastify.addHook('onClose', async () => {
        logger.info('Closing Redis connection');
        await redisClient.quit();
    });
    fastify.addHook('onRequest', (request, reply, done) => {
        logger.info({
            method: request.method,
            url: request.url,
            ip: request.ip
        }, 'Incoming request');
        done();
    });

    fastify.addHook('onResponse', (request, reply, done) => {
        logger.info({
            statusCode: reply.statusCode,
        }, 'Request completed');
        done();
    });

    fastify.register(itemsRoutes);
    fastify.register(purchasesRoute, { prefix: '/purchases' });

    return fastify;
};