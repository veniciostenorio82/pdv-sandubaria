export type ProductCategory = 'lanche' | 'bebida' | 'acompanhamento';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  emoji: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  observations?: string;
}

export type PaymentMethod = 'dinheiro' | 'cartao-credito' | 'cartao-debito' | 'pix';

export interface PaymentEntry {
  id: string;
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  change?: number;
}

export type AppStep =
  | 'inicial'
  | 'categoria'
  | 'produtos'
  | 'carrinho'
  | 'pagamento'
  | 'finalizacao';

export interface Order {
  items: OrderItem[];
  payments: PaymentEntry[];
  createdAt?: Date;
  orderNumber?: string;
}
