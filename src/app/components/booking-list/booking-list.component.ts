import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { BookingCardComponent } from '../booking-card/booking-card.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { PriceConfirmModalComponent } from '../price-confirm-modal/price-confirm-modal.component';
import { TeamAssignModalComponent } from '../team-assign-modal/team-assign-modal.component';
import { RejectConfirmModalComponent } from '../reject-confirm-modal/reject-confirm-modal.component';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BookingCardComponent,
    LoadingSpinnerComponent,
    PriceConfirmModalComponent,
    TeamAssignModalComponent,
    RejectConfirmModalComponent,
  ],
  templateUrl: './booking-list.component.html',
  styles: `
    .booking-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
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
      border: 1px solid #333;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    }

    .tab.active {
      background: #c3ff00;
      color: #0a0a0a;
      border-color: #c3ff00;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(195, 255, 0, 0.3);
    }

    .tab:hover:not(.active) {
      background: #333;
      color: #e5e5e5;
      transform: translateY(-1px);
    }

    .content {
      flex: 1;
      padding: 20px;
    }

    .section-title {
      font-size: 24px;
      color: #e5e5e5;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .date-filter-container {
      background: #2a2a2a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #333;
    }

    .date-filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .date-filter-header h3 {
      margin: 0;
      color: #e5e5e5;
      font-size: 16px;
      font-weight: 600;
    }
  .apply-btn{

      padding: 10px 20px;
      background-color: #c3ff00;
      color: #0a0a0a;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      height: fit-content;
  }

    .preset-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .preset-btn {
      padding: 8px 16px;
      background: #1a1a1a;
      color: #999;
      border: 1px solid #444;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 12px;
      font-weight: 500;
    }

    .preset-btn:hover {
      background: #333;
      color: #e5e5e5;
    }

    .preset-btn.active {
      background: #c3ff00;
      color: #0a0a0a;
      border-color: #c3ff00;
    }

    .custom-date-inputs {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #444;
    }

    .date-input-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .date-input-group label {
      font-size: 12px;
      color: #999;
      font-weight: 500;
    }

    .date-input {    padding: 10px 12px;
    background-color: #0a0a0a;
    border: 1px solid #3a3a3a;
    border-radius: 6px;
    color: #e5e5e5;
    font-size: 14px;
    min-width: 150px;
    position: relative;
    background-image: url(data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c3ff00'%3e%3cpath d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'/%3e%3c/svg%3e);
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 18px 18px;
    padding-right: 40px;
    }

    .date-input:focus {
      outline: none;
      border-color: #c3ff00;
      box-shadow: 0 0 0 2px rgba(195, 255, 0, 0.1);
    }

    .date-input::-webkit-calendar-picker-indicator {
      opacity: 0;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .tabs {
        padding: 8px;
        gap: 8px;
      }

      .tab {
        min-width: 100px;
        padding: 10px 16px;
        font-size: 12px;
      }

      .content {
        padding: 15px;
      }

      .section-title {
        font-size: 20px;
      }

      .date-filter-container {
        padding: 15px;
      }

      .date-filter-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .preset-buttons {
        width: 100%;
        justify-content: flex-start;
      }

      .preset-btn {
        flex: 1;
        min-width: auto;
        text-align: center;
      }

      .custom-date-inputs {
        flex-direction: column;
        gap: 10px;
      }

      .date-input-group {
        width: 100%;
      }
    }
  `,
})
export class BookingListComponent implements OnInit {
  private bookingService = inject(BookingService);

  activeTab = 'pending';
  loading = false;
  operationLoading: { [key: string]: boolean } = {};

  // Date filtering properties
  selectedPreset = signal<'all' | 'today' | '7days' | '30days' | 'custom'>(
    'all'
  );
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Booking arrays as signals
  pendingBookings = signal<Booking[]>([]);
  confirmedBookings = signal<Booking[]>([]);
  completedBookings = signal<Booking[]>([]);
  rejectedBookings = signal<Booking[]>([]);
  canceledBookings = signal<Booking[]>([]);

  // Modal state
  showPriceModal = false;
  selectedBookingForCompletion: Booking | null = null;
  showTeamModal = false;
  selectedBookingForTeam: Booking | null = null;
  showRejectModal = false;
  selectedBookingForRejection: Booking | null = null;

  ngOnInit() {
    this.loadBookings();
  }

