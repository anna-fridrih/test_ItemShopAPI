import { Pool } from 'pg';
import { Product } from '@/types/product';

const pool = new Pool();

export const createProduct = async (name: string, price: number): Promise<Product> => {
    const result = await pool.query(
        'INSERT INTO products(name, price) VALUES($1, $2) RETURNING *',
        [name, price]
    );
    return result.rows[0];
};

export const getProductById = async (id: number): Promise<Product> => {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
};