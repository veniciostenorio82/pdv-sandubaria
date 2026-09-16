export interface PrintItem {
  name: string;
  quantity: number;
  unitPrice: number;
  observations?: string;
}

export interface PrintPayment {
  method: string;
  amount: number;
  cashReceived?: number;
  change?: number;
}

export interface PrintPayload {
  orderNumber: number | string;
  items: PrintItem[];
  total: number;
  paymentMethod: string;
  payments?: PrintPayment[];
}
