import { FastifyRequest, FastifyReply } from 'fastify';
import { redisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import { Item, ProcessedItem, SaleItem } from '@/types/item';
import SkinportParams from "@/types/skiport_params";


const getCacheKey = (app_id: string = '730', currency: string = 'USD') =>
    `skinport:items:${app_id}:${currency}`;

const API_URL = process.env.SKINPORT_API_URL || 'https://api.skinport.com/v1/items?app_id=730&currency=USD';
const MAX_RETRIES = parseInt(process.env.SKINPORT_API_RETRIES || '3', 10);
const RETRY_DELAY = parseInt(process.env.SKINPORT_API_DELAY || '2000', 10);

const fetchWithRetry = async (url: string, retries = MAX_RETRIES, delay = RETRY_DELAY): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SkinportItemsFetcher/1.0'
                }
            });

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10) * 1000;
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                continue;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
    throw new Error('Max retries exceeded');
};

export const fetchItems =async (
    req: FastifyRequest<{ Querystring: SkinportParams }>,
    reply: FastifyReply
) => {
    const { app_id = '730', currency = 'USD' } = req.query;
    const cacheKey = getCacheKey(app_id, currency);
    const fallbackCacheKey = `${cacheKey}:fallback`;


    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.debug('Returning cached items');
            return reply.send({ items: JSON.parse(cachedData) });
        }

        logger.info('Fetching fresh items from Skinport API');
        const response = await fetchWithRetry(API_URL);
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid API response format');
        }

        const processedItems = processItems(data as Item[]);

        await redisClient.setEx(cacheKey, 300, JSON.stringify(processedItems));
        await redisClient.set(fallbackCacheKey, JSON.stringify(processedItems));

        return reply.send({ items: processedItems });
    } catch (error) {
        logger.error('Failed to fetch items:', error);

        // Пытаемся вернуть старые данные из резервного кэша
        const fallbackData = await redisClient.get(fallbackCacheKey);
        if (fallbackData) {
            logger.warn('Using fallback cache');
            return reply.code(503).send({
                error: 'Service Unavailable',
                message: 'Using cached data from previous successful request',
                items: JSON.parse(fallbackData)
            });
        }

        return reply.status(500).send({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// const processItems = (items: Item[]): ProcessedItem[] => {
//     return items.map(item => {
//         const sales = item.sales || [];
//
//         const tradable = sales
//             .filter(s => s?.tradable)
//             .sort((a, b) => (a?.price || 0) - (b?.price || 0));
//
//         const nonTradable = sales
//             .filter(s => !s?.tradable)
//             .sort((a, b) => (a?.price || 0) - (b?.price || 0));
//
//         return {
//             name: item.market_hash_name || 'Unknown Item',
//             min_prices: {
//                 tradable: tradable[0]?.price || 0,
//                 non_tradable: nonTradable[0]?.price || 0
//             }
//         };
//     });
// };
const processItems = (items: Item[]): ProcessedItem[] => {
    return items.map(item => {
        // Фильтруем и валидируем структуру sales
        const validSales = (item.sales || [])
            .filter((s): s is SaleItem =>
                typeof s === 'object' &&
                'tradable' in s &&
                'price' in s
            );

        // Обработка tradable цен
        const tradablePrices = validSales
            .filter(s => s.tradable)
            .map(s => s.price)
            .sort((a, b) => a - b);

        // Обработка non-tradable цен
        const nonTradablePrices = validSales
            .filter(s => !s.tradable)
            .map(s => s.price)
            .sort((a, b) => a - b);

        return {
            name: item.market_hash_name || 'Unknown Item',
            min_prices: {
                tradable: tradablePrices[0] ?? null, // Используем null вместо 0
                non_tradable: nonTradablePrices[0] ?? null
            }
        };
    });
};
export const startCacheUpdater = () => {
    setInterval(async () => {
        try {
            const response = await fetchWithRetry(API_URL);
            const data = await response.json();

            if (Array.isArray(data)) {
                const processed = processItems(data as Item[]);
                await redisClient.setEx('skinport:items', 3600, JSON.stringify(processed));
                await redisClient.set('skinport:items:fallback', JSON.stringify(processed));
                logger.info('Cache updated successfully');
            }
        } catch (error) {
            logger.warn('Cache update failed:', error);
        }
    }, 5 * 60 * 1000);
};