import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/bookings'; // Update with your NestJS API URL

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl);
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  getPendingBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}?status=pending`);
  }

  getConfirmedBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}?status=confirmed`);
  }

  updateBookingStatus(id: string, status: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { status });
  }

  updateBookingPrice(id: string, price: number): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { price });
  }

  assignTeam(id: string, teamId: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { teamId });
  }
}