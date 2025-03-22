import { User } from './user';
import { Product } from './product';

export interface Purchase {
    id: number;
    userId: User['id'];
    productId: Product['id'];
    purchaseDate: Date;
    amount: number;
}

export interface PurchaseResult {
    success: boolean;
    newBalance: number;
}