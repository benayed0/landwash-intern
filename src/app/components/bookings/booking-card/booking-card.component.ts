import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  inject,
  ChangeDetectorRef,
  NgZone,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  Booking,
  BookingStatus,
  BookingSlots,
} from '../../../models/booking.model';
import { DelayModalComponent } from '../delay-modal/delay-modal.component';
import { BookingService } from '../../../services/booking.service';
import { RatingDisplayComponent } from '../../shared/rating-display/rating-display.component';

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingDisplayComponent],
  templateUrl: './booking-card.component.html',
  styleUrls: ['./booking-card.component.css'],
})
export class BookingCardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() booking!: Booking;
  @Input() userRole: 'admin' | 'worker' = 'admin'; // Default to admin for backward compatibility
  @Input() showMapsButton = true; // Control whether to show Google Maps button
  @Output() statusChange = new EventEmitter<{ id: string; status: string }>();
  @Output() requestComplete = new EventEmitter<Booking>();
  @Output() requestConfirm = new EventEmitter<Booking>();
  @Output() requestReject = new EventEmitter<Booking>();
  @Output() requestReconfirm = new EventEmitter<Booking>();
  @Output() requestReassignTeam = new EventEmitter<Booking>();
  @Output() requestStartProgress = new EventEmitter<Booking>();
  @Output() bookingUpdate = new EventEmitter<{
    bookingId: string;
    updateData: Partial<Booking>;
  }>();

  // Progress timer
  private progressTimer: any;

  // Cached time remaining to avoid recalculation during change detection
  cachedTimeRemaining = { minutes: 0, seconds: 0, percentage: 0 };

  // Edit mode properties
  isEditing = false;
  editForm = {
    type: 'small' as 'small' | 'big' | 'salon' | 'pickup',
    price: 0,
    date: '',
    status: 'pending' as BookingStatus,
    withSub: false,
    salonsSeats: 0,
    address: '',
    secondaryNumber: '',
    transportFee: 0,
  };
  previousServiceType: 'small' | 'big' | 'salon' | 'pickup' = 'small';

  // Slot management for edit mode
  bookedSlots = signal<BookingSlots | null>(null);
  availableTimeSlots = signal<string[]>([]);
  selectedDateString: string = '';
  selectedTimeSlot: string = '';
  minDateString: string = '';
  workingHours = { start: '08:00', end: '18:00' };

  // Inject services
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private bookingService = inject(BookingService);

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      salon: 'Salon',
      pickup: 'Pick-up',
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
    if (this.booking.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${this.booking.coordinates[1]},${this.booking.coordinates[0]}`;
    }
    return '#';
  }

  // Check if we should show admin actions (confirm/reject buttons)
  shouldShowAdminActions(): boolean {
    return this.userRole === 'admin' && this.booking.status === 'pending';
  }

  // Check if we should show complete button
  shouldShowCompleteButton(): boolean {
    return (
      this.booking.status === 'confirmed' ||
      this.booking.status === 'in-progress'
    );
  }

  // Check if we should show start progress button
  shouldShowStartProgressButton(): boolean {
    return this.booking.status === 'confirmed';
  }

  // Start progress for confirmed booking
  startProgress() {
    this.requestStartProgress.emit(this.booking);
  }

  // Calculate duration based on booking type and salon seats
  getBookingDuration(): number {
    if (this.booking.type === 'salon' && this.booking.salonsSeats) {
      return this.booking.salonsSeats * 20; // 20 minutes per salon seat
    }
    return 120; // 2 hours (120 minutes) for car wash
  }

  // Calculate time remaining for in-progress bookings
  // Returns cached time remaining to avoid recalculation during change detection
  getTimeRemaining(): { minutes: number; seconds: number; percentage: number } {
    return this.cachedTimeRemaining;
  }

  // Calculate time remaining (called only by the timer)
  private calculateTimeRemaining(): {
    minutes: number;
    seconds: number;
    percentage: number;
  } {
    if (this.booking.status !== 'in-progress') {
      return { minutes: 0, seconds: 0, percentage: 0 };
    }

    const bookingDate = new Date(this.booking.startDate || this.booking.date);
    const now = new Date();
    const duration = this.getBookingDuration() * 60 * 1000; // Convert to milliseconds
    const endTime = new Date(bookingDate.getTime() + duration);

    const timeLeft = endTime.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return { minutes: 0, seconds: 0, percentage: 100 };
    }

    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const elapsed = now.getTime() - bookingDate.getTime();
    const percentage = Math.min(100, Math.max(0, (elapsed / duration) * 100));

    return { minutes, seconds, percentage };
  }

  // Format time remaining display
  formatTimeRemaining(): string {
    const time = this.getTimeRemaining();
    if (time.minutes === 0 && time.seconds === 0) {
      return 'Terminé';
    }
    return `${time.minutes}:${time.seconds.toString().padStart(2, '0')}`;
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
      transportFee: this.booking.transportFee || 0,
    };

    // Initialize previous service type
    this.previousServiceType = this.booking.type;

    // Set min date for date picker
    this.setMinDate();

    // Extract date and time from booking (use local timezone)
    const bookingDate = new Date(this.booking.date);
    const year = bookingDate.getFullYear();
    const month = (bookingDate.getMonth() + 1).toString().padStart(2, '0');
    const day = bookingDate.getDate().toString().padStart(2, '0');
    this.selectedDateString = `${year}-${month}-${day}`;
    const hours = bookingDate.getHours().toString().padStart(2, '0');
    const minutes = bookingDate.getMinutes().toString().padStart(2, '0');
    this.selectedTimeSlot = `${hours}:${minutes}`;

    // Fetch available slots for the booking's location
    if (this.booking.coordinates && this.booking.coordinates.length >= 2) {
      this.getSlots();
    }
  }

  setMinDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const day = tomorrow.getDate().toString().padStart(2, '0');
    this.minDateString = `${year}-${month}-${day}`;
  }

  getSlots() {
    if (this.booking.coordinates && this.booking.coordinates.length >= 2) {
      const [lng, lat] = this.booking.coordinates;
      this.bookingService.getSlots(lat, lng).subscribe({
        next: (slots) => {
          this.bookedSlots.set(slots);
          // Update available time slots for the currently selected date
          if (this.selectedDateString) {
            this.updateAvailableTimeSlots();
          }
        },
        error: (err) => {
          console.error('Error fetching slots:', err);
        },
      });
    }
  }

  onDateInputChange(event: any) {
    const dateString = event.target.value;
    this.selectedDateString = dateString;
    this.selectedTimeSlot = ''; // Reset time slot when date changes
    this.updateAvailableTimeSlots();
  }

  updateAvailableTimeSlots() {
    if (this.selectedDateString && this.bookedSlots()) {
      const daySlot = this.bookedSlots()?.daySlots.find(
        (slot) => slot.date === this.selectedDateString
      );

      // Generate all possible time slots
      const allTimeSlots = this.generateAllTimeSlots();

      if (daySlot) {
        // Remove booked time slots from all available slots
        const bookedTimes = this.getBookedTimesForDay(daySlot.slots);
        const availableSlots = allTimeSlots.filter(
          (time) => !bookedTimes.includes(time)
        );
        this.availableTimeSlots.set(availableSlots);
      } else {
        // No bookings for this date, all time slots are available
        this.availableTimeSlots.set(allTimeSlots);
      }
    }
  }

  onTimeSlotClick(timeSlot: string) {
    this.selectedTimeSlot = timeSlot;

    // Combine date and time to create a Date object
    if (this.selectedDateString && timeSlot) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const date = new Date(this.selectedDateString);
      date.setHours(hours, minutes, 0, 0);

      // Update edit form with the new datetime
      this.editForm.date = this.formatDateTimeForInput(date);
    }
  }

  onServiceTypeChange() {
    // When service type changes, refresh available time slots
    if (this.previousServiceType !== this.editForm.type) {
      this.previousServiceType = this.editForm.type;

      // Clear selected time slot when changing service type
      this.selectedTimeSlot = '';

      // Refresh available time slots if we have a date selected
      if (this.selectedDateString && this.bookedSlots()) {
        this.updateAvailableTimeSlots();
      }
    }
  }

  private generateAllTimeSlots(): string[] {
    const serviceType = this.editForm.type;

    // For detailing services (small, big, and pickup cars), only allow specific time slots
    if (
      serviceType === 'small' ||
      serviceType === 'big' ||
      serviceType === 'pickup'
    ) {
      return ['08:00', '11:00', '14:00'];
    }

    // For salon services, generate 30-minute interval slots from 8am to 6pm
    const slots: string[] = [];
    const [startHour] = this.workingHours.start.split(':').map(Number);
    const [endHour] = this.workingHours.end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }

  private getBookedTimesForDay(bookedSlots: [string, string][]): string[] {
    const serviceType = this.editForm.type;
    const bookedTimes: string[] = [];

    bookedSlots.forEach(([start, end]) => {
      if (
        serviceType === 'small' ||
        serviceType === 'big' ||
        serviceType === 'pickup'
      ) {
        // For detailing services, check if any of the specific slots (8h, 11h, 14h) overlap
        const carWashSlots = ['08:00', '11:00', '14:00'];

        const [startHourStr, startMinStr] = start.split(':');
        const [endHourStr, endMinStr] = end.split(':');
        const startHour = parseInt(startHourStr);
        const startMin = parseInt(startMinStr);
        const endHour = parseInt(endHourStr);
        const endMin = parseInt(endMinStr);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        carWashSlots.forEach((slot) => {
          const slotHour = parseInt(slot.split(':')[0]);
          const slotStartMinutes = slotHour * 60;
          const slotEndMinutes = slotStartMinutes + 120; // Car wash is 2 hours (120 minutes)

          // Check if this slot overlaps with the booked time range
          if (slotStartMinutes < endMinutes && slotEndMinutes > startMinutes) {
            bookedTimes.push(slot);
          }
        });
      } else {
        // For salon services, mark all 30-minute intervals between start and end as booked
        const [startHourStr, startMinStr] = start.split(':');
        const [endHourStr, endMinStr] = end.split(':');
        const startHour = parseInt(startHourStr);
        const startMin = parseInt(startMinStr);
        const endHour = parseInt(endHourStr);
        const endMin = parseInt(endMinStr);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Generate all 30-minute slots and check if they fall within the booked range
        const allSlots = this.generateAllTimeSlots();
        allSlots.forEach((slot) => {
          const [slotHourStr, slotMinStr] = slot.split(':');
          const slotHour = parseInt(slotHourStr);
          const slotMin = parseInt(slotMinStr);
          const slotMinutes = slotHour * 60 + slotMin;

          // If the slot falls within the booked time range, mark it as booked
          if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
            bookedTimes.push(slot);
          }
        });
      }
    });

    return bookedTimes;
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
      transportFee: this.editForm.transportFee,
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
    return this.editForm.date !== '' && this.editForm.address.trim() !== '';
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

  ngOnInit() {
    // Initialize cached time remaining for all bookings
    this.updateCachedTimeRemaining();
    this.startProgressTimer();
  }

  ngOnDestroy() {
    this.stopProgressTimer();
  }

  private startProgressTimer() {
    // Only start timer for in-progress bookings
    if (this.booking.status === 'in-progress') {
      // Initialize cached value
      this.updateCachedTimeRemaining();

      // Run the timer outside Angular's zone to avoid triggering change detection on every tick
      this.ngZone.runOutsideAngular(() => {
        this.progressTimer = setInterval(() => {
          // Update cached value
          this.updateCachedTimeRemaining();

          // Manually trigger change detection inside Angular's zone
          this.ngZone.run(() => {
            this.cdr.markForCheck();
          });
        }, 1000);
      });
    }
  }

  private updateCachedTimeRemaining() {
    this.cachedTimeRemaining = this.calculateTimeRemaining();
  }

  private stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  // Watch for status changes to start/stop timer
  ngOnChanges() {
    this.stopProgressTimer();
    this.startProgressTimer();
  }

  // Delay modal methods
  openDelayModal() {
    const dialogRef = this.dialog.open(DelayModalComponent, {
      data: {
        booking: this.booking,
        currentDelay: this.booking.delayedOf || 0,
      },
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((delayMinutes) => {
      if (delayMinutes && delayMinutes > 0) {
        // Emit the update to parent component
        this.bookingUpdate.emit({
          bookingId: this.booking._id!,
          updateData: {
            delayedOf: delayMinutes,
          },
        });
      }
    });
  }
}
