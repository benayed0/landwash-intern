import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface Subscription {
  id: string;
  plan: string;
  allowedBookingsPerMonth: number;
  used: number;
  remaining: number;
  status: 'active' | 'pending' | 'cancelled';
  renewalDate: Date;
}

interface User {
  _id: string;
  email: string;
  memberSince: Date;
  phoneNumber?: string;
  name?: string;
}

interface UserResponse {
  _id: string;
  email: string;
  memberSince: Date;
  phoneNumber?: string;
  name?: string;
  bookings: any[];
  orders: any[];
  subscription?: Subscription | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createUser(userData: {
    phoneNumber: string;
    name: string;
    email: string;
  }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, userData);
  }
  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users/${id}`);
  }

  getUserStats(): Observable<{
    totalUsers: number;
    activeSubscribers: number;
    usersWithBookings: number;
  }> {
    return this.http.get<{
      totalUsers: number;
      activeSubscribers: number;
      usersWithBookings: number;
    }>(`${this.apiUrl}/users/stats`);
  }
}
