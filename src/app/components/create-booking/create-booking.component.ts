import { Component, OnInit, inject, signal } from '@angular/core';
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
import { Booking, BookingType } from '../../models/booking.model';
import { Team } from '../../models/team.model';
import { Personal } from '../../models/personal.model';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.css'],
})
export class CreateBookingComponent implements OnInit {
  private bookingService = inject(BookingService);
  private teamService = inject(TeamService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  bookingForm!: FormGroup;
  teams = signal<Team[]>([]);
  personnel = signal<Personal[]>([]);
  loading = signal<boolean>(false);

  // Location picker
  showLocationPicker = signal<boolean>(false);
  selectedLocation = signal<{ lat: number; lng: number } | null>(null);
  locationAddress = signal<string>('');

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

  openLocationPicker() {
    this.showLocationPicker.set(true);
  }

  onLocationSelected(location: { lat: number; lng: number }, address: string) {
    this.selectedLocation.set(location);
    this.locationAddress.set(address);
    this.bookingForm.patchValue({ address });
    this.showLocationPicker.set(false);
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
