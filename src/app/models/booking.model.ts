export type BookingType = 'small' | 'big' | 'salon';
export type BookingStatus =
  | 'pending'
  | 'rejected'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'canceled';

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
  startDate?: Date;
  delayedOf?: number; // in minutes
  status: BookingStatus;
  withSub: boolean;
  salonsSeats?: number;
  address?: string;
  coordinates: [number, number]; // [lng, lat]
  userId: {
    memberSince: Date;
    _id: string;
    email: string;
    phoneNumber: string;
    name: string;
  };
  teamId?: string | TeamInfo;
  secondaryNumber?: string;
}
export interface BookingSlots {
  daySlots: { date: string; slots: [string, string][] }[]; // These are BOOKED slots
  availableTeams: {
    count: number;
    nearestTeam: {
      _id: string;
      distance: number;
    };
  };
}
