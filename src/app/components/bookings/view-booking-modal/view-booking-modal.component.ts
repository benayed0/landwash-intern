import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';

export interface ViewBookingDialogData {
  bookingId: string;
}

@Component({
  selector: 'app-view-booking-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-booking-modal.component.html',
  styleUrls: ['./view-booking-modal.component.css'],
})
export class ViewBookingModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ViewBookingModalComponent>);
  private data = inject<ViewBookingDialogData>(MAT_DIALOG_DATA);
  private bookingService = inject(BookingService);

  booking = signal<Booking | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

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
    switch (serviceType) {
      case 'small':
        return 'Citadine';
      case 'big':
        return 'SUV';
      case 'salon':
        return 'Salon';
      default:
        return serviceType || '';
    }
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
}
