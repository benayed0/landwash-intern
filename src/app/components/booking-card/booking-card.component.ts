import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-card.component.html',
  styleUrls: ['./booking-card.component.css'],
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
