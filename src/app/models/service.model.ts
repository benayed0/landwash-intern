import { ServiceLocation } from './service-location.model';

export type BookingType = 'small' | 'big' | 'salon' | 'pickup';

export interface Service {
  _id?: string;
  type: BookingType;
  price: number;
  duration: number; // Duration in minutes
  availableLocations: (string | ServiceLocation)[]; // Can be IDs or populated objects
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateServiceDto {
  type: BookingType;
  price: number;
  duration: number;
  availableLocations?: string[]; // Array of ServiceLocation IDs
}

export interface UpdateServiceDto {
  type?: BookingType;
  price?: number;
  duration?: number;
  availableLocations?: string[]; // Array of ServiceLocation IDs
}
