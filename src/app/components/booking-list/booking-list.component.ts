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
  styleUrl: './booking-list.component.css',
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
