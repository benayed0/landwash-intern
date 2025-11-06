import { Product } from './product.model';
import { BookingType } from './booking.model';

export enum DiscountType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

// Use shared BookingType from booking.model instead of separate ServiceType enum
export type ServiceType = BookingType;

export interface Discount {
  _id?: string;
  code: string;
  type: DiscountType;
  value: number;
  expiresAt?: Date;
  maxUses: number;
  usedCount: number;
  active: boolean;
  usedBy: string[];
  applicableProducts?: (string | Product)[];
  firstOrderOnly?: boolean;
  services?: ServiceType[];
}
export interface DiscountDto {
  code: string;
  type: DiscountType;
  value: number;
  expiresAt?: Date;
  maxUses: number;
  active: boolean;
  applicableProducts?: string[];
  firstOrderOnly?: boolean;
  services?: ServiceType[];
}
