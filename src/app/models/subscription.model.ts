export type SubscriptionStatus = 'pending' | 'active' | 'inactive' | 'canceled' | 'expired';

export type SubscriptionRenewalType = 'auto' | 'manual';

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