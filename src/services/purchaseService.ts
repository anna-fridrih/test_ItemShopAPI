import { logger } from '@/utils/logger';
import { pool } from '@/config/db';

export const buyProduct = async (userId: number, productId: number) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: userRows } = await client.query(
            `SELECT u.balance, p.price 
             FROM users u, products p 
             WHERE u.id = $1 AND p.id = $2 
             FOR UPDATE OF u, p`,
            [userId, productId]
        );

        if (userRows.length === 0) {
            logger.error({ userId, productId }, 'User or product not found');
            throw new Error('User or product not found');
        }

        const { balance, price } = userRows[0];

        const numericBalance = Number(balance);
        const numericPrice = Number(price);

        if (isNaN(numericBalance)) throw new Error('Invalid balance format');
        if (isNaN(numericPrice)) throw new Error('Invalid price format');

        if (numericBalance < numericPrice) {
            logger.error({
                userId,
                balance: numericBalance,
                price: numericPrice
            }, 'Insufficient funds');
            throw new Error('Insufficient funds');
        }

        const newBalance = numericBalance - numericPrice;

        await client.query(
            'UPDATE users SET balance = $1 WHERE id = $2',
            [newBalance, userId]
        );

        await client.query(
            'INSERT INTO purchases (user_id, product_id, amount) VALUES ($1, $2, $3)',
            [userId, productId, numericPrice]
        );

        await client.query('COMMIT');

        logger.info({
            userId,
            productId,
            newBalance
        }, 'Purchase completed successfully');

        return {
            success: true,
            newBalance: Number(newBalance.toFixed(2))
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({
            userId,
            productId,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Transaction failed');
        throw error;
    } finally {
        client.release();
    }
};