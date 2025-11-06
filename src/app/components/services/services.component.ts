import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ServiceService } from '../../services/service.service';
import { ServiceLocationService } from '../../services/service-location.service';
import { Service, BookingType } from '../../models/service.model';
import { ServiceLocation } from '../../models/service-location.model';
import { ServiceModalComponent } from './service-modal/service-modal.component';
import { LocationModalComponent } from './location-modal/location-modal.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private serviceLocationService = inject(ServiceLocationService);
  private dialog = inject(MatDialog);

  services: Service[] = [];
  filteredServices: Service[] = [];
  groupedServices: Map<BookingType, Service[]> = new Map();
  locations: ServiceLocation[] = [];
  loading = false;
  locationsLoading = false;
  deleteLoading = false;
  showDeleteConfirm = false;
  serviceToDelete: Service | null = null;
  locationToDelete: ServiceLocation | null = null;
  selectedType: BookingType | 'all' = 'all';

  // View mode: 'services' or 'locations'
  viewMode: 'services' | 'locations' = 'services';

  ngOnInit() {
    this.loadServices();
    this.loadLocations();
  }

  loadServices() {
    this.loading = true;
    this.serviceService.getAllServices().subscribe({
      next: (services) => {
        this.services = services;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading services:', err);
        this.loading = false;
      },
    });
  }

  loadLocations() {
    this.locationsLoading = true;
    this.serviceLocationService.getAllLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.locationsLoading = false;
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.locationsLoading = false;
      },
    });
  }

  applyFilter() {
    if (this.selectedType === 'all') {
      this.filteredServices = this.services;
    } else {
      this.filteredServices = this.services.filter(
        (s) => s.type === this.selectedType
      );
    }
    this.groupServicesByType();
  }

  groupServicesByType() {
    this.groupedServices.clear();

    this.filteredServices.forEach(service => {
      if (!this.groupedServices.has(service.type)) {
        this.groupedServices.set(service.type, []);
      }
      this.groupedServices.get(service.type)!.push(service);
    });
  }

  getGroupedServicesArray(): Array<{ type: BookingType; services: Service[] }> {
    return Array.from(this.groupedServices.entries()).map(([type, services]) => ({
      type,
      services
    }));
  }

  onFilterChange(type: BookingType | 'all') {
    this.selectedType = type;
    this.applyFilter();
  }

  switchView(mode: 'services' | 'locations') {
    this.viewMode = mode;
  }

  // Service operations
  onEditService(service: Service) {
    const dialogRef = this.dialog.open(ServiceModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { service, allLocations: this.locations },
      panelClass: 'service-modal-dialog',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadServices();
      }
    });
  }

  onDeleteService(service: Service) {
    this.serviceToDelete = service;
    this.locationToDelete = null;
    this.showDeleteConfirm = true;
  }

  // Location operations
  onAddLocation() {
    const dialogRef = this.dialog.open(LocationModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'location-modal-dialog',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadLocations();
        this.loadServices(); // Reload services in case they reference the new location
      }
    });
  }

  onEditLocation(location: ServiceLocation) {
    const dialogRef = this.dialog.open(LocationModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { location },
      panelClass: 'location-modal-dialog',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadLocations();
        this.loadServices(); // Reload services to show updated location data
      }
    });
  }

  onDeleteLocation(location: ServiceLocation) {
    this.locationToDelete = location;
    this.serviceToDelete = null;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (this.serviceToDelete?._id) {
      this.deleteLoading = true;
      this.serviceService.deleteService(this.serviceToDelete._id).subscribe({
        next: () => {
          this.loadServices();
          this.closeDeleteConfirm();
          this.deleteLoading = false;
        },
        error: (err) => {
          console.error('Error deleting service:', err);
          this.deleteLoading = false;
          alert('Erreur lors de la suppression du service');
        },
      });
    } else if (this.locationToDelete?._id) {
      // Only check if location is used by services if it's active
      // Inactive locations can be deleted even if referenced by services
      const locationId = this.locationToDelete._id;
      const isActive = this.locationToDelete.isActive !== false;

      if (isActive) {
        const isLocationUsed = this.services.some((service) =>
          service.availableLocations.some((loc) => {
            if (typeof loc === 'string') {
              return loc === locationId;
            }
            const serviceLocation = loc as ServiceLocation;
            return serviceLocation._id === locationId;
          })
        );

        if (isLocationUsed) {
          alert(
            'Cette localisation active est utilisée par un ou plusieurs services. Veuillez d\'abord la désactiver ou retirer cette localisation des services concernés.'
          );
          this.closeDeleteConfirm();
          return;
        }
      }

      this.deleteLoading = true;
      this.serviceLocationService
        .deleteLocation(this.locationToDelete._id)
        .subscribe({
          next: () => {
            this.loadLocations();
            this.closeDeleteConfirm();
            this.deleteLoading = false;
          },
          error: (err) => {
            console.error('Error deleting location:', err);
            this.deleteLoading = false;
            alert('Erreur lors de la suppression de la localisation');
          },
        });
    }
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.serviceToDelete = null;
    this.locationToDelete = null;
  }

  getServiceTypeLabel(type: BookingType): string {
    const labels: Record<BookingType, string> = {
      small: 'Petit véhicule',
      big: 'Grand véhicule',
      salon: 'Salon',
      pickup: 'Pick-up',
    };
    return labels[type] || type;
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  }

  // Helper method to get locations from service (handles both populated and ID-only cases)
  getServiceLocations(service: Service): ServiceLocation[] {
    return service.availableLocations.filter(
      (loc): loc is ServiceLocation => typeof loc !== 'string'
    );
  }

  // Get only active locations for a service
  getActiveServiceLocations(service: Service): ServiceLocation[] {
    return this.getServiceLocations(service).filter(
      (loc) => loc.isActive !== false
    );
  }

  // Get inactive locations for a service
  getInactiveServiceLocations(service: Service): ServiceLocation[] {
    return this.getServiceLocations(service).filter(
      (loc) => loc.isActive === false
    );
  }

  // Count services using a location
  getServicesUsingLocation(location: ServiceLocation): number {
    const locationId = location._id;
    if (!locationId) return 0;

    return this.services.filter((service) =>
      service.availableLocations.some((loc) => {
        if (typeof loc === 'string') {
          return loc === locationId;
        }
        const serviceLocation = loc as ServiceLocation;
        return serviceLocation._id === locationId;
      })
    ).length;
  }
}
