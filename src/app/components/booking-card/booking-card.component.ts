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

    /* Google Maps Button */
    .maps-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      background: linear-gradient(135deg, #4285f4, #1a73e8);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 15px;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
    }

    .maps-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.5);
      background: linear-gradient(135deg, #5a95f5, #2b7de9);
    }

    .maps-icon {
      font-size: 18px;
    }

    .maps-arrow {
      margin-left: auto;
      font-size: 18px;
    }

    /* User/Client Information */
    .user-info {
      font-size: 12px;
      color: #888;
      margin-top: 10px;
    }

    .user-info.worker-view {
      background: #0a0a0a;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 15px;
      border: 1px solid #2a2a2a;
    }

    .client-name {
      font-size: 16px;
      color: #fff;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .client-phone {
      font-size: 14px;
      color: #c3ff00;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .phone-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-size: 18px;
      margin-left: 8px;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.3s ease;
      background: rgba(76, 175, 80, 0.1);
    }

    .phone-link:hover {
      background: rgba(76, 175, 80, 0.2);
      transform: scale(1.1);
    }

    .phone-link:active {
      transform: scale(0.95);
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
  @Input() userRole: 'admin' | 'worker' = 'admin'; // Default to admin for backward compatibility
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
    // For admin: emit to open price modal
    // For worker: directly complete
    if (this.userRole === 'admin') {
      this.requestComplete.emit(this.booking);
    } else {
      // Worker can directly complete
      if (this.booking._id) {
        this.statusChange.emit({ id: this.booking._id, status: 'completed' });
      }
    }
  }

  // Generate Google Maps URL from coordinates
  getGoogleMapsUrl(): string {
    if (this.booking.location) {
      return `https://www.google.com/maps/dir/?api=1&destination=${this.booking.location.lat},${this.booking.location.lng}`;
    }
    return '#';
  }

  // Check if we should show admin actions (confirm/reject buttons)
  shouldShowAdminActions(): boolean {
    return this.userRole === 'admin' && this.booking.status === 'pending';
  }

  // Check if we should show complete button
  shouldShowCompleteButton(): boolean {
    return this.booking.status === 'confirmed';
  }
}
