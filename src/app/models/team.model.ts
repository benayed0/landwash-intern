import { Personal } from './personal.model';
import { ServiceLocation } from './service-location.model';

export interface Team {
  _id?: string;
  name: string;
  members: string[] | Personal[] | undefined;
  chiefId?:
    | {
        _id: string;
        name: string;
        email: string;
      }
    | string;
  createdAt?: Date;
  coordinates?: [number, number];
  radius?: number;
  // Note: locations are not stored in Team, but we include this for UI purposes
  // when we need to show which locations a team is assigned to
  assignedLocations?: ServiceLocation[];
}
