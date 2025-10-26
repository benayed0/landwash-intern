import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeliveryDateDialogData {
  minDate?: string;
}

@Component({
  selector: 'app-delivery-date-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-date-dialog.component.html',
  styleUrls: ['./delivery-date-dialog.component.css'],
})
export class DeliveryDateDialogComponent {
  estimatedDeliveryDate = '';

  constructor(
    public dialogRef: MatDialogRef<DeliveryDateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryDateDialogData
  ) {}

  onConfirm(): void {
    if (this.estimatedDeliveryDate) {
      this.dialogRef.close(this.estimatedDeliveryDate);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDateToLocalString(tomorrow);
  }

  // Helper function to format date to local YYYY-MM-DD string without timezone issues
  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
