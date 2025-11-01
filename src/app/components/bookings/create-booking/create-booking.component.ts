import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { TeamService } from '../../../services/team.service';
import { UserService } from '../../../services/user.service';
import {
  Booking,
  BookingType,
  BookingSlots,
} from '../../../models/booking.model';
import { Team } from '../../../models/team.model';
import { Personal } from '../../../models/personal.model';
import { LocationPickerComponent } from '../../location-picker/location-picker.component';
import { SelectedLocation } from '../../../services/location.service';
import { User } from '../../users/users.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LocationPickerComponent,
  ],
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.css'],
})
export class CreateBookingComponent implements OnInit {
  @Input() isOpen = false;
  @Output() bookingCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private bookingService = inject(BookingService);
  private teamService = inject(TeamService);
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialogRef<CreateBookingComponent>);
  bookingForm!: FormGroup;
  teams = signal<Team[]>([]);
  personnel = signal<Personal[]>([]);
  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  submitted = false;
  selectedDate: Date | null = null;
  selectedDateString: string = '';
  selectedTimeSlot: string = '';
  minDateString: string = '';

  // Location picker
  selectedLocation = signal<SelectedLocation | null>(null);

  // Date picker
  today = new Date();
  bookedSlots = signal<BookingSlots | null>(null);
  disabledDates = signal<Date[]>([]);
  availableTimeSlots = signal<string[]>([]);
  workingHours = { start: '08:00', end: '18:00' }; // Define working hours
  locationTooFar = signal<boolean>(false);
  nearestTeamDistance = signal<number>(0);

  // Bulk weekly booking
  bulkBookingInProgress = signal<boolean>(false);
  bulkBookingWeeks = signal<{
    date: Date;
    dateString: string;
    timeSlot: string;
    available: boolean;
    confirmed: boolean;
    created: boolean;
    alternativeSlots: string[];
    selectedAlternative: string | null;
  }[]>([]);

  // Form options
  bookingTypes: { value: BookingType; label: string; icon: string }[] = [
    { value: 'small', label: 'Citadines / Petites Voitures', icon: '🚗' },
    { value: 'big', label: 'SUV / Grandes Voitures', icon: '🚙' },
    { value: 'pickup', label: 'Pick-up', icon: '🚗' },
    { value: 'salon', label: 'Salon', icon: '🛌' },
  ];
  ngAfterViewInit() {
    setTimeout(() => {
      const element = document.getElementsByClassName('header')[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }
  ngOnInit() {
    this.initializeForm();
    this.loadTeams();
    this.loadPersonnel();
    this.loadUsers();
    this.setMinDate();
  }

  setMinDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDateString = this.formatDateToLocalString(tomorrow);
  }

  // Helper function to format date to local YYYY-MM-DD string without timezone issues
  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  initializeForm() {
    this.bookingForm = this.fb.group({
      type: ['small', Validators.required],
      price: [160, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      withSub: [false],
      salonsSeats: [1, [Validators.min(1), Validators.max(20)]],
      address: ['', Validators.required],
      phoneNumber: [''],
      teamId: [''],
      userId: ['', Validators.required],
    });

    // Watch for type changes to show/hide salon seats and refresh time slots
    this.bookingForm.get('type')?.valueChanges.subscribe((type) => {
      const salonsSeatsControl = this.bookingForm.get('salonsSeats');
      if (type === 'salon') {
        salonsSeatsControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(20),
        ]);
      } else {
        salonsSeatsControl?.clearValidators();
      }
      salonsSeatsControl?.updateValueAndValidity();

      // Refresh available time slots when service type changes
      if (this.selectedDateString && this.bookedSlots()) {
        this.onDateInputChange({ target: { value: this.selectedDateString } });
      }

      // Clear selected time slot when changing service type
      this.selectedTimeSlot = '';
    });
  }

  loadTeams() {
    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
      },
      error: (err) => {
        console.error('Error loading teams:', err);
      },
    });
  }
  getSlots() {
    const location = this.selectedLocation();
    if (location) {
      this.bookingService.getSlots(location.lat, location.lng).subscribe({
        next: (slots) => {
          console.log('Booked slots:', slots);
          this.bookedSlots.set(slots);
          this.updateDisabledDates(slots);
          this.checkTeamAvailability(slots);

          // Find and select the nearest available date (without time)
          const nearestAvailableDate = this.findNearestAvailableSlot(slots);
          if (nearestAvailableDate) {
            this.selectedDateString =
              this.formatDateToLocalString(nearestAvailableDate);
            // Trigger the date change to load available time slots
            this.onDateInputChange({
              target: { value: this.selectedDateString },
            });
          }
        },
        error: (err) => {
          console.error('Error fetching slots:', err);
        },
      });
    }
  }

  private checkTeamAvailability(slots: BookingSlots) {
    const { availableTeams } = slots;

    if (availableTeams.count === 0) {
      // Location is too far from any team
      this.locationTooFar.set(true);
      this.nearestTeamDistance.set(availableTeams.nearestTeam.distance);
    } else {
      // Teams are available for this location
      this.locationTooFar.set(false);
      this.nearestTeamDistance.set(0);
    }
  }

  private updateDisabledDates(slots: BookingSlots) {
    // Since API returns booked slots, we don't need to disable any dates
    // Users can select any future date, we'll show available time slots instead
    this.disabledDates.set([]);
  }

  onDateInputChange(event: any) {
    const dateString = event.target.value;
    this.selectedDateString = dateString;
    this.selectedTimeSlot = ''; // Reset time slot when date changes

    if (dateString && this.bookedSlots()) {
      const daySlot = this.bookedSlots()?.daySlots.find(
        (slot) => slot.date === dateString
      );

      // Generate all possible time slots (every hour from working hours)
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

      this.selectedDate = date;
      this.bookingForm.get('date')?.setValue(date);
      this.bookingForm.get('date')?.markAsTouched();
    }
  }

  onDateChange(selectedDate: Date | null) {
    // Keep this method for backward compatibility
    // Update both the ngModel and form control
    this.selectedDate = selectedDate;
    this.bookingForm.get('date')?.setValue(selectedDate);

    if (selectedDate && this.bookedSlots()) {
      const dateString = this.formatDateToLocalString(selectedDate);
      const daySlot = this.bookedSlots()?.daySlots.find(
        (slot) => slot.date === dateString
      );

      // Generate all possible time slots (every hour from working hours)
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

  private generateAllTimeSlots(): string[] {
    const serviceType = this.bookingForm.get('type')?.value;

    // For detailing services (small, big, and pickup cars), only allow specific time slots
    if (
      serviceType === 'small' ||
      serviceType === 'big' ||
      serviceType === 'pickup'
    ) {
      return ['09:00', '12:00', '15:00'];
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
    const serviceType = this.bookingForm.get('type')?.value;
    const bookedTimes: string[] = [];

    bookedSlots.forEach(([start, end]) => {
      if (
        serviceType === 'small' ||
        serviceType === 'big' ||
        serviceType === 'pickup'
      ) {
        // For detailing services, check if any of the specific slots (8h, 11h, 14h) overlap
        // Detailing takes 2 hours, so we need to check for overlaps
        const carWashSlots = ['09:00', '12:00', '15:00'];

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

  private findNearestAvailableSlot(slots: BookingSlots): Date | null {
    const now = new Date();
    const [startHour] = this.workingHours.start.split(':').map(Number);
    const [endHour] = this.workingHours.end.split(':').map(Number);

    // Start checking from tomorrow
    let checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(startHour, 0, 0, 0);

    // Check up to 30 days in advance
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const currentCheckDate = new Date(checkDate);
      currentCheckDate.setDate(checkDate.getDate() + dayOffset);

      const dateString = this.formatDateToLocalString(currentCheckDate);
      const daySlot = slots.daySlots.find((slot) => slot.date === dateString);

      // Generate all possible time slots for this day
      const allTimeSlots = this.generateAllTimeSlots();

      let availableSlots: string[];
      if (daySlot) {
        // Remove booked time slots from all available slots
        const bookedTimes = this.getBookedTimesForDay(daySlot.slots);
        availableSlots = allTimeSlots.filter(
          (time) => !bookedTimes.includes(time)
        );
      } else {
        // No bookings for this date, all time slots are available
        availableSlots = allTimeSlots;
      }

      // If there are available slots, return the first one (earliest time)
      if (availableSlots.length > 0) {
        const firstAvailableTime = availableSlots[0];
        const [hour, minute] = firstAvailableTime.split(':').map(Number);

        const availableDate = new Date(currentCheckDate);
        availableDate.setHours(hour, minute, 0, 0);

        return availableDate;
      }
    }

    // If no available slot found in 30 days, return null
    return null;
  }
  loadPersonnel() {
    this.teamService.getAllPersonals().subscribe({
      next: (personnel) => {
        this.personnel.set(personnel);
      },
      error: (err) => {
        console.error('Error loading personnel:', err);
      },
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: (err) => {
        console.error('Error loading users:', err);
      },
    });
  }

  onTypeChange(type: BookingType) {
    this.bookingForm.patchValue({ type });

    // Set default prices based on type
    const defaultPrices = {
      small: 160,
      big: 220,
      pickup: 200,
      salon: 18,
    };

    if (this.bookingForm.get('price')?.value === 0) {
      this.bookingForm.patchValue({ price: defaultPrices[type] });
    }
  }

  onLocationSelected(location: SelectedLocation) {
    this.selectedLocation.set(location);
    this.bookingForm.patchValue({ address: location.address });

    // Automatically fetch available slots for the selected location
    // The nearest available date will be selected in the getSlots callback
    this.getSlots();
  }
  onUserChange(e: any) {
    const selectedUserId = e.target.value;
    const selectedUser = this.users().find((u) => u._id === selectedUserId);
    if (selectedUser && selectedUser.phoneNumber) {
      this.bookingForm.patchValue({ phoneNumber: selectedUser.phoneNumber });
    }
  }
  onSubmit() {
    console.log('Submitting form with value:', this.bookingForm.value);

    this.submitted = true;
    console.log(this.bookingForm.valid, this.selectedLocation());

    if (this.bookingForm.valid && this.selectedLocation()) {
      this.loading.set(true);

      const formValue = this.bookingForm.value;
      const location = this.selectedLocation()!;
      const selectedUser = this.users().find((u) => u._id === formValue.userId);

      if (!selectedUser) {
        alert('Veuillez sélectionner un utilisateur');
        this.loading.set(false);
        return;
      }

      const booking: Partial<Booking> = {
        type: formValue.type,
        price:
          formValue.type === 'salon'
            ? this.bookingForm.get('salonsSeats')?.value * 18 || 1
            : formValue.price,
        date: this.selectedDate || new Date(),
        status: 'pending',
        withSub: formValue.withSub,
        salonsSeats:
          formValue.type === 'salon' ? formValue.salonsSeats : undefined,
        address: formValue.address,
        coordinates: [location.lng, location.lat],
        phoneNumber: formValue.phoneNumber || undefined,
        teamId: formValue.teamId || undefined,
      };
      console.log(booking);

      this.bookingService
        .createBooking({ booking, userId: selectedUser._id })
        .subscribe({
          next: (booking) => {
            console.log('Booking created successfully:', booking);
            this.loading.set(false);
            this.bookingCreated.emit();
            this.close.emit();
          },
          error: (err) => {
            console.error('Error creating booking:', err);
            this.loading.set(false);
            // Show error message
          },
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.bookingForm.controls).forEach((key) => {
        this.bookingForm.get(key)?.markAsTouched();
      });

      // Log errors for each form control
      Object.keys(this.bookingForm.controls).forEach((key) => {
        const control = this.bookingForm.get(key);
        if (control && control.invalid) {
          console.log(`Field "${key}" is invalid:`, control.errors);
        }
      });

      if (!this.selectedLocation()) {
        alert('Veuillez sélectionner une localisation sur la carte');
      }
    }
  }

  onCancel() {
    this.close.emit();
    this.dialog.close();
  }

  // Helper methods for validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.bookingForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['email']) return 'Format email invalide';
      if (field.errors['min'])
        return `Valeur minimale: ${field.errors['min'].min}`;
      if (field.errors['max'])
        return `Valeur maximale: ${field.errors['max'].max}`;
    }
    return '';
  }

  // Calculate estimated price based on type and salon seats
  calculateEstimatedPrice(): number {
    const type = this.bookingForm.get('type')?.value;
    const salonsSeats = this.bookingForm.get('salonsSeats')?.value || 1;

    const basePrices = {
      small: 160,
      big: 220,
      pickup: 200,
      salon: 18,
    };

    if (type === 'salon') {
      return basePrices.salon * salonsSeats;
    }

    return basePrices[type as keyof typeof basePrices] || 0;
  }

  // Bulk Weekly Booking Feature
  startBulkWeeklyBooking() {
    if (!this.selectedDate || !this.selectedTimeSlot) {
      return;
    }

    // Generate the next 4 weeks at the same time
    const weeks = [];
    for (let i = 1; i <= 4; i++) {
      const weekDate = new Date(this.selectedDate);
      weekDate.setDate(weekDate.getDate() + (i * 7));

      const dateString = this.formatDateToLocalString(weekDate);

      weeks.push({
        date: weekDate,
        dateString: dateString,
        timeSlot: this.selectedTimeSlot,
        available: false,
        confirmed: false,
        created: false,
        alternativeSlots: [],
        selectedAlternative: null,
      });
    }

    this.bulkBookingWeeks.set(weeks);
    this.bulkBookingInProgress.set(true);

    // Check availability for each week
    this.checkBulkWeekAvailability();
  }

  checkBulkWeekAvailability() {
    const weeks = this.bulkBookingWeeks();
    const bookedSlots = this.bookedSlots();

    if (!bookedSlots) return;

    const updatedWeeks = weeks.map(week => {
      const daySlot = bookedSlots.daySlots.find(
        slot => slot.date === week.dateString
      );

      // Generate all possible time slots
      const allTimeSlots = this.generateAllTimeSlots();

      let isAvailable = false;
      let availableAlternatives: string[] = [];

      if (daySlot) {
        const bookedTimes = this.getBookedTimesForDay(daySlot.slots);
        isAvailable = !bookedTimes.includes(week.timeSlot);

        // If not available, find alternatives
        if (!isAvailable) {
          availableAlternatives = allTimeSlots.filter(
            (time) => !bookedTimes.includes(time)
          );
        }
      } else {
        // No bookings for this date, check if the time slot is valid
        isAvailable = allTimeSlots.includes(week.timeSlot);
      }

      return {
        ...week,
        available: isAvailable,
        alternativeSlots: availableAlternatives,
        selectedAlternative: availableAlternatives.length > 0 ? availableAlternatives[0] : null
      };
    });

    this.bulkBookingWeeks.set(updatedWeeks);
  }

  toggleWeekConfirmation(index: number) {
    const weeks = this.bulkBookingWeeks();
    const week = weeks[index];

    // Can confirm if: original slot is available OR has alternative slots
    const canConfirm = (week.available || week.alternativeSlots.length > 0) && !week.created;

    if (canConfirm) {
      weeks[index].confirmed = !weeks[index].confirmed;
      this.bulkBookingWeeks.set([...weeks]);
    }
  }

  selectAlternative(weekIndex: number, timeSlot: string) {
    const weeks = this.bulkBookingWeeks();
    weeks[weekIndex].selectedAlternative = timeSlot;
    this.bulkBookingWeeks.set([...weeks]);
  }

  async createBulkBookings() {
    const weeks = this.bulkBookingWeeks().filter(w => {
      // Include if confirmed AND (available OR has alternatives)
      return w.confirmed && (w.available || w.alternativeSlots.length > 0) && !w.created;
    });

    if (weeks.length === 0) {
      alert('Veuillez sélectionner au moins une semaine');
      return;
    }

    this.loading.set(true);

    const formValue = this.bookingForm.value;
    const location = this.selectedLocation()!;
    const selectedUser = this.users().find((u) => u._id === formValue.userId);

    if (!selectedUser) {
      alert('Veuillez sélectionner un utilisateur');
      this.loading.set(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Create bookings sequentially
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];

      // Use the selected alternative if original slot is not available
      const timeSlotToUse = week.available ? week.timeSlot : week.selectedAlternative;

      if (!timeSlotToUse) {
        failCount++;
        continue;
      }

      // Create a date with the selected time slot
      const [hours, minutes] = timeSlotToUse.split(':').map(Number);
      const bookingDate = new Date(week.date);
      bookingDate.setHours(hours, minutes, 0, 0);

      const booking: Partial<Booking> = {
        type: formValue.type,
        price:
          formValue.type === 'salon'
            ? this.bookingForm.get('salonsSeats')?.value * 18 || 1
            : formValue.price,
        date: bookingDate,
        status: 'pending',
        withSub: formValue.withSub,
        salonsSeats:
          formValue.type === 'salon' ? formValue.salonsSeats : undefined,
        address: formValue.address,
        coordinates: [location.lng, location.lat],
        phoneNumber: formValue.phoneNumber || undefined,
        teamId: formValue.teamId || undefined,
      };

      try {
        await new Promise<void>((resolve, reject) => {
          this.bookingService
            .createBooking({ booking, userId: selectedUser._id })
            .subscribe({
              next: (booking) => {
                console.log(`Booking created for ${week.dateString}:`, booking);
                successCount++;

                // Mark this week as created
                const allWeeks = this.bulkBookingWeeks();
                const weekIndex = allWeeks.findIndex(w => w.dateString === week.dateString);
                if (weekIndex !== -1) {
                  allWeeks[weekIndex].created = true;
                  this.bulkBookingWeeks.set([...allWeeks]);
                }

                resolve();
              },
              error: (err) => {
                console.error(`Error creating booking for ${week.dateString}:`, err);
                failCount++;
                reject(err);
              },
            });
        });
      } catch (error) {
        // Continue with the next booking even if one fails
        console.error('Error in booking creation:', error);
      }
    }

    this.loading.set(false);

    // Show summary
    const message = `Réservations créées avec succès: ${successCount}\nÉchecs: ${failCount}`;
    alert(message);

    if (successCount > 0) {
      this.bookingCreated.emit();
      // Optionally close the dialog after bulk creation
      // this.close.emit();
    }
  }

  cancelBulkBooking() {
    this.bulkBookingInProgress.set(false);
    this.bulkBookingWeeks.set([]);
  }

  getConfirmedCount(): number {
    return this.bulkBookingWeeks().filter(w => w.confirmed && (w.available || w.alternativeSlots.length > 0)).length;
  }
}
