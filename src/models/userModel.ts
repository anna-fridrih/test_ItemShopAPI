import { Pool } from 'pg';
import { User } from '@/types/user';

const pool = new Pool();

export const getUserById = async (id: number): Promise<User> => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

export const updateUserBalance = async (userId: number, amount: number): Promise<User> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE users 
           SET balance = balance + $1 
           WHERE id = $2 
           RETURNING *`,
            [amount, userId]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};


export const createUser = async (username: string, initialBalance: number): Promise<User> => {
    const result = await pool.query(
        `INSERT INTO users (username, balance)
         VALUES ($1, $2)
         RETURNING *`,
        [username, initialBalance]
    );
    return result.rows[0];
};

export const getUserBalance = async (userId: number): Promise<number> => {
    const result = await pool.query(
        'SELECT balance FROM users WHERE id = $1',
        [userId]
    );
    return result.rows[0]?.balance;
};