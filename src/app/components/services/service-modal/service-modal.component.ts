import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { ServiceService } from '../../../services/service.service';
import { BookingLabelService } from '../../../services/booking-label.service';
import {
  Service,
  BookingType,
  CarType,
  ServiceType,
  UpdateServiceDto,
} from '../../../models/service.model';
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
  private bookingLabelService = inject(BookingLabelService);

  formData: {
    type: BookingType | '';
    variants: { [key in ServiceType]?: { price: number; duration: number } };
    selectedLocationIds: string[];
    selectedVariant: ServiceType; // Which variant we're currently editing
  } = {
    type: '',
    variants: {},
    selectedLocationIds: [],
    selectedVariant: 'all',
  };

  // Get booking types and car types from the shared service
  bookingTypes = this.bookingLabelService.getAllBookingTypes();
  carTypes = this.bookingLabelService.getAllCarTypes();
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

      // Copy variants from service
      const variants: { [key in ServiceType]?: { price: number; duration: number } } = {};
      Object.entries(this.data.service.variants).forEach(([key, value]) => {
        variants[key as ServiceType] = { ...value };
      });

      this.formData = {
        type: this.data.service.type,
        variants: variants,
        selectedLocationIds: locationIds,
        selectedVariant: 'all', // Default to 'all' variant
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

    // Validate that at least one variant exists
    if (!this.formData.variants || Object.keys(this.formData.variants).length === 0) {
      this.errors['variants'] = 'Au moins une variante de prix/durée est requise';
      isValid = false;
    } else {
      // Validate each variant
      Object.entries(this.formData.variants).forEach(([key, variant]) => {
        if (variant.price <= 0) {
          this.errors[`price_${key}`] = `Le prix pour ${key} doit être supérieur à 0`;
          isValid = false;
        }
        if (variant.duration <= 0) {
          this.errors[`duration_${key}`] = `La durée pour ${key} doit être supérieure à 0`;
          isValid = false;
        }
      });
    }

    // Salon type doesn't require locations (service at home)
    if (this.formData.type !== 'detailing' && this.formData.type !== 'salon') {
      if (
        !this.formData.selectedLocationIds ||
        this.formData.selectedLocationIds.length === 0
      ) {
        this.errors['locations'] =
          'Au moins une localisation est requise pour ce type de service';
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

    // Build variants record from form data
    const variants: Record<ServiceType, { price: number; duration: number }> = {} as Record<ServiceType, { price: number; duration: number }>;
    Object.entries(this.formData.variants).forEach(([key, value]) => {
      if (value) {
        variants[key as ServiceType] = value;
      }
    });

    // Only send editable fields
    const updateDto: UpdateServiceDto = {
      variants: variants,
      availableLocations: this.formData.selectedLocationIds,
    };

    this.serviceService
      .updateService(this.data.service._id, updateDto)
      .subscribe({
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
    const icon = this.bookingLabelService.getBookingTypeIcon(type);
    const label = this.bookingLabelService.getBookingTypeLabel(type);
    return `${label} ${icon}`;
  }

  getCarTypeLabel(carType: CarType): string {
    return this.bookingLabelService.getCarTypeLabel(carType);
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
    // Only show active locations and sort selected ones first
    return this.data.allLocations
      .filter((loc) => loc.isActive)
      .sort((a, b) => {
        const aSelected = this.isLocationSelected(a._id!);
        const bSelected = this.isLocationSelected(b._id!);
        // Selected locations first
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        // Otherwise maintain original order
        return 0;
      });
  }

  // Helper methods for display-only fields
  getDisplayTypeLabel(): string {
    return this.formData.type ? this.getTypeLabel(this.formData.type as BookingType) : '';
  }

  // Get all available variant types for this service
  getVariantTypes(): ServiceType[] {
    // Salon services can only have 'all' variant (no car-specific pricing)
    if (this.formData.type === 'salon') {
      return ['all'];
    }

    // Other service types can only have car-specific variants (not 'all')
    const carTypeValues = this.carTypes.map(ct => ct.value as CarType);
    return carTypeValues;
  }

  // Get variant data for a specific type
  getVariantData(type: ServiceType): { price: number; duration: number } | undefined {
    return this.formData.variants[type];
  }

  // Update variant data
  updateVariant(type: ServiceType, field: 'price' | 'duration', value: number) {
    if (!this.formData.variants[type]) {
      this.formData.variants[type] = { price: 0, duration: 60 };
    }
    this.formData.variants[type]![field] = value;
  }

  // Add a variant
  addVariant(type: ServiceType) {
    if (!this.formData.variants[type]) {
      this.formData.variants[type] = { price: 0, duration: 60 };
    }
  }

  // Remove a variant
  removeVariant(type: ServiceType) {
    delete this.formData.variants[type];
  }

  // Check if variant exists
  hasVariant(type: ServiceType): boolean {
    return !!this.formData.variants[type];
  }
}
