import { ServiceLocation } from './service-location.model';
import { BookingType, carType } from './booking.model';

// Re-export for convenience
export type { BookingType };
export type CarType = carType;
export type ServiceType = CarType | 'all';
interface ServiceVariant {
  price: number;
  duration: number;
}
export interface Service {
  _id?: string;
  type: BookingType;
  variants: Record<ServiceType, ServiceVariant>;
  availableLocations: (string | ServiceLocation)[]; // Can be IDs or populated objects
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateServiceDto {
  type: BookingType;
  variants: Record<ServiceType, ServiceVariant>;
  availableLocations?: string[]; // Array of ServiceLocation IDs
}

export interface UpdateServiceDto {
  type?: BookingType;
  variants?: Record<ServiceType, ServiceVariant>;
  availableLocations?: string[]; // Array of ServiceLocation IDs
}
