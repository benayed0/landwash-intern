import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ServiceService } from '../../services/service.service';
import { Service, BookingType } from '../../models/service.model';
import { ServiceModalComponent } from './service-modal/service-modal.component';
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
  private dialog = inject(MatDialog);

  services: Service[] = [];
  filteredServices: Service[] = [];
  loading = false;
  deleteLoading = false;
  showDeleteConfirm = false;
  serviceToDelete: Service | null = null;
  selectedType: BookingType | 'all' = 'all';

  ngOnInit() {
    this.loadServices();
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

  applyFilter() {
    if (this.selectedType === 'all') {
      this.filteredServices = this.services;
    } else {
      this.filteredServices = this.services.filter(
        (s) => s.type === this.selectedType
      );
    }
  }

  onFilterChange(type: BookingType | 'all') {
    this.selectedType = type;
    this.applyFilter();
  }

  onEditService(service: Service) {
    const dialogRef = this.dialog.open(ServiceModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { service },
      panelClass: 'service-modal-dialog',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Service was updated successfully
        this.loadServices();
      }
    });
  }

  onDeleteService(service: Service) {
    this.serviceToDelete = service;
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
    }
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.serviceToDelete = null;
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
}
