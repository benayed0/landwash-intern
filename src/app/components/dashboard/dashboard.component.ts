import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Booking } from '../../models/booking.model';
import { BookingCardComponent } from '../booking-card/booking-card.component';
import { PriceConfirmModalComponent } from '../price-confirm-modal/price-confirm-modal.component';
import { TeamAssignModalComponent } from '../team-assign-modal/team-assign-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BookingCardComponent, PriceConfirmModalComponent, TeamAssignModalComponent],
  templateUrl: './dashboard.component.html',
  styles: `
    .dashboard-container {
      min-height: 100vh;
      background: #0a0a0a;
      padding-bottom: 80px;
    }

    .header {
      background: #1a1a1a;
      padding: 20px;
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      border-bottom: 1px solid rgba(195, 255, 0, 0.2);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: #c3ff00;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #1a1a1a;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 600;
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .tabs {
      display: flex;
      background: #1a1a1a;
      padding: 10px;
      gap: 10px;
      overflow-x: auto;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    }

    .tab {
      flex: 1;
      min-width: 120px;
      padding: 12px 20px;
      background: #2a2a2a;
      color: #999;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      white-space: nowrap;
    }

    .tab.active {
      background: #c3ff00;
      color: #0a0a0a;
      font-weight: 600;
    }

    .content {
      padding: 20px;
    }

    .section-title {
      color: white;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #2a2a2a;
      display: flex;
      justify-content: space-around;
      padding: 10px 0;
      border-top: 1px solid #333;
      z-index: 100;
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      color: #666;
      text-decoration: none;
      transition: all 0.3s;
      cursor: pointer;
      background: none;
      border: none;
    }

    .nav-item.active {
      color: #c3ff00;
    }

    .nav-icon {
      font-size: 24px;
    }

    .nav-label {
      font-size: 11px;
    }

    .refresh-btn {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 56px;
      height: 56px;
      background: #c3ff00;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(195, 255, 0, 0.4);
      transition: all 0.3s;
    }

    .refresh-btn:hover {
      transform: scale(1.1);
    }

    @media (max-width: 480px) {
      .header-content {
        flex-direction: column;
        gap: 10px;
      }

      .tabs {
        justify-content: flex-start;
      }

      .tab {
        min-width: 100px;
        font-size: 14px;
      }
    }
  `
})
export class DashboardComponent implements OnInit {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private pushNotificationService = inject(PushNotificationService);
  private router = inject(Router);

  activeTab = 'pending';
  pendingBookings: Booking[] = [];
  confirmedBookings: Booking[] = [];
  completedBookings: Booking[] = [];
  loading = false;

  // Modal state
  showPriceModal = false;
  selectedBookingForCompletion: Booking | null = null;

  showTeamModal = false;
  selectedBookingForTeam: Booking | null = null;

  ngOnInit() {
    // The admin guard already ensures authentication, so we can just load data
    this.loadBookings();
    this.initializePushNotifications();

    // Optional: Refresh user data in the background without redirecting
    this.authService.refreshUserData().subscribe({
      error: (err) => {
        console.error('Error refreshing user data:', err);
      }
    });
  }

  private async initializePushNotifications() {
    try {
      const permission = await this.pushNotificationService.requestPermission();
      if (permission === 'granted') {
        await this.pushNotificationService.subscribeToNotifications();
        this.pushNotificationService.listenForMessages();
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  loadBookings() {
    this.loading = true;
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.pendingBookings = bookings.filter(b => b.status === 'pending');
        this.confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        this.completedBookings = bookings.filter(b => b.status === 'completed');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading = false;
      }
    });
  }

  onStatusChange(event: { id: string, status: string }) {
    this.bookingService.updateBookingStatus(event.id, event.status).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (err) => {
        console.error('Error updating booking:', err);
      }
    });
  }

  onRequestComplete(booking: Booking) {
    this.selectedBookingForCompletion = booking;
    this.showPriceModal = true;
  }

  onConfirmComplete(event: { id: string, price: number }) {
    // First update the price if it changed
    const booking = this.selectedBookingForCompletion;
    if (!booking) return;

    // Check if price changed
    const priceChanged = booking.price !== event.price;

    if (priceChanged) {
      // Update price first, then status
      this.bookingService.updateBookingPrice(event.id, event.price).subscribe({
        next: () => {
          // Now update status to completed
          this.updateToCompleted(event.id);
        },
        error: (err) => {
          console.error('Error updating price:', err);
          alert('Erreur lors de la mise à jour du prix');
        }
      });
    } else {
      // Just update status to completed
      this.updateToCompleted(event.id);
    }
  }

  private updateToCompleted(bookingId: string) {
    this.bookingService.updateBookingStatus(bookingId, 'completed').subscribe({
      next: () => {
        this.loadBookings();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error completing booking:', err);
        alert('Erreur lors de la complétion de la réservation');
      }
    });
  }

  closeModal() {
    this.showPriceModal = false;
    this.selectedBookingForCompletion = null;
  }

  onRequestConfirm(booking: Booking) {
    this.selectedBookingForTeam = booking;
    this.showTeamModal = true;
  }

  onConfirmAssign(event: { id: string, teamId: string }) {
    // First assign team, then update status to confirmed
    this.bookingService.assignTeam(event.id, event.teamId).subscribe({
      next: () => {
        // Now update status to confirmed
        this.updateToConfirmed(event.id);
      },
      error: (err) => {
        console.error('Error assigning team:', err);
        alert('Erreur lors de l\'assignation de l\'équipe');
      }
    });
  }

  private updateToConfirmed(bookingId: string) {
    this.bookingService.updateBookingStatus(bookingId, 'confirmed').subscribe({
      next: () => {
        this.loadBookings();
        this.closeTeamModal();
      },
      error: (err) => {
        console.error('Error confirming booking:', err);
        alert('Erreur lors de la confirmation de la réservation');
      }
    });
  }

  closeTeamModal() {
    this.showTeamModal = false;
    this.selectedBookingForTeam = null;
  }

  logout() {
    this.authService.logout();
  }

  get currentBookings() {
    switch (this.activeTab) {
      case 'pending':
        return this.pendingBookings;
      case 'confirmed':
        return this.confirmedBookings;
      case 'completed':
        return this.completedBookings;
      default:
        return [];
    }
  }

  get sectionTitle() {
    switch (this.activeTab) {
      case 'pending':
        return 'Réservations en attente';
      case 'confirmed':
        return 'Réservations confirmées';
      case 'completed':
        return 'Historique';
      default:
        return '';
    }
  }
}