  loadBookings() {
    this.loading = true;
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        this.pendingBookings.set(
          bookings.filter((b) => b.status === 'pending')
        );
        this.confirmedBookings.set(
          bookings.filter((b) => b.status === 'confirmed')
        );
        this.completedBookings.set(
          bookings.filter((b) => b.status === 'completed')
        );
        this.rejectedBookings.set(
          bookings.filter((b) => b.status === 'rejected')
        );
        this.canceledBookings.set(
          bookings.filter((b) => b.status === 'canceled')
        );
        console.log('Loaded pending bookings:', this.pendingBookings().length);
        console.log(
          'Loaded confirmed bookings:',
          this.confirmedBookings().length
        );
        console.log(
          'Loaded completed bookings:',
          this.completedBookings().length
        );
        console.log(
          'Loaded rejected bookings:',
          this.rejectedBookings().length
        );
        console.log(
          'Loaded canceled bookings:',
          this.canceledBookings().length
        );
        console.log(
          'Filtered pending bookings:',
          this.filteredPendingBookings()
        );

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading = false;
      },
    });
  }

  // Computed properties for filtered bookings
  filteredPendingBookings = computed(() =>
    this.filterBookingsByDate(this.pendingBookings())
  );
  filteredConfirmedBookings = computed(() =>
    this.filterBookingsByDate(this.confirmedBookings())
  );
  filteredCompletedBookings = computed(() =>
    this.filterBookingsByDate(this.completedBookings())
  );
  filteredRejectedBookings = computed(() =>
    this.filterBookingsByDate(this.rejectedBookings())
  );
  filteredCanceledBookings = computed(() =>
    this.filterBookingsByDate(this.canceledBookings())
  );

  get currentBookings() {
    switch (this.activeTab) {
      case 'pending':
        return this.filteredPendingBookings();
      case 'confirmed':
        return this.filteredConfirmedBookings();
      case 'completed':
        return this.filteredCompletedBookings();
      case 'others':
        return [
          ...this.filteredRejectedBookings(),
          ...this.filteredCanceledBookings(),
        ];
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
        return 'Historique des réservations';
      case 'others':
        return 'Autres réservations (Rejetées & Annulées)';
      default:
        return '';
    }
  }

  onStatusChange(event: { id: string; status: string }) {
    this.operationLoading[`status-${event.id}`] = true;
    this.bookingService.updateBookingStatus(event.id, event.status).subscribe({
      next: () => {
        this.loadBookings();
        this.operationLoading[`status-${event.id}`] = false;
      },
      error: (err) => {
        console.error('Error updating booking:', err);
        this.operationLoading[`status-${event.id}`] = false;
      },
    });
  }

  onRequestComplete(booking: Booking) {
    this.selectedBookingForCompletion = booking;
    this.showPriceModal = true;
  }

  onRequestConfirm(booking: Booking) {
    this.selectedBookingForTeam = booking;
    this.showTeamModal = true;
  }

  onRequestReassignTeam(booking: Booking) {
    this.selectedBookingForTeam = booking;
    this.showTeamModal = true;
  }

  onRequestReject(booking: Booking) {
    this.selectedBookingForRejection = booking;
    this.showRejectModal = true;
  }

  onRequestReconfirm(booking: Booking) {
    this.operationLoading[`reconfirm-${booking._id}`] = true;
    this.bookingService
      .updateBookingStatus(booking._id!, 'confirmed')
      .subscribe({
        next: () => {
          this.loadBookings();
          this.operationLoading[`reconfirm-${booking._id}`] = false;
        },
        error: (err) => {
          console.error('Error reconfirming booking:', err);
          this.operationLoading[`reconfirm-${booking._id}`] = false;
        },
      });
  }

  onConfirmComplete(event: { booking: Booking; price: number }) {
    this.operationLoading[`complete-${event.booking._id}`] = true;
    // First update the price, then update the status
    this.bookingService
      .updateBookingPrice(event.booking._id!, event.price)
      .subscribe({
        next: () => {
          // Now update status to completed
          this.bookingService
            .updateBookingStatus(event.booking._id!, 'completed')
            .subscribe({
              next: () => {
                this.loadBookings();
                this.operationLoading[`complete-${event.booking._id}`] = false;
                this.closeModal();
              },
              error: (err: any) => {
                console.error('Error updating booking status:', err);
                this.operationLoading[`complete-${event.booking._id}`] = false;
              },
            });
        },
        error: (err: any) => {
          console.error('Error updating booking price:', err);
          this.operationLoading[`complete-${event.booking._id}`] = false;
        },
      });
  }

  onConfirmAssign(event: { booking: Booking; teamId: string }) {
    this.operationLoading[`assign-${event.booking._id}`] = true;
    // First assign the team, then update status to confirmed
    this.bookingService.assignTeam(event.booking._id!, event.teamId).subscribe({
      next: () => {
        // Now update status to confirmed
        this.bookingService
          .updateBookingStatus(event.booking._id!, 'confirmed')
          .subscribe({
            next: () => {
              this.loadBookings();
              this.operationLoading[`assign-${event.booking._id}`] = false;
              this.closeTeamModal();
            },
            error: (err: any) => {
              console.error('Error updating booking status:', err);
              this.operationLoading[`assign-${event.booking._id}`] = false;
            },
          });
      },
      error: (err: any) => {
        console.error('Error assigning team:', err);
        this.operationLoading[`assign-${event.booking._id}`] = false;
      },
    });
  }

  onReassignTeam(event: { booking: Booking; teamId: string }) {
    this.operationLoading[`reassign-${event.booking._id}`] = true;
    // Only assign the team, don't change the status
    this.bookingService.assignTeam(event.booking._id!, event.teamId).subscribe({
      next: () => {
        this.loadBookings();
        this.operationLoading[`reassign-${event.booking._id}`] = false;
        this.closeTeamModal();
        console.log('Team reassigned successfully');
      },
      error: (err: any) => {
        console.error('Error reassigning team:', err);
        this.operationLoading[`reassign-${event.booking._id}`] = false;
      },
    });
  }

  onConfirmReject() {
    if (!this.selectedBookingForRejection) return;

    const booking = this.selectedBookingForRejection;
    this.operationLoading[`reject-${booking._id}`] = true;
    this.bookingService
      .updateBookingStatus(booking._id!, 'rejected')
      .subscribe({
        next: () => {
          this.loadBookings();
          this.operationLoading[`reject-${booking._id}`] = false;
          this.closeRejectModal();
        },
        error: (err) => {
          console.error('Error rejecting booking:', err);
          this.operationLoading[`reject-${booking._id}`] = false;
          alert('Erreur lors du rejet de la réservation');
        },
      });
  }

  closeModal() {
    this.showPriceModal = false;
    this.selectedBookingForCompletion = null;
  }

  closeTeamModal() {
    this.showTeamModal = false;
    this.selectedBookingForTeam = null;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedBookingForRejection = null;
  }

  isOperationLoading(operation: string, id: string): boolean {
    return this.operationLoading[`${operation}-${id}`] || false;
  }

  applyDateFilter() {
    // Method for explicit filter application if needed
    // The filtering is already reactive through computed properties
  }

  isDateRangeValid(): boolean {
    if (this.selectedPreset() !== 'custom') return true;

    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) return false;

    return new Date(start) <= new Date(end);
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Date filtering methods
  setDatePreset(preset: 'all' | 'today' | '7days' | '30days' | 'custom') {
    this.selectedPreset.set(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (preset) {
      case 'all':
        this.startDate.set('');
        this.endDate.set('');
        break;
      case 'today':
        this.startDate.set(todayStr);
        this.endDate.set(todayStr);
        break;
      case '7days':
        const sevenDaysAgo = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(sevenDaysAgo.toISOString().split('T')[0]);
        this.endDate.set(todayStr);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(thirtyDaysAgo.toISOString().split('T')[0]);
        this.endDate.set(todayStr);
        break;
      case 'custom':
        // Keep existing dates or set to today if empty
        if (!this.startDate()) this.startDate.set(todayStr);
        if (!this.endDate()) this.endDate.set(todayStr);
        break;
    }
  }

  onStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.startDate.set(target.value);
    this.selectedPreset.set('custom');
  }

  onEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.endDate.set(target.value);
    this.selectedPreset.set('custom');
  }

  private filterBookingsByDate(bookings: Booking[]): Booking[] {
    // Return empty array if bookings haven't loaded yet
    if (!bookings || bookings.length === 0) {
      return [];
    }

    if (
      this.selectedPreset() === 'all' ||
      (!this.startDate() && !this.endDate())
    ) {
      return bookings;
    }

    const start = this.startDate() ? new Date(this.startDate()) : null;
    const end = this.endDate() ? new Date(this.endDate()) : null;

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);

      if (start && bookingDate < start) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (bookingDate > endOfDay) return false;
      }

      return true;
    });
  }

  onBookingUpdate(event: { bookingId: string; updateData: Partial<Booking> }) {
    this.bookingService
      .updateBooking(event.bookingId, event.updateData)
      .subscribe({
        next: (updatedBooking) => {
          // Update the booking in the appropriate array
          this.updateBookingInArrays(updatedBooking);
          console.log('Booking updated successfully:', updatedBooking);
        },
        error: (err: any) => {
          console.error('Error updating booking:', err);
        },
      });
  }

  private updateBookingInArrays(updatedBooking: Booking) {
    // Remove from all arrays first
    this.pendingBookings.set(
      this.pendingBookings().filter((b) => b._id !== updatedBooking._id)
    );
    this.confirmedBookings.set(
      this.confirmedBookings().filter((b) => b._id !== updatedBooking._id)
    );
    this.completedBookings.set(
      this.completedBookings().filter((b) => b._id !== updatedBooking._id)
    );
    this.rejectedBookings.set(
      this.rejectedBookings().filter((b) => b._id !== updatedBooking._id)
    );
    this.canceledBookings.set(
      this.canceledBookings().filter((b) => b._id !== updatedBooking._id)
    );

    // Add to the correct array based on status
    switch (updatedBooking.status) {
      case 'pending':
        this.pendingBookings.set([...this.pendingBookings(), updatedBooking]);
        break;
      case 'confirmed':
        this.confirmedBookings.set([
          ...this.confirmedBookings(),
          updatedBooking,
        ]);
        break;
      case 'completed':
        this.completedBookings.set([
          ...this.completedBookings(),
          updatedBooking,
        ]);
        break;
      case 'rejected':
        this.rejectedBookings.set([...this.rejectedBookings(), updatedBooking]);
        break;
      case 'canceled':
        this.canceledBookings.set([...this.canceledBookings(), updatedBooking]);
        break;
    }
  }
}
