import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { ServiceLocationService } from '../../../services/service-location.service';
import { TeamService } from '../../../services/team.service';
import { ServiceService } from '../../../services/service.service';
import { BookingLabelService } from '../../../services/booking-label.service';
import { ServiceLocation } from '../../../models/service-location.model';
import { Team } from '../../../models/team.model';
import { Service } from '../../../models/service.model';
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
  private teamService = inject(TeamService);
  private serviceService = inject(ServiceService);
  private bookingLabelService = inject(BookingLabelService);

  formData: {
    coordinates: [number, number];
    address: string;
    isActive: boolean;
    teams: string[];
  } = {
    coordinates: [10.1815, 36.8065], // Default to Tunis
    address: '',
    isActive: true,
    teams: [],
  };

  availableTeams: Team[] = [];
  allServices: Service[] = [];
  loading = false;
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
    this.loadTeams();
    this.loadServices();

    if (this.data && this.data.location) {
      // Extract team IDs from populated teams or use as-is if already IDs
      const teamIds = this.data.location.teams?.map(team =>
        typeof team === 'string' ? team : team._id!
      ) || [];

      this.formData = {
        coordinates: [...this.data.location.coordinates] as [number, number],
        address: this.data.location.address,
        isActive: this.data.location.isActive ?? true,
        teams: teamIds,
      };
    }
  }

  loadServices() {
    this.serviceService.getAllServices().subscribe({
      next: (services: Service[]) => {
        this.allServices = services;
      },
      error: (err: any) => {
        console.error('Error loading services:', err);
      },
    });
  }

  loadTeams() {
    this.loading = true;
    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.availableTeams = teams;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading teams:', err);
        this.loading = false;
      },
    });
  }

  isLocationUsedByServices(): boolean {
    if (!this.isEditing || !this.data?.location?._id) {
      return false;
    }

    return this.allServices.some(service =>
      service.availableLocations.some(loc =>
        typeof loc === 'string' ? loc === this.data!.location!._id : loc._id === this.data!.location!._id
      )
    );
  }

  getServicesUsingLocation(): Service[] {
    if (!this.isEditing || !this.data?.location?._id) {
      return [];
    }

    return this.allServices.filter(service =>
      service.availableLocations.some(loc =>
        typeof loc === 'string' ? loc === this.data!.location!._id : loc._id === this.data!.location!._id
      )
    );
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

    // Check if trying to remove all teams from a location that's being used by services
    if (this.isEditing && this.formData.teams.length === 0 && this.isLocationUsedByServices()) {
      const servicesUsing = this.getServicesUsingLocation();
      const serviceLabels = servicesUsing
        .map(s => this.bookingLabelService.getBookingTypeLabel(s.type))
        .join(', ');
      this.errors['teams'] = `Cette localisation est utilisée par des services (${serviceLabels}). Vous devez d'abord la retirer de ces services ou assigner au moins une équipe.`;
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
      teams: this.formData.teams,
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

  toggleTeamSelection(teamId: string) {
    const index = this.formData.teams.indexOf(teamId);
    if (index > -1) {
      this.formData.teams.splice(index, 1);
    } else {
      this.formData.teams.push(teamId);
    }
  }

  isTeamSelected(teamId: string): boolean {
    return this.formData.teams.includes(teamId);
  }
}
