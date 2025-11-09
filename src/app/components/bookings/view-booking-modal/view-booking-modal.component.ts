import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { BookingService } from '../../../services/booking.service';
import { LabelService } from '../../../services/label.service';
import { Booking } from '../../../models/booking.model';
import { TeamAssignModalComponent } from '../../personals/team-assign-modal/team-assign-modal.component';
import { RatingDisplayComponent } from '../../shared/rating-display/rating-display.component';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

export interface ViewBookingDialogData {
  bookingId: string;
}

@Component({
  selector: 'app-view-booking-modal',
  standalone: true,
  imports: [CommonModule, RatingDisplayComponent],
  templateUrl: './view-booking-modal.component.html',
  styleUrls: ['./view-booking-modal.component.css'],
})
export class ViewBookingModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ViewBookingModalComponent>);
  private data = inject<ViewBookingDialogData>(MAT_DIALOG_DATA);
  private bookingService = inject(BookingService);
  private bookingLabelService = inject(LabelService);
  private dialog = inject(MatDialog);
  auth = inject(AuthService);
  booking = signal<Booking | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  actionLoading = signal<boolean>(false);

  // Computed properties for display
  statusLabel = computed(() => {
    const status = this.booking()?.status;
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'in-progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'rejected':
        return 'Rejeté';
      case 'canceled':
        return 'Annulé';
      default:
        return status || '';
    }
  });

  statusColor = computed(() => {
    const status = this.booking()?.status;
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'in-progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'canceled':
        return 'secondary';
      default:
        return 'secondary';
    }
  });

  serviceTypeLabel = computed(() => {
    const serviceType = this.booking()?.type;
    return serviceType
      ? this.bookingLabelService.getBookingTypeLabel(serviceType)
      : '';
  });

  carTypeLabel = computed(() => {
    const carType = this.booking()?.carType;
    return carType ? this.bookingLabelService.getCarTypeLabel(carType) : '';
  });

  colorToneLabel = computed(() => {
    const colorTone = this.booking()?.colorTone;
    return colorTone
      ? this.bookingLabelService.getColorToneLabel(colorTone)
      : '';
  });

  colorToneIcon = computed(() => {
    const colorTone = this.booking()?.colorTone;
    return colorTone
      ? this.bookingLabelService.getColorToneIcon(colorTone)
      : '';
  });

  ngOnInit() {
    this.loadBooking();
  }

  private loadBooking() {
    this.loading.set(true);
    this.bookingService.getBookingById(this.data.bookingId).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading booking:', err);
        this.error.set('Erreur lors du chargement de la réservation');
        this.loading.set(false);
      },
    });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'N/A';
    return `${price.toFixed(2)} DT`;
  }

  getTeamName(): string {
    const booking = this.booking();
    if (!booking?.teamId) return 'Non assigné';
    if (typeof booking.teamId === 'string') return booking.teamId;
    return booking.teamId.name || 'Équipe inconnue';
  }

  getClientName(): string {
    const booking = this.booking();
    if (!booking?.userId) return 'Client inconnu';
    if (typeof booking.userId === 'string') return booking.userId;
    return booking.userId.name || 'Client inconnu';
  }

  getClientPhone(): string {
    const booking = this.booking();
    if (!booking?.userId) return 'N/A';
    if (typeof booking.userId === 'string') return 'N/A';
    return booking.userId.phoneNumber || 'N/A';
  }

  getClientEmail(): string {
    const booking = this.booking();
    if (!booking?.userId) return 'N/A';
    if (typeof booking.userId === 'string') return 'N/A';
    return booking.userId.email || 'N/A';
  }

  getGoogleMapsUrl(): string {
    const booking = this.booking();
    if (!booking?.coordinates || booking.coordinates.length < 2) {
      return '#';
    }
    const lat = booking.coordinates[1];
    const lng = booking.coordinates[0];
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  onClose() {
    this.dialogRef.close();
  }

  // Check if we can confirm the booking (pending status)
  canConfirm(): boolean {
    return this.booking()?.status === 'pending';
  }

  // Check if we can reject the booking (pending or confirmed status)
  canReject(): boolean {
    const status = this.booking()?.status;
    return status === 'pending' || status === 'confirmed';
  }

  // Open team assignment modal for confirming booking
  onRequestConfirm() {
    const booking = this.booking();
    if (!booking) return;

    const dialogRef = this.dialog.open(TeamAssignModalComponent, {
      data: { booking, isReassignment: false },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.confirmAssign.subscribe(
      (event: { booking: Booking; teamId: string }) => {
        this.onConfirmAssign(event);
        dialogRef.close();
      }
    );
  }

  // Confirm booking with team assignment
  onConfirmAssign(event: { booking: Booking; teamId: string }) {
    this.actionLoading.set(true);
    // First assign the team, then update status to confirmed
    this.bookingService.assignTeam(event.booking._id!, event.teamId).subscribe({
      next: () => {
        // Now update status to confirmed
        this.bookingService
          .updateBookingStatus(event.booking._id!, 'confirmed')
          .subscribe({
            next: (updatedBooking: Booking) => {
              console.log('Booking confirmed with team:', updatedBooking);
              this.booking.set(updatedBooking);
              this.actionLoading.set(false);
              // Optionally close the modal after confirmation
              // this.dialogRef.close({ action: 'confirmed', booking: updatedBooking });
            },
            error: (err: any) => {
              console.error('Error updating booking status:', err);
              this.actionLoading.set(false);
              alert('Erreur lors de la confirmation de la réservation');
            },
          });
      },
      error: (err: any) => {
        console.error('Error assigning team:', err);
        this.actionLoading.set(false);
        alert("Erreur lors de l'assignation de l'équipe");
      },
    });
  }

  // Reject booking
  onRejectBooking() {
    const booking = this.booking();
    if (!booking?._id) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir rejeter cette réservation ?'
    );
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.bookingService.updateBookingStatus(booking._id, 'rejected').subscribe({
      next: (updatedBooking: Booking) => {
        console.log('Booking rejected:', updatedBooking);
        this.booking.set(updatedBooking);
        this.actionLoading.set(false);
        // Optionally close the modal after rejection
        // this.dialogRef.close({ action: 'rejected', booking: updatedBooking });
      },
      error: (err: any) => {
        console.error('Error rejecting booking:', err);
        this.actionLoading.set(false);
        alert('Erreur lors du rejet de la réservation');
      },
    });
  }

  // Reassign team (for confirmed bookings)
  onReassignTeam() {
    const booking = this.booking();
    if (!booking) return;

    const dialogRef = this.dialog.open(TeamAssignModalComponent, {
      data: { booking, isReassignment: true },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.componentInstance.reassignTeam.subscribe(
      (event: { booking: Booking; teamId: string }) => {
        this.onConfirmReassign(event);
        dialogRef.close();
      }
    );
  }

  // Confirm team reassignment
  onConfirmReassign(event: { booking: Booking; teamId: string }) {
    this.actionLoading.set(true);
    // Only assign the team, don't change the status
    this.bookingService.assignTeam(event.booking._id!, event.teamId).subscribe({
      next: (updatedBooking: Booking) => {
        console.log('Team reassigned:', updatedBooking);
        this.booking.set(updatedBooking);
        this.actionLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error reassigning team:', err);
        this.actionLoading.set(false);
        alert("Erreur lors de la réaffectation de l'équipe");
      },
    });
  }
}
