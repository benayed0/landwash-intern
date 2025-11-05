export type BookingType = 'small' | 'big' | 'salon' | 'pickup' | 'paint_correction' | 'body_correction' | 'ceramic_coating';
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
  colorTone?: string; // Color tone for special booking types
  createdAt: Date;
  updatedAt: Date;
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
  subId: {
    allowedBookingsPerMonth: number;
    carPlate: string;
    plan: string;
    price: number;
    renewalDate: string; // ISO date string
    renewalType: string;
    startDate: string; // ISO date string
    status: string;
    used: number;
    userId: string;
    _id: string;
  };
  teamId?: string | TeamInfo;
  phoneNumber: string;
  secondaryNumber?: string;
  transportFee?: number;
  rating?: {
    value: number;
    comment?: string;
    photoUrl?: string;
  };
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
