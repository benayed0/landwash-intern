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
  
    .date-input {
      padding: 10px 12px;
      background-color: #0a0a0a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      color: #e5e5e5;
      font-size: 14px;
      min-width: 180px;
      position: relative;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c3ff00'%3e%3cpath d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px 16px;
      padding-right: 35px;
    }

    .date-input:focus {
      outline: none;
      border-color: #c3ff00;
      box-shadow: 0 0 0 2px rgba(195, 255, 0, 0.1);
    }

    .date-input::-webkit-calendar-picker-indicator {
      opacity: 0;
      cursor: pointer;
      position: absolute;
      right: 10px;
      width: 20px;
      height: 20px;
    }

    .date-input::-webkit-datetime-edit {
      color: #e5e5e5;
    }

    .date-input::-webkit-datetime-edit-fields-wrapper {
      color: #e5e5e5;
    }
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

    .status-canceled {
      background: #9e9e9e;
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

    .price-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      gap: 15px;
    }

    .booking-price {
      font-size: 24px;
      font-weight: bold;
      color: #c3ff00;
      flex: 1;
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
      justify-content: space-between;
      gap: 8px;
      font-size: 14px;
      border: 1px solid rgba(195, 255, 0, 0.2);
    }

    .team-details {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .change-team-btn {
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
    }

    .change-team-btn:hover {
      background: #f57c00;
      transform: translateY(-1px);
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

    /* Edit Mode Styles */
    .edit-btn {
      background: #c3ff00;
      color: #0a0a0a;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .edit-btn:hover {
      background: #a8d400;
      transform: translateY(-1px);
    }

    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #333;
    }

    .edit-header h3 {
      margin: 0;
      color: #e5e5e5;
      font-size: 18px;
      font-weight: 600;
    }

    .edit-actions {
      display: flex;
      gap: 10px;
    }

    .save-btn, .cancel-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .save-btn {
      background: #c3ff00;
      color: #0a0a0a;
    }

    .save-btn:hover:not(:disabled) {
      background: #a8d400;
    }

    .save-btn:disabled {
      background: #666;
      color: #999;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #f44336;
      color: white;
    }

    .cancel-btn:hover {
      background: #d32f2f;
    }

    .edit-form {
      display: grid;
      gap: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #e5e5e5;
    }

    .form-input {
      padding: 10px 12px;
      background: #0a0a0a;
      color: #e5e5e5;
      border: 1px solid #444;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.3s;
    }

    .form-input:focus {
      outline: none;
      border-color: #c3ff00;
      box-shadow: 0 0 0 2px rgba(195, 255, 0, 0.1);
    }

    .textarea {
      resize: vertical;
      min-height: 60px;
    }

    .checkbox-group {
      flex-direction: row;
      align-items: center;
      gap: 10px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #e5e5e5;
    }

    .checkbox {
      width: 18px;
      height: 18px;
      accent-color: #c3ff00;
    }

    @media (max-width: 480px) {
      .booking-card {
        padding: 15px;
      }

      .booking-actions {
        flex-direction: column;
      }

      .edit-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .edit-actions {
        width: 100%;
        justify-content: space-between;
      }

      .save-btn, .cancel-btn {
        flex: 1;
      }

      .price-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .booking-price {
        font-size: 20px;
      }

      .edit-btn {
        font-size: 11px;
        padding: 6px 10px;
      }
    }
  `,
})
export class BookingCardComponent {
  @Input() booking!: Booking;
  @Input() userRole: 'admin' | 'worker' = 'admin'; // Default to admin for backward compatibility
  @Input() showMapsButton = true; // Control whether to show Google Maps button
  @Output() statusChange = new EventEmitter<{ id: string; status: string }>();
  @Output() requestComplete = new EventEmitter<Booking>();
  @Output() requestConfirm = new EventEmitter<Booking>();
  @Output() requestReject = new EventEmitter<Booking>();
  @Output() requestReconfirm = new EventEmitter<Booking>();
  @Output() requestReassignTeam = new EventEmitter<Booking>();
  @Output() bookingUpdate = new EventEmitter<{
    bookingId: string;
    updateData: Partial<Booking>;
  }>();

  // Edit mode properties
  isEditing = false;
  editForm = {
    type: 'small' as 'small' | 'big' | 'salon',
    price: 0,
    date: '',
    status: 'pending' as
      | 'pending'
      | 'confirmed'
      | 'completed'
      | 'rejected'
      | 'canceled',
    withSub: false,
    salonsSeats: 0,
    address: '',
    secondaryNumber: '',
  };

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
      hour12: false,
    }).format(d);
  }

  confirmBooking() {
    // Emit the booking to open the team assignment modal instead of directly confirming
    this.requestConfirm.emit(this.booking);
  }

  rejectBooking() {
    // Emit the booking to open the reject confirmation modal
    this.requestReject.emit(this.booking);
  }

  reconfirmBooking() {
    // Emit the booking to open the team assignment modal for reconfirmation
    this.requestReconfirm.emit(this.booking);
  }

  triggerRequestReassignTeam() {
    // Emit the booking to open the team assignment modal for reassignment
    this.requestReassignTeam.emit(this.booking);
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
      return `https://www.google.com/maps/search/?api=1&query=${this.booking.location.lat},${this.booking.location.lng}`;
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

  // Edit mode methods
  startEdit() {
    this.isEditing = true;
    this.editForm = {
      type: this.booking.type,
      price: this.booking.price,
      date: this.formatDateTimeForInput(this.booking.date),
      status: this.booking.status,
      withSub: this.booking.withSub,
      salonsSeats: this.booking.salonsSeats || 0,
      address: this.booking.address || '',
      secondaryNumber: this.booking.secondaryNumber || '',
    };
  }

  cancelEdit() {
    this.isEditing = false;
  }

  saveEdit() {
    if (!this.isValidEdit()) return;

    const updateData: Partial<Booking> = {
      type: this.editForm.type,
      price: this.editForm.price,
      date: new Date(this.editForm.date),
      status: this.editForm.status,
      withSub: this.editForm.withSub,
      address: this.editForm.address,
      secondaryNumber: this.editForm.secondaryNumber,
    };

    // Only include salonsSeats if it's a salon booking
    if (this.editForm.type === 'salon') {
      updateData.salonsSeats = this.editForm.salonsSeats;
    }

    this.bookingUpdate.emit({
      bookingId: this.booking._id!,
      updateData,
    });

    this.isEditing = false;
  }

  isValidEdit(): boolean {
    return (
      this.editForm.price > 0 &&
      this.editForm.date !== '' &&
      this.editForm.address.trim() !== ''
    );
  }

  // Check if admin can edit (admin role and not editing)
  canEdit(): boolean {
    return this.userRole === 'admin' && !this.isEditing;
  }

  // Format date for input field
  formatDateForInput(date: Date | string): string {
    return new Date(date).toISOString().slice(0, 16);
  }

  // Format datetime for input field preserving local timezone
  formatDateTimeForInput(date: Date | string): string {
    const d = new Date(date);
    // Get local timezone offset and adjust the date
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
  }
}
