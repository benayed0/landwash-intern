import { ServiceLocation } from './service-location.model';

export type BookingType = 'small' | 'big' | 'salon' | 'pickup';
export type CarType = 'small' | 'big' | 'pickup';

export interface Service {
  _id?: string;
  type: BookingType;
  carType?: CarType; // Optional car type for additional categorization
  price: number;
  duration: number; // Duration in minutes
  availableLocations: (string | ServiceLocation)[]; // Can be IDs or populated objects
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateServiceDto {
  type: BookingType;
  carType?: CarType;
  price: number;
  duration: number;
  availableLocations?: string[]; // Array of ServiceLocation IDs
}

export interface UpdateServiceDto {
  type?: BookingType;
  carType?: CarType;
  price?: number;
  duration?: number;
  availableLocations?: string[]; // Array of ServiceLocation IDs
}
