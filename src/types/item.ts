export interface Item {
    market_hash_name: string;
    sales: {
        price: number;
        tradable: boolean;
    }[];
}

export interface ProcessedItem {
    name: string;
    min_prices: {
        tradable: number;
        non_tradable: number;
    };
}

export interface SaleItem {
    tradable: boolean;
    price: number;
    condition?: string;
}