import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-card.component.html',
  styles: `
    .booking-card {
      background: #1a1a1a;
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 15px;
      color: #e5e5e5;
      position: relative;
      border: 1px solid #2a2a2a;
    }

    .booking-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }

    .vehicle-type {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
    }

    .salon-seats {
      font-size: 14px;
      color: #c3ff00;
      font-weight: normal;
      margin-left: 5px;
    }

    .vehicle-icon {
      width: 30px;
      height: 30px;
      background: #c3ff00;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pending {
      background: #ff9800;
    }

    .status-confirmed {
      background: #4caf50;
    }

    .status-completed {
      background: #607d8b;
    }

    .status-rejected {
      background: #f44336;
    }

    .booking-date {
      color: #aaa;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .booking-address {
      display: flex;
      align-items: start;
      gap: 8px;
      color: #ccc;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .booking-price {
      font-size: 24px;
      font-weight: bold;
      color: #c3ff00;
      text-align: right;
      margin-bottom: 15px;
    }

    .booking-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .action-btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .confirm-btn {
      background: #4caf50;
      color: white;
    }

    .reject-btn {
      background: #f44336;
      color: white;
    }

    .complete-btn {
      background: #2196f3;
      color: white;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .user-info {
      font-size: 12px;
      color: #888;
      margin-top: 10px;
    }

    .team-info {
      background: rgba(195, 255, 0, 0.1);
      border-radius: 8px;
      padding: 10px;
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      border: 1px solid rgba(195, 255, 0, 0.2);
    }

    .team-icon {
      font-size: 16px;
    }

    .team-label {
      color: #888;
      font-size: 12px;
    }

    .team-name {
      color: #c3ff00;
      font-weight: 600;
    }

    .team-chief {
      color: #aaa;
      font-size: 12px;
      margin-left: 5px;
    }

    @media (max-width: 480px) {
      .booking-card {
        padding: 15px;
      }

      .booking-actions {
        flex-direction: column;
      }
    }
  `,
})
export class BookingCardComponent {
  @Input() booking!: Booking;
  @Output() statusChange = new EventEmitter<{ id: string; status: string }>();
  @Output() requestComplete = new EventEmitter<Booking>();
  @Output() requestConfirm = new EventEmitter<Booking>();

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      salon: 'Salon',
    };
    return labels[type] || type;
  }

  getVehicleIcon(type: string): string {
    return type === 'salon' ? '🛌' : '🚗';
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

  confirmBooking() {
    // Emit the booking to open the team assignment modal instead of directly confirming
    this.requestConfirm.emit(this.booking);
  }

  rejectBooking() {
    if (this.booking._id) {
      this.statusChange.emit({ id: this.booking._id, status: 'rejected' });
    }
  }
  getTeamName(team: any): string {
    return team && team.name ? team.name : 'N/A';
  }
  getChiefName(team: any): string {
    return team && team.chiefId && team.chiefId.name
      ? team.chiefId.name
      : 'N/A';
  }
  completeBooking() {
    // Emit the booking to open the modal instead of directly completing
    this.requestComplete.emit(this.booking);
  }
}
