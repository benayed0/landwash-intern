export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'paid'
  | 'cancelled'
  | 'completed';

export interface OrderProduct {
  _id: string;
  productId: {
    _id: string;
    type: string;
    name: string;
    pictures: string[];
    price: number;
    details: string;
    instructions_of_use: string;
    nested_products: any[];
    __v: number;
  };
  quantity: number;
  price: number;
}

export interface Order {
  _id?: string;
  userId: {
    _id: string;
    memberSince: Date;
    phoneNumber: string;
    name: string;
  };
  products: OrderProduct[];
  totalPrice: number;
  date: Date;
  status: OrderStatus;
  shippingAddress: string;
  location: { lat: number; lng: number };
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}