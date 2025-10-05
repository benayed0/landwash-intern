export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'canceled'
  | 'expired';

export type SubscriptionRenewalType = 'auto' | 'manual';
export type SubscriptionTransactionType =
  | 'new'
  | 'renewal'
  | 'upgrade'
  | 'downgrade';
export type SubscriptionTransactionStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'refunded';
export interface CreateSubscriptionDto {
  plan: string;
  price: number;
  allowedBookingsPerMonth: number;
  used: number;
  startDate: Date;
  renewalDate: Date;
  status: SubscriptionStatus;
  renewalType: SubscriptionRenewalType;
}
export interface Subscription {
  _id?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    memberSince: Date;
  };
  plan: string;
  price: number;
  allowedBookingsPerMonth: number;
  used: number;
  startDate: Date;
  renewalDate: Date;
  status: SubscriptionStatus;
  renewalType: SubscriptionRenewalType;
}
export interface SubscriptionTransaction {
  _id?: string;
  subscriptionId: Omit<Subscription, 'userId'> & { userId: string };
  userId: {
    _id: string;
    name: string;
    email: string | null;
    phoneNumber: string;
    memberSince: Date;
  };
  plan: string;
  amount: number;
  type: SubscriptionTransactionType;
  startDate: Date;
  endDate: Date;
  status: SubscriptionTransactionStatus;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
