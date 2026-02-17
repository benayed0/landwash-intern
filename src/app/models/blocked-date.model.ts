export interface BlockedDate {
  _id?: string;
  startDate: string;
  endDate: string;
  reason?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBlockedDateDto {
  startDate: string;
  endDate: string;
  reason?: string;
}
