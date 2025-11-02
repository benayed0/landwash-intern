export interface ServiceLocation {
  _id?: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateServiceLocationDto {
  coordinates: [number, number];
  address: string;
  isActive?: boolean;
}

export interface UpdateServiceLocationDto {
  coordinates?: [number, number];
  address?: string;
  isActive?: boolean;
}
