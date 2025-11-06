import { ServiceLocation } from './service-location.model';
import { BookingType, carType } from './booking.model';

// Re-export for convenience
export type { BookingType };
export type CarType = carType;

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
