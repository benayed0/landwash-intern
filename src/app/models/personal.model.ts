export type Role = 'admin' | 'partner' | 'worker';

export interface Personal {
  _id: string;
  email: string;
  password?: string;
  role: Role;
  phone: string;
  name: string;
  createdAt: Date;
  status: string;
  services?: string[];
  fcmTokens?: string[];
}
export interface CreatePersonalDto {
  email: string;
  password: string;
  role: Role;
  phone?: string;
  name: string;
}
