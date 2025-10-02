import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-reject-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reject-confirm-modal.component.html',
  styleUrl: './reject-confirm-modal.component.css'
})
export class RejectConfirmModalComponent {
  @Input() booking: Booking | null = null;
  @Input() isOpen = false;
  @Output() confirmReject = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm() {
    this.confirmReject.emit();
    this.close.emit();
  }

  onCancel() {
    this.close.emit();
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

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      salon: 'Salon',
    };
    return labels[type] || type;
  }
}