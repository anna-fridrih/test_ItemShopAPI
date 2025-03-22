import axios from 'axios';
import {redisClient} from '@/config/redis';

export const getItems = async () => {
    const cacheKey = 'items:min_prices';
    const cached = await redisClient.get(cacheKey);

    if (cached) return JSON.parse(cached);

    const response = await axios.get('https://api.skinport.com/v1/items', {
        params: { app_id: 'default', currency: 'default' },
    });

    const items = response.data.map((item: any) => ({
        name: item.market_hash_name,
        tradable_price: Math.min(...item.prices.tradable),
        non_tradable_price: Math.min(...item.prices.non_tradable),
    }));

    await redisClient.set(cacheKey, JSON.stringify(items), { EX: 600 });
    return items;
};