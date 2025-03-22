import { Pool } from 'pg';
import { ProcessedItem } from '../types/item';

const pool = new Pool();

export const cacheItems = async (items: ProcessedItem[]): Promise<void> => {
    await pool.query(
        `INSERT INTO cached_items(data)
         VALUES($1)
         ON CONFLICT (id) DO UPDATE
         SET data = EXCLUDED.data,
         updated_at = NOW()`,
        [JSON.stringify(items)]
    );
};

export const getCachedItems = async (): Promise<ProcessedItem[]> => {
    const result = await pool.query(
        `SELECT data FROM cached_items
         ORDER BY updated_at DESC
         LIMIT 1`
    );
    return result.rows[0]?.data || [];
};