import {
  Component,
  Inject,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ServiceService } from '../../../services/service.service';
import { Service, BookingType, UpdateServiceDto, ServiceLocation } from '../../../models/service.model';
import { LocationPickerComponent } from '../../location-picker/location-picker.component';
import { SelectedLocation } from '../../../services/location.service';

export interface ServiceModalData {
  service: Service;
}

@Component({
  selector: 'app-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, LocationPickerComponent],
  templateUrl: './service-modal.component.html',
  styleUrl: './service-modal.component.css',
})
export class ServiceModalComponent implements OnInit {
  private serviceService = inject(ServiceService);

  formData: {
    type: BookingType | '';
    price: number;
    duration: number;
    availableLocations: ServiceLocation[];
  } = {
    type: '',
    price: 0,
    duration: 60,
    availableLocations: [],
  };

  bookingTypes: BookingType[] = ['small', 'big', 'salon', 'pickup'];
  isSubmitting = false;
  errors: { [key: string]: string } = {};

  // Signals for location tracking
  currentLocationIndex = signal<number>(0);
  editingLocationIndex = signal<number | null>(null);

  constructor(
    public dialogRef: MatDialogRef<ServiceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceModalData
  ) {}

  ngOnInit() {
    this.resetForm();
  }

  resetForm() {
    if (this.data.service) {
      this.formData = {
        type: this.data.service.type,
        price: this.data.service.price,
        duration: this.data.service.duration,
        availableLocations: this.data.service.availableLocations.map((loc) => ({
          coordinates: [...loc.coordinates] as [number, number],
          address: loc.address,
        })),
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
      if (!this.formData.availableLocations || this.formData.availableLocations.length === 0) {
        this.errors['locations'] = 'Au moins une localisation est requise';
        isValid = false;
      } else {
        // Validate each location
        for (let i = 0; i < this.formData.availableLocations.length; i++) {
          const location = this.formData.availableLocations[i];

          if (!location.address || location.address.trim() === '') {
            this.errors[`address_${i}`] = "L'adresse est requise";
            isValid = false;
          }

          if (
            !location.coordinates ||
            location.coordinates.length !== 2 ||
            isNaN(location.coordinates[0]) ||
            isNaN(location.coordinates[1])
          ) {
            this.errors[`coordinates_${i}`] = 'Les coordonnées sont invalides';
            isValid = false;
          }
        }
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
      price: this.formData.price,
      duration: this.formData.duration,
      availableLocations: this.formData.availableLocations,
    };

    this.serviceService.updateService(this.data.service._id, updateDto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.dialogRef.close(true); // Pass true to indicate success
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

  // Location management with map picker
  addLocation() {
    this.formData.availableLocations.push({
      coordinates: [10.1815, 36.8065],
      address: '',
    });
    // Set the newly added location as the one being edited
    this.editingLocationIndex.set(this.formData.availableLocations.length - 1);
  }

  removeLocation(index: number) {
    if (this.formData.availableLocations.length > 1) {
      this.formData.availableLocations.splice(index, 1);
      // Clear editing state if we removed the location being edited
      if (this.editingLocationIndex() === index) {
        this.editingLocationIndex.set(null);
      }
    }
  }

  editLocation(index: number) {
    this.editingLocationIndex.set(index);
  }

  onLocationSelected(location: SelectedLocation, index: number) {
    this.formData.availableLocations[index] = {
      coordinates: [location.lng, location.lat],
      address: location.address,
    };
    // Clear any errors for this location
    delete this.errors[`address_${index}`];
    delete this.errors[`coordinates_${index}`];
  }

  getInitialLocation(index: number): SelectedLocation | null {
    const loc = this.formData.availableLocations[index];
    if (loc && loc.coordinates && loc.coordinates.length === 2) {
      return {
        lat: loc.coordinates[1],
        lng: loc.coordinates[0],
        address: loc.address || '',
      };
    }
    return null;
  }
}
