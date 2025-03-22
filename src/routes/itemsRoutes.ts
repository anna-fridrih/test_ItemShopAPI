import { FastifyPluginAsync } from 'fastify';
import { fetchItems } from '@/controllers/itemsController';

const itemsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/items', fetchItems);
};

export default itemsRoutes;