import { Team } from './team.model';

export interface ServiceLocation {
  _id?: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  isActive?: boolean;
  teams?: Team[]; // Populated Team objects when fetched from API
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateServiceLocationDto {
  coordinates: [number, number];
  address: string;
  isActive?: boolean;
  teams?: string[]; // Team IDs when creating
}

export interface UpdateServiceLocationDto {
  coordinates?: [number, number];
  address?: string;
  isActive?: boolean;
  teams?: string[]; // Team IDs when updating
}
