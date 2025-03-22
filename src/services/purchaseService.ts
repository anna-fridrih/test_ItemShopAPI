import { logger } from '../utils/logger';
import { pool } from '../config/db';

export const buyProduct = async (userId: number, productId: number) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        logger.info({ userId, productId }, 'Starting purchase transaction');
        const userResult = await client.query(
            'SELECT id FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );
        if (userResult.rows.length === 0) {
            logger.error({ userId }, 'User not found');
            throw new Error('User not found');
        }

        // Проверка существования товара
        const productResult = await client.query(
            'SELECT price FROM products WHERE id = $1',
            [productId]
        );
        if (productResult.rows.length === 0) {
            logger.error({ productId }, 'Product not found');
            throw new Error('Product not found');
        }

        const price = parseFloat(productResult.rows[0].price);
        const balanceResult = await client.query(
            'SELECT balance FROM users WHERE id = $1',
            [userId]
        );
        const balance = parseFloat(balanceResult.rows[0].balance);

        if (balance < price) {
            logger.error({ userId, balance, price }, 'Insufficient funds');
            throw new Error('Insufficient funds');
        }

        const newBalance = balance - price;
        await client.query(
            'UPDATE users SET balance = $1 WHERE id = $2',
            [newBalance.toFixed(2), userId]
        );

        await client.query(
            'INSERT INTO purchases (user_id, product_id, amount) VALUES ($1, $2, $3)',
            [userId, productId, price]
        );

        await client.query('COMMIT');
        logger.info({ userId, productId, newBalance }, 'Purchase completed successfully');
        return {
            success: true,
            newBalance: newBalance.toFixed(2)
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({ userId, productId, error }, 'Error during purchase');
        throw error;
    } finally {
        client.release();
    }
};