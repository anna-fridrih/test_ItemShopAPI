import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { makePurchase } from '@/controllers/purchaseController';

const purchaseSchema = {
    body: {
        type: 'object',
        required: ['userId', 'productId'],
        properties: {
            userId: { type: 'number', minimum: 1 },
            productId: { type: 'number', minimum: 1 }
        },
        additionalProperties: false
    }
};

const purchasesRoute: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/', { schema: purchaseSchema }, makePurchase);
};

export default purchasesRoute;