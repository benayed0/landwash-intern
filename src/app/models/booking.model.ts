export type BookingType = 'small' | 'big' | 'salon';
export type BookingStatus = 'pending' | 'rejected' | 'confirmed' | 'completed' | 'canceled';

export interface TeamInfo {
  _id: string;
  name: string;
  chiefId?: {
    _id: string;
    name: string;
    email: string;
  };
  members?: any[];
}

export interface Booking {
  _id?: string;
  type: BookingType;
  createdAt: Date;
  price: number;
  date: Date;
  status: BookingStatus;
  withSub: boolean;
  salonsSeats?: number;
  address?: string;
  location: { lat: number; lng: number };
  userId: string | any;
  teamId?: string | TeamInfo;
  secondaryNumber?: string;
}