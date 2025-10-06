import { Personal } from './personal.model';

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
}
