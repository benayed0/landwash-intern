import { Component, OnInit, inject, signal, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { Booking, BookingType, BookingSlots } from '../../models/booking.model';
import { Team } from '../../models/team.model';
import { Personal } from '../../models/personal.model';
import { LocationPickerComponent } from '../location-picker/location-picker.component';
import { SelectedLocation } from '../../services/location.service';
import { CalendarModule } from 'primeng/calendar';
import { Calendar } from 'primeng/calendar';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LocationPickerComponent, CalendarModule],
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.css'],
})
export class CreateBookingComponent implements OnInit {
  @ViewChild('dateCalendar') dateCalendar!: Calendar;

  private bookingService = inject(BookingService);
  private teamService = inject(TeamService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  bookingForm!: FormGroup;
  teams = signal<Team[]>([]);
  personnel = signal<Personal[]>([]);
  loading = signal<boolean>(false);

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
  }

  initializeForm() {
    this.bookingForm = this.fb.group({
      type: ['small', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      withSub: [false],
      salonsSeats: [1, [Validators.min(1), Validators.max(20)]],
      address: ['', Validators.required],
      secondaryNumber: [''],
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: ['', Validators.required],
      teamId: [''],
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

          // Trigger date change for the current selected date to show available slots
          const currentDate = this.bookingForm.get('date')?.value;
          if (currentDate) {
            this.onDateChange(currentDate);
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
    if (selectedDate && this.bookedSlots()) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const daySlot = this.bookedSlots()?.daySlots.find(slot => slot.date === dateString);

      // Generate all possible time slots (every hour from working hours)
      const allTimeSlots = this.generateAllTimeSlots();

      if (daySlot) {
        // Remove booked time slots from all available slots
        const bookedTimes = this.getBookedTimesForDay(daySlot.slots);
        const availableSlots = allTimeSlots.filter(time => !bookedTimes.includes(time));
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

  onTypeChange(type: BookingType) {
    this.bookingForm.patchValue({ type });

    // Set default prices based on type
    const defaultPrices = {
      small: 15,
      big: 25,
      salon: 10,
    };

    if (this.bookingForm.get('price')?.value === 0) {
      this.bookingForm.patchValue({ price: defaultPrices[type] });
    }
  }

  onLocationSelected(location: SelectedLocation) {
    this.selectedLocation.set(location);
    this.bookingForm.patchValue({ address: location.address });

    // Preselect today's date at 9 AM when location is chosen
    const defaultDate = new Date();
    defaultDate.setHours(9, 0, 0, 0);

    // Use setTimeout to ensure the calendar updates visually
    setTimeout(() => {
      this.bookingForm.get('date')?.setValue(defaultDate);
      this.bookingForm.get('date')?.markAsTouched();

      // Directly update the calendar component
      if (this.dateCalendar) {
        this.dateCalendar.value = defaultDate;
        this.dateCalendar.updateInputfield();
      }

      this.cdr.detectChanges();
    }, 200);

    // Automatically fetch available slots for the selected location
    this.getSlots();
  }

  onSubmit() {
    if (this.bookingForm.valid && this.selectedLocation()) {
      this.loading.set(true);

      const formValue = this.bookingForm.value;
      const location = this.selectedLocation()!;

      const bookingData: Partial<Booking> = {
        type: formValue.type,
        price: formValue.price,
        date: new Date(formValue.date),
        status: 'pending',
        withSub: formValue.withSub,
        salonsSeats:
          formValue.type === 'salon' ? formValue.salonsSeats : undefined,
        address: formValue.address,
        coordinates: [location.lng, location.lat],
        secondaryNumber: formValue.secondaryNumber || undefined,
        teamId: formValue.teamId || undefined,
        userId: {
          _id: 'temp-user-id', // This should be replaced with actual user creation
          name: formValue.clientName,
          email: formValue.clientEmail,
          phoneNumber: formValue.clientPhone,
          memberSince: new Date(),
        },
      };

      this.bookingService.createBooking(bookingData).subscribe({
        next: (booking) => {
          console.log('Booking created successfully:', booking);
          this.loading.set(false);
          // Navigate to booking list or show success message
          this.router.navigate(['/dashboard/bookings']);
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

      if (!this.selectedLocation()) {
        alert('Veuillez sélectionner une localisation sur la carte');
      }
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/bookings']);
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
