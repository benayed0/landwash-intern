import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Booking } from '../../models/booking.model';
import { BookingCardComponent } from '../booking-card/booking-card.component';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { BottomBarComponent } from '../shared/bottom-bar/bottom-bar.component';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BookingCardComponent,
    NavbarComponent,
    BottomBarComponent,
  ],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.css',
})
export class WorkerDashboardComponent implements OnInit {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);

  activeTab: 'todo' | 'completed' = 'todo';
  todoBookings: Booking[] = [];
  completedBookings: Booking[] = [];
  loading = false;
  currentUser: any = null;

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadBookings();
  }

  loadBookings() {
    this.loading = true;

    // Get bookings assigned to the worker's team
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        // Filter bookings by status
        this.todoBookings = bookings.filter((b) => b.status === 'confirmed');
        this.completedBookings = bookings.filter(
          (b) => b.status === 'completed'
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading = false;
        // Fallback: try to get all bookings if team endpoint fails
        this.loadAllBookings();
      },
    });
  }

  // Fallback method if team-specific endpoint is not available
  private loadAllBookings() {
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        // Filter by team if user has teamId
        const userTeamId = this.authService.getUserTeamId();
        let teamBookings = bookings;

        if (userTeamId) {
          teamBookings = bookings.filter(
            (b) =>
              (b.teamId as any)?._id === userTeamId || b.teamId === userTeamId
          );
        }

        this.todoBookings = teamBookings.filter(
          (b) => b.status === 'confirmed'
        );
        this.completedBookings = teamBookings.filter(
          (b) => b.status === 'completed'
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading all bookings:', err);
        this.loading = false;
      },
    });
  }

  onStatusChange(event: { id: string; status: string }) {
    if (event.status === 'completed') {
      this.bookingService
        .updateBookingStatus(event.id, event.status)
        .subscribe({
          next: () => {
            this.loadBookings();
          },
          error: (err) => {
            console.error('Error updating booking status:', err);
            alert('Erreur lors de la mise à jour du statut');
          },
        });
    }
  }

  get currentBookings() {
    return this.activeTab === 'todo'
      ? this.todoBookings
      : this.completedBookings;
  }

  get sectionTitle() {
    return this.activeTab === 'todo' ? 'Travaux à faire' : 'Travaux terminés';
  }
}
