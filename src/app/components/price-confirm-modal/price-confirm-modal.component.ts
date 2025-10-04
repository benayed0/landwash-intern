import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-price-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-confirm-modal.component.html',
  styleUrls: ['./price-confirm-modal.component.css'],
})
export class PriceConfirmModalComponent {
  @Input() booking: Booking | null = null;
  @Input() isOpen = false;
  @Output() confirmComplete = new EventEmitter<{
    booking: Booking;
    price: number;
  }>();
  @Output() close = new EventEmitter<void>();

  finalPrice = 0;

  ngOnChanges() {
    if (this.booking && this.isOpen) {
      this.finalPrice = this.booking.price;
    }
  }

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      salon: 'Salon',
    };
    return labels[type] || type;
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
    if (this.booking?._id && this.finalPrice > 0) {
      this.confirmComplete.emit({
        booking: this.booking,
        price: this.finalPrice,
      });
      this.close.emit();
    }
  }

  cancel() {
    this.close.emit();
  }
}
