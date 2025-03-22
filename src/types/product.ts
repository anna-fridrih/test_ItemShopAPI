export interface Product {
    id: number;
    name: string;
    price: number;
    isTradable: boolean;
}
export interface UserProductData {
    balance: number;
    price: number;
}