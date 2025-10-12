import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Booking, BookingSlots, BookingStatus } from '../models/booking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/bookings';

  // Centralized booking state as signals
  private allBookings = signal<Booking[]>([]);

  // Computed properties for different booking categories
  pendingBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'pending')
  );
  confirmedBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'confirmed')
  );
  inProgressBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'in-progress')
  );
  completedBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'completed')
  );
  rejectedBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'rejected')
  );
  canceledBookings = computed(() =>
    this.allBookings().filter((b) => b.status === 'canceled')
  );

  // Expose all bookings as readonly
  readonly bookings = this.allBookings.asReadonly();

  constructor() {
    // Setup Flutter JavaScript event listeners
    this.setupFlutterEventListeners();
  }

  // ==================== HTTP Methods ====================

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/personal`).pipe(
      tap((bookings) => {
        this.allBookings.set(bookings);
      })
    );
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/one/${id}`);
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
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, update).pipe(
      tap((updatedBooking) => {
        this.updateBookingInState(updatedBooking);
      })
    );
  }

  updateBookingPrice(id: string, price: number): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { price }).pipe(
      tap((updatedBooking) => {
        this.updateBookingInState(updatedBooking);
      })
    );
  }

  assignTeam(id: string, teamId: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, { teamId }).pipe(
      tap((updatedBooking) => {
        this.updateBookingInState(updatedBooking);
      })
    );
  }

  updateBooking(id: string, updateData: Partial<Booking>): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, updateData).pipe(
      tap((updatedBooking) => {
        this.updateBookingInState(updatedBooking);
      })
    );
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
    return this.http
      .post<Booking>(`${this.apiUrl}/from-internal`, bookingData)
      .pipe(
        tap((newBooking) => {
          this.addBookingToState(newBooking);
        })
      );
  }

  // Delete a booking
  deleteBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.removeBookingFromState(id);
      })
    );
  }

  // ==================== State Management Methods ====================

  /**
   * Update a booking in the local state
   */
  private updateBookingInState(updatedBooking: Booking): void {
    const currentBookings = this.allBookings();
    const index = currentBookings.findIndex(
      (b) => b._id === updatedBooking._id
    );

    if (index !== -1) {
      const newBookings = [...currentBookings];
      newBookings[index] = updatedBooking;
      this.allBookings.set(newBookings);
    }
  }

  /**
   * Add a new booking to the local state
   */
  private addBookingToState(newBooking: Booking): void {
    this.allBookings.set([...this.allBookings(), newBooking]);
  }

  /**
   * Remove a booking from the local state
   */
  private removeBookingFromState(bookingId: string): void {
    this.allBookings.set(this.allBookings().filter((b) => b._id !== bookingId));
  }

  // ==================== Real-time Update Methods (Flutter Integration) ====================

  /**
   * Manually update a booking from external source (Flutter)
   * This bypasses HTTP and directly updates the state
   */
  updateBookingFromExternal(updatedBooking: Booking): void {
    this.updateBookingInState(updatedBooking);
  }

  /**
   * Manually add a booking from external source (Flutter)
   */
  addBookingFromExternal(newBooking: Booking): void {
    this.addBookingToState(newBooking);
  }

  /**
   * Manually remove a booking from external source (Flutter)
   */
  removeBookingFromExternal(bookingId: string): void {
    this.removeBookingFromState(bookingId);
  }

  /**
   * Refresh all bookings (useful for sync operations)
   */
  refreshBookings(): void {
    this.getAllBookings().subscribe();
  }

  // ==================== Flutter JavaScript Event Listeners ====================

  /**
   * Setup event listeners for Flutter JavaScript channel
   */
  private setupFlutterEventListeners(): void {
    // Listen for booking update events from Flutter
    window.addEventListener('flutter-booking-update', ((event: CustomEvent) => {
      const updatedBooking = event.detail as Booking;
      console.log('Received booking update from Flutter:', updatedBooking);
      this.updateBookingFromExternal(updatedBooking);
    }) as EventListener);

    // Listen for booking create events from Flutter
    window.addEventListener('flutter-booking-create', ((event: CustomEvent) => {
      const newBooking = event.detail as Booking;
      console.log('Received new booking from Flutter:', newBooking);
      this.addBookingFromExternal(newBooking);
    }) as EventListener);

    // Listen for booking delete events from Flutter
    window.addEventListener('flutter-booking-delete', ((event: CustomEvent) => {
      const bookingId = event.detail.bookingId as string;
      console.log('Received booking delete from Flutter:', bookingId);
      this.removeBookingFromExternal(bookingId);
    }) as EventListener);

    // Listen for refresh all bookings event from Flutter
    window.addEventListener('flutter-booking-refresh', (() => {
      console.log('Received booking refresh request from Flutter');
      this.refreshBookings();
    }) as EventListener);
  }
}
