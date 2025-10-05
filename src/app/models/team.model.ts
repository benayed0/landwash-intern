export interface Team {
  _id?: string;
  name: string;
  members: string[];
  createdAt?: Date;
  coordinates?: [number, number];
  radius?: number;
}
