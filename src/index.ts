import Fastify from 'fastify';
import itemsRoutes from './routes/itemsRoutes';
import purchasesRoutes from './routes/purchaseRoutes';
import { redisClient } from './config/redis';
import { pool } from './config/db';
import { startCacheUpdater } from './controllers/itemsController';


const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    },
    disableRequestLogging: process.env.NODE_ENV === 'production'
});

fastify.register(itemsRoutes);
fastify.register(purchasesRoutes, { prefix: '/purchases' });
startCacheUpdater();
const start = async () => {
    try {
        await Promise.all([
            redisClient.connect(),
            pool.query('SELECT 1')
        ]);

        await fastify.listen({
            port: Number(process.env.PORT) || 3000,
            host: process.env.HOST || '0.0.0.0'
        });

        fastify.log.info(`Server running on ${fastify.server.address()}`);
    } catch (err) {
        fastify.log.fatal(err);
        await Promise.allSettled([
            redisClient.quit(),
            pool.end()
        ]);
        process.exit(1);
    }
};

start();