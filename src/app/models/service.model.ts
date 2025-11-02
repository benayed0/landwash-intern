export type BookingType = 'small' | 'big' | 'salon' | 'pickup';

export interface ServiceLocation {
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}

export interface Service {
  _id?: string;
  type: BookingType;
  price: number;
  duration: number; // Duration in minutes
  availableLocations: ServiceLocation[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateServiceDto {
  type: BookingType;
  price: number;
  duration: number;
  availableLocations: ServiceLocation[];
}

export interface UpdateServiceDto {
  type?: BookingType;
  price?: number;
  duration?: number;
  availableLocations?: ServiceLocation[];
}
