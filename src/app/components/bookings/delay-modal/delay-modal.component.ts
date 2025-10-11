import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking } from '../../../models/booking.model';

@Component({
  selector: 'app-delay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delay-modal.component.html',
  styleUrl: './delay-modal.component.css',
})
export class DelayModalComponent {
  delayMinutes: number = 0;
  booking: Booking;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { booking: Booking; currentDelay?: number },
    private dialogRef: MatDialogRef<DelayModalComponent>
  ) {
    this.booking = data.booking;
    this.delayMinutes = data.currentDelay || 0;
  }

  confirmDelay() {
    if (this.delayMinutes && this.delayMinutes > 0) {
      this.dialogRef.close(this.delayMinutes);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
