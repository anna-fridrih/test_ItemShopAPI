import { logger } from '@/utils/logger';
import { pool } from '@/config/db';
import { PurchaseResult } from '@/types/purchase'
import {UserProductData} from "@/types/product";
import {validateNumeric, checkEntityExists} from '@/utils/helper'


export const buyProduct = async (
    userId: number,
    productId: number
): Promise<PurchaseResult> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('SAVEPOINT purchase_transaction');

        // Проверка существования сущностей
        const [userExists, productExists] = await Promise.all([
            checkEntityExists(client, 'users', userId),
            checkEntityExists(client, 'products', productId)
        ]);

        if (!userExists || !productExists) {
            const errorMessage = !userExists ? 'User not found' : 'Product not found';
            logger.error({ userId, productId }, errorMessage);
            throw new Error(errorMessage);
        }

        const userQuery = await client.query<UserProductData>(
            `SELECT balance FROM users 
             WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        const productQuery = await client.query<UserProductData>(
            `SELECT price FROM products 
             WHERE id = $1 FOR UPDATE`,
            [productId]
        );

        const balance = validateNumeric(userQuery.rows[0]?.balance, 'balance');
        const price = validateNumeric(productQuery.rows[0]?.price, 'price');

        if (balance < price) {
            logger.error({ userId, balance, price }, 'Insufficient funds');
            throw new Error('Insufficient funds');
        }

        const newBalance = Number((balance - price).toFixed(2));

        await client.query(
            `UPDATE users 
             SET balance = $1 
             WHERE id = $2`,
            [newBalance, userId]
        );

        await client.query(
            `INSERT INTO purchases 
                (user_id, product_id, amount) 
             VALUES ($1, $2, $3)`,
            [userId, productId, price]
        );

        await client.query('RELEASE SAVEPOINT purchase_transaction');
        await client.query('COMMIT');

        logger.info(
            { userId, productId, newBalance },
            'Purchase completed successfully'
        );

        return { success: true, newBalance };
    } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT purchase_transaction');

        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown transaction error';

        logger.error(
            { userId, productId, error: errorMessage },
            'Purchase transaction failed'
        );

        throw new Error(`Failed to process purchase: ${errorMessage}`);
    } finally {
        client.release();
    }
};