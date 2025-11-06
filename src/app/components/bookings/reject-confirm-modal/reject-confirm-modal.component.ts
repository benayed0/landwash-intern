import { Component, Output, EventEmitter, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking } from '../../../models/booking.model';
import { BookingLabelService } from '../../../services/booking-label.service';

@Component({
  selector: 'app-reject-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reject-confirm-modal.component.html',
  styleUrl: './reject-confirm-modal.component.css',
})
export class RejectConfirmModalComponent {
  @Output() confirmReject = new EventEmitter<void>();

  booking: Booking;

  private bookingLabelService = inject(BookingLabelService);

  constructor(
    public dialogRef: MatDialogRef<RejectConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: Booking }
  ) {
    this.booking = data.booking;
  }

  onConfirm() {
    this.confirmReject.emit();
    // Don't close here - let the parent handle it
  }

  onCancel() {
    this.dialogRef.close();
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  getBookingTypeLabel(type: string): string {
    return this.bookingLabelService.getBookingTypeLabel(type);
  }

  getCarTypeLabel(carType: string): string {
    return this.bookingLabelService.getCarTypeLabel(carType);
  }
}
