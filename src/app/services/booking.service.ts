import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingSlots, BookingStatus } from '../models/booking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/bookings'; // Update with your NestJS API URL

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/personal`);
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  getSlots(lat: number, lng: number) {
    return this.http.get<BookingSlots>(`${this.apiUrl}/slots`, {
      params: { lat: lat.toString(), lng: lng.toString() },
    });
  }
  getPendingBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}?status=pending`);
  }

  getConfirmedBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}?status=confirmed`);
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
    const update: Partial<Booking> = { status };
    if (status === 'in-progress') {
      update['startDate'] = new Date();
    }
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, update);
  }

  updateBookingPrice(id: string, price: number): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { price });
  }

  assignTeam(id: string, teamId: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { teamId });
  }

  updateBooking(id: string, updateData: Partial<Booking>): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, updateData);
  }

  // Get bookings for a specific team
  getTeamBookings(teamId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/team/${teamId}`);
  }

  // Create a new booking
  createBooking(bookingData: {
    booking: Partial<Booking>;
    userId: string;
  }): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/from-internal`, bookingData);
  }

  // Delete a booking
  deleteBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
