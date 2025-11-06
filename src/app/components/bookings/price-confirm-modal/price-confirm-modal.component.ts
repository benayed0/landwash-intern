import { Component, Output, EventEmitter, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking } from '../../../models/booking.model';
import { BookingLabelService } from '../../../services/booking-label.service';

@Component({
  selector: 'app-price-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-confirm-modal.component.html',
  styleUrls: ['./price-confirm-modal.component.css'],
})
export class PriceConfirmModalComponent implements OnInit {
  @Output() confirmComplete = new EventEmitter<{
    booking: Booking;
    price: number;
  }>();

  booking: Booking;
  finalPrice = 0;

  private bookingLabelService = inject(BookingLabelService);

  constructor(
    public dialogRef: MatDialogRef<PriceConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: Booking }
  ) {
    this.booking = data.booking;
  }

  ngOnInit() {
    if (this.booking) {
      console.log(this.booking);

      this.finalPrice = this.booking.price || 0;
    }
  }

  isSubscriptionBooking(): boolean {
    return this.booking.withSub === true;
  }

  shouldShowCarPlate(): boolean {
    return this.isSubscriptionBooking() && this.booking.type !== 'salon';
  }

  getCarPlate(): string {
    return this.booking.subId?.carPlate || 'N/A';
  }

  getSubscriptionPlan(): string {
    return this.booking.subId?.plan || 'N/A';
  }

  getBookingTypeLabel(type: string): string {
    return this.bookingLabelService.getBookingTypeLabel(type);
  }

  getCarTypeLabel(carType: string): string {
    return this.bookingLabelService.getCarTypeLabel(carType);
  }

  getColorToneLabel(colorTone: string): string {
    return this.bookingLabelService.getColorToneLabel(colorTone);
  }

  getColorToneIcon(colorTone: string): string {
    return this.bookingLabelService.getColorToneIcon(colorTone);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  isTeamObject(teamId: any): boolean {
    return teamId && typeof teamId === 'object' && teamId.name;
  }

  getTeamName(teamId: any): string {
    if (this.isTeamObject(teamId)) {
      return teamId.name;
    }
    return '';
  }

  getTeamChief(teamId: any): string {
    if (this.isTeamObject(teamId) && teamId.chiefId?.name) {
      return teamId.chiefId.name;
    }
    return '';
  }

  confirm() {
    if (this.booking._id) {
      this.confirmComplete.emit({
        booking: this.booking,
        price: this.finalPrice,
      });
      // Don't close here - let the parent handle it
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
