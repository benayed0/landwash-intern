export type Role = 'admin' | 'worker';

export interface Personal {
  _id: string;
  email: string;
  password?: string;
  role: Role;
  phone: string;
  name: string;
  createdAt: Date;
  status: string;
}
export interface CreatePersonalDto {
  email: string;
  password: string;
  role: Role;
  phone?: string;
  name: string;
}
