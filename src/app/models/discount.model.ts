import { Product } from './product.model';

export enum DiscountType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

export enum ServiceType {
  Small = 'small',
  Big = 'big',
  Salon = 'salon',
}
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
