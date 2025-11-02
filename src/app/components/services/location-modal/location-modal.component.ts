import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { ServiceLocationService } from '../../../services/service-location.service';
import { ServiceLocation } from '../../../models/service-location.model';
import { LocationPickerComponent } from '../../location-picker/location-picker.component';
import { SelectedLocation } from '../../../services/location.service';

export interface LocationModalData {
  location?: ServiceLocation; // If provided, we're editing
}

@Component({
  selector: 'app-location-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, LocationPickerComponent],
  templateUrl: './location-modal.component.html',
  styleUrl: './location-modal.component.css',
})
export class LocationModalComponent implements OnInit {
  private serviceLocationService = inject(ServiceLocationService);

  formData: {
    coordinates: [number, number];
    address: string;
    isActive: boolean;
  } = {
    coordinates: [10.1815, 36.8065], // Default to Tunis
    address: '',
    isActive: true,
  };

  isSubmitting = false;
  errors: { [key: string]: string } = {};
  isEditing = false;
  showLocationPicker = signal<boolean>(true);

  constructor(
    public dialogRef: MatDialogRef<LocationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LocationModalData | null
  ) {
    this.isEditing = !!(data && data.location);
  }

  ngOnInit() {
    if (this.data && this.data.location) {
      this.formData = {
        coordinates: [...this.data.location.coordinates] as [number, number],
        address: this.data.location.address,
        isActive: this.data.location.isActive ?? true,
      };
    }
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.formData.address || this.formData.address.trim() === '') {
      this.errors['address'] = "L'adresse est requise";
      isValid = false;
    }

    if (
      !this.formData.coordinates ||
      this.formData.coordinates.length !== 2 ||
      isNaN(this.formData.coordinates[0]) ||
      isNaN(this.formData.coordinates[1])
    ) {
      this.errors['coordinates'] = 'Les coordonnées sont invalides';
      isValid = false;
    }

    return isValid;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    const locationData = {
      coordinates: this.formData.coordinates,
      address: this.formData.address,
      isActive: this.formData.isActive,
    };

    const request = this.isEditing && this.data && this.data.location?._id
      ? this.serviceLocationService.updateLocation(
          this.data.location._id,
          locationData
        )
      : this.serviceLocationService.createLocation(locationData);

    request.subscribe({
      next: (location) => {
        this.isSubmitting = false;
        this.dialogRef.close(location); // Return the created/updated location
      },
      error: (err) => {
        console.error('Error saving location:', err);
        this.isSubmitting = false;
        alert('Erreur lors de la sauvegarde de la localisation');
      },
    });
  }

  onClose() {
    this.dialogRef.close(null);
  }

  onLocationSelected(location: SelectedLocation) {
    this.formData.coordinates = [location.lng, location.lat];

    // If address is empty, set the suggested address from location picker
    if (!this.formData.address || this.formData.address.trim() === '') {
      this.formData.address = location.address;
    }

    // Clear any errors
    delete this.errors['address'];
    delete this.errors['coordinates'];
  }

  getInitialLocation(): SelectedLocation | null {
    if (
      this.formData.coordinates &&
      this.formData.coordinates.length === 2
    ) {
      return {
        lat: this.formData.coordinates[1],
        lng: this.formData.coordinates[0],
        address: this.formData.address || '',
      };
    }
    return null;
  }
}
