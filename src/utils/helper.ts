import {PoolClient, QueryResult} from "pg";

export const validateNumeric = (value: unknown, fieldName: string): number => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || typeof value === 'boolean') {
        throw new Error(`Invalid ${fieldName} format`);
    }
    return numericValue;
};

export const checkEntityExists = async (
    client: PoolClient,
    table: string,
    id: number
): Promise<boolean> => {
    const { rowCount }: QueryResult = await client.query(
        `SELECT 1 FROM ${table} WHERE id = $1`,
        [id]
    );
    return (rowCount ?? 0) > 0;
};