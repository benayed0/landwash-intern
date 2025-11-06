import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngneat/hot-toast';
import { PersonalService } from '../../../services/personal.service';
import { Personal, Role } from '../../../models/personal.model';
import { ServiceService } from '../../../services/service.service';
import { Service } from '../../../models/service.model';
import { BookingLabelService } from '../../../services/booking-label.service';
import { BookingType } from '../../../models/booking.model';

interface NewPersonal {
  email: string;
  name: string;
  password: string;
  role: Role;
  services?: string[];
  phone?: string;
}

@Component({
  selector: 'app-add-personal-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './add-personal-modal.component.html',
  styleUrl: './add-personal-modal.component.css',
})
export class AddPersonalModalComponent implements OnInit {
  personalService = inject(PersonalService);
  toast = inject(HotToastService);
  dialogRef = inject(MatDialogRef<AddPersonalModalComponent>);
  serviceService = inject(ServiceService);
  bookingLabelService = inject(BookingLabelService);
  services: Service[] = [];
  @Output() confirmAdd = new EventEmitter<Personal>();

  newPersonal: NewPersonal = {
    email: '',
    name: '',
    password: '',
    role: 'worker',
    phone: '',
  };

  passwordVisible = false;
  isSubmitting = false;
  emailError = '';
  nameError = '';

  ngOnInit() {
    this.resetForm();
    this.loadServices();
  }
  loadServices() {
    this.serviceService.getAllServices().subscribe({
      next: (services) => {
        this.services = services;
      },
      error: (err) => {
        console.error('Error loading services:', err);
      },
    });
  }
  generatePassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%'[Math.floor(Math.random() * 5)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  regeneratePassword() {
    this.newPersonal.password = this.generatePassword();
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  copyPassword() {
    if (navigator.clipboard && this.newPersonal.password) {
      navigator.clipboard.writeText(this.newPersonal.password).then(() => {
        this.toast.success('Mot de passe copié dans le presse-papiers!');
      });
    }
  }

  validateForm(): boolean {
    this.emailError = '';
    this.nameError = '';
    let isValid = true;

    // Validate email
    if (!this.newPersonal.email) {
      this.emailError = "L'email est requis";
      isValid = false;
    } else if (!this.isValidEmail(this.newPersonal.email)) {
      this.emailError = 'Email invalide';
      isValid = false;
    }

    // Validate name
    if (!this.newPersonal.name) {
      this.nameError = 'Le nom est requis';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.personalService
      .createPersonal(this.newPersonal)
      .subscribe(({ success, message, personal }) => {
        console.log(success, message);
        this.isSubmitting = false;

        if (!success) {
          if (message === 'duplicate-email') {
            this.toast.error('Cette adresse e-mail est déjà utilisée.');
            console.log('display error');

            return;
          }
          if (message === 'duplicate-phone') {
            this.toast.error('Ce numéro de téléphone est déjà utilisé.');
            return;
          }
        } else {
          this.toast.success('Compte créé avec succès !');
          this.confirmAdd.emit(personal);
        }
      });
  }

  onCancel() {
    this.dialogRef.close();
    this.resetForm();
  }

  resetForm() {
    this.newPersonal = {
      email: '',
      name: '',
      password: this.generatePassword(),
      role: 'worker',
      phone: '',
    };
    this.passwordVisible = false;
    this.isSubmitting = false;
    this.emailError = '';
    this.nameError = '';
  }

  // Service Selection Methods
  getSelectedServicesCount(): number {
    return this.newPersonal.services?.length || 0;
  }

  getGroupedServices(): { type: BookingType; count: number }[] {
    const grouped = new Map<BookingType, number>();

    this.services.forEach((service) => {
      const type = service.type as BookingType;
      grouped.set(type, (grouped.get(type) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([type, count]) => ({ type, count }));
  }

  isServiceTypeSelected(type: BookingType): boolean {
    if (!this.newPersonal.services || this.newPersonal.services.length === 0) {
      return false;
    }

    const servicesOfType = this.services
      .filter((s) => s.type === type && s._id)
      .map((s) => s._id!);

    return servicesOfType.some((id) => this.newPersonal.services?.includes(id));
  }

  toggleServiceType(type: BookingType): void {
    if (!this.newPersonal.services) {
      this.newPersonal.services = [];
    }

    const servicesOfType = this.services
      .filter((s) => s.type === type && s._id)
      .map((s) => s._id!);

    const allSelected = servicesOfType.every((id) =>
      this.newPersonal.services?.includes(id)
    );

    if (allSelected) {
      // Deselect all services of this type
      this.newPersonal.services = this.newPersonal.services.filter(
        (id) => !servicesOfType.includes(id)
      );
    } else {
      // Select all services of this type
      servicesOfType.forEach((id) => {
        if (!this.newPersonal.services?.includes(id)) {
          this.newPersonal.services?.push(id);
        }
      });
    }
  }

  getServiceTypeIcon(type: BookingType): string {
    return this.bookingLabelService.getBookingTypeIcon(type);
  }

  getServiceTypeLabel(type: BookingType): string {
    return this.bookingLabelService.getBookingTypeLabel(type);
  }

  selectAllServices(): void {
    this.newPersonal.services = this.services
      .filter((s) => s._id)
      .map((s) => s._id!);
  }

  deselectAllServices(): void {
    this.newPersonal.services = [];
  }
}
