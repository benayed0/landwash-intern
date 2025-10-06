import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
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
import { BookingService } from '../../services/booking.service';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { Booking, BookingType, BookingSlots } from '../../models/booking.model';
import { Team } from '../../models/team.model';
import { Personal } from '../../models/personal.model';
import { LocationPickerComponent } from '../location-picker/location-picker.component';
import { SelectedLocation } from '../../services/location.service';
import { CalendarModule } from 'primeng/calendar';
import { Calendar } from 'primeng/calendar';
import { User } from '../users/users.component';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LocationPickerComponent,
    CalendarModule,
  ],
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.css'],
})
export class CreateBookingComponent implements OnInit {
  @ViewChild('dateCalendar') dateCalendar!: Calendar;
  @Input() isOpen = false;
  @Output() bookingCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private bookingService = inject(BookingService);
  private teamService = inject(TeamService);
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  bookingForm!: FormGroup;
  teams = signal<Team[]>([]);
  personnel = signal<Personal[]>([]);
  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  submitted = false;
  selectedDate: Date | null = null;

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

  // Form options
  bookingTypes: { value: BookingType; label: string; icon: string }[] = [
    { value: 'small', label: 'Citadines / Petites Voitures', icon: '🚗' },
    { value: 'big', label: 'SUV / Grandes Voitures', icon: '🚙' },
    { value: 'salon', label: 'Salon', icon: '🛌' },
  ];

  ngOnInit() {
    this.initializeForm();
    this.loadTeams();
    this.loadPersonnel();
    this.loadUsers();
  }

  initializeForm() {
    this.bookingForm = this.fb.group({
      type: ['small', Validators.required],
      price: [160, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      withSub: [false],
      salonsSeats: [1, [Validators.min(1), Validators.max(20)]],
      address: ['', Validators.required],
      secondaryNumber: [''],
      teamId: [''],
      userId: ['', Validators.required],
    });

    // Watch for type changes to show/hide salon seats
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

          // Find and select the nearest available time slot
          const nearestAvailableDate = this.findNearestAvailableSlot(slots);
          if (nearestAvailableDate) {
            this.selectedDate = nearestAvailableDate;
            this.bookingForm.get('date')?.setValue(nearestAvailableDate);
            this.bookingForm.get('date')?.markAsTouched();
            this.onDateChange(nearestAvailableDate);
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

  onDateChange(selectedDate: Date | null) {
    // Update both the ngModel and form control
    this.selectedDate = selectedDate;
    this.bookingForm.get('date')?.setValue(selectedDate);

    if (selectedDate && this.bookedSlots()) {
      const dateString = selectedDate.toISOString().split('T')[0];
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
    const slots: string[] = [];
    const [startHour] = this.workingHours.start.split(':').map(Number);
    const [endHour] = this.workingHours.end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }

  private getBookedTimesForDay(bookedSlots: [string, string][]): string[] {
    const bookedTimes: string[] = [];

    bookedSlots.forEach(([start, end]) => {
      const startHour = parseInt(start.split(':')[0]);
      const endHour = parseInt(end.split(':')[0]);

      // Mark all hours between start and end as booked
      for (let hour = startHour; hour < endHour; hour++) {
        bookedTimes.push(`${hour.toString().padStart(2, '0')}:00`);
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

      const dateString = currentCheckDate.toISOString().split('T')[0];
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
        secondaryNumber: formValue.secondaryNumber || undefined,
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
      salon: 18,
    };

    if (type === 'salon') {
      return basePrices.salon * salonsSeats;
    }

    return basePrices[type as keyof typeof basePrices] || 0;
  }
}
