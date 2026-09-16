export interface PrintItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PrintPayload {
  orderNumber: number | string;
  items: PrintItem[];
  total: number;
  paymentMethod: string;
}
