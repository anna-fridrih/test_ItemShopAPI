import { Pool } from 'pg';
import { Purchase } from '../types/purchase';

const pool = new Pool();

export const createPurchase = async (
    userId: number,
    productId: number,
    amount: number
): Promise<Purchase> => {
    const result = await pool.query(
        `INSERT INTO purchases(user_id, product_id, amount)
     VALUES($1, $2, $3)
     RETURNING *`,
        [userId, productId, amount]
    );
    return result.rows[0];
};

export const getUserPurchases = async (userId: number): Promise<Purchase[]> => {
    const result = await pool.query(
        'SELECT * FROM purchases WHERE user_id = $1 ORDER BY purchase_date DESC',
        [userId]
    );
    return result.rows;
};