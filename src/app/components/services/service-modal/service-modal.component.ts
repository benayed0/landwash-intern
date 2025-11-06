import {
  Component,
  Inject,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ServiceService } from '../../../services/service.service';
import { Service, BookingType, CarType, UpdateServiceDto } from '../../../models/service.model';
import { ServiceLocation } from '../../../models/service-location.model';

export interface ServiceModalData {
  service: Service;
  allLocations: ServiceLocation[];
}

@Component({
  selector: 'app-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './service-modal.component.html',
  styleUrl: './service-modal.component.css',
})
export class ServiceModalComponent implements OnInit {
  private serviceService = inject(ServiceService);

  formData: {
    type: BookingType | '';
    carType: CarType | '';
    price: number;
    duration: number;
    selectedLocationIds: string[];
  } = {
    type: '',
    carType: '',
    price: 0,
    duration: 60,
    selectedLocationIds: [],
  };

  bookingTypes: BookingType[] = ['small', 'big', 'salon', 'pickup'];
  carTypes: CarType[] = ['small', 'big', 'pickup'];
  isSubmitting = false;
  errors: { [key: string]: string } = {};

  constructor(
    public dialogRef: MatDialogRef<ServiceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceModalData
  ) {}

  ngOnInit() {
    this.resetForm();
  }

  resetForm() {
    if (this.data.service) {
      // Extract location IDs from service
      const locationIds: string[] = this.data.service.availableLocations
        .map((loc) => {
          if (typeof loc === 'string') {
            return loc;
          }
          const serviceLocation = loc as ServiceLocation;
          return serviceLocation._id || '';
        })
        .filter((id) => id !== '');

      this.formData = {
        type: this.data.service.type,
        carType: this.data.service.carType || '',
        price: this.data.service.price,
        duration: this.data.service.duration,
        selectedLocationIds: locationIds,
      };
    }
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.formData.type) {
      this.errors['type'] = 'Le type de service est requis';
      isValid = false;
    }

    if (this.formData.price <= 0) {
      this.errors['price'] = 'Le prix doit être supérieur à 0';
      isValid = false;
    }

    if (this.formData.duration <= 0) {
      this.errors['duration'] = 'La durée doit être supérieure à 0';
      isValid = false;
    }

    // Salon type doesn't require locations (service at home)
    if (this.formData.type !== 'salon') {
      if (!this.formData.selectedLocationIds || this.formData.selectedLocationIds.length === 0) {
        this.errors['locations'] = 'Au moins une localisation est requise pour ce type de service';
        isValid = false;
      }
    }

    return isValid;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    if (!this.data.service?._id) {
      return;
    }

    this.isSubmitting = true;

    const updateDto: UpdateServiceDto = {
      type: this.formData.type as BookingType,
      carType: this.formData.carType ? (this.formData.carType as CarType) : undefined,
      price: this.formData.price,
      duration: this.formData.duration,
      availableLocations: this.formData.selectedLocationIds,
    };

    this.serviceService.updateService(this.data.service._id, updateDto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error updating service:', err);
        this.isSubmitting = false;
        alert('Erreur lors de la modification du service');
      },
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  getTypeLabel(type: BookingType): string {
    const labels: Record<BookingType, string> = {
      small: 'Petit véhicule 🚗',
      big: 'Grand véhicule 🚙',
      salon: 'Salon ✨',
      pickup: 'Pick-up 🚚',
    };
    return labels[type];
  }

  getCarTypeLabel(carType: CarType): string {
    const labels: Record<CarType, string> = {
      small: 'Petite voiture 🚗',
      big: 'Grande voiture 🚙',
      pickup: 'Pick-up 🚚',
    };
    return labels[carType];
  }

  // Location selection helpers
  isLocationSelected(locationId: string): boolean {
    return this.formData.selectedLocationIds.includes(locationId);
  }

  toggleLocation(locationId: string) {
    const index = this.formData.selectedLocationIds.indexOf(locationId);
    if (index > -1) {
      // Remove location
      this.formData.selectedLocationIds.splice(index, 1);
    } else {
      // Add location
      this.formData.selectedLocationIds.push(locationId);
    }
    // Clear location error if user selects at least one
    if (this.formData.selectedLocationIds.length > 0) {
      delete this.errors['locations'];
    }
  }

  getAvailableLocations(): ServiceLocation[] {
    // Only show active locations
    return this.data.allLocations.filter((loc) => loc.isActive);
  }
}
