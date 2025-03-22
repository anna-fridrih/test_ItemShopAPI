import { FastifyRequest, FastifyReply } from 'fastify';
import { buyProduct } from '@/services/purchaseService';
import { logger } from '@/utils/logger';

interface PurchaseBody {
    userId: number;
    productId: number;
}

export const makePurchase = async (
    req: FastifyRequest<{ Body: PurchaseBody }>,
    reply: FastifyReply
) => {
    try {
        const { userId, productId } = req.body;
        logger.info({ userId, productId }, 'Processing purchase request');

        const result = await buyProduct(userId, productId);
        logger.info({ result }, 'Purchase processed successfully');
        return reply.send(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error, userId: req.body.userId }, 'Error during purchase');

        switch (true) {
            case errorMessage.includes('User not found'):
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'User not found'
                });

            case errorMessage.includes('Product not found'):
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Product not found'
                });

            case errorMessage.includes('Insufficient funds'):
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient funds'
                });

            default:
                req.log.error('Purchase error:', error);
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to process purchase'
                });
        }
    }
};