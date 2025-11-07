import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  inject,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { TeamService } from '../../../services/team.service';
import { ServiceLocationService } from '../../../services/service-location.service';
import { Team } from '../../../models/team.model';
import { Personal } from '../../../models/personal.model';
import { ServiceLocation } from '../../../models/service-location.model';
import { HotToastService } from '@ngneat/hot-toast';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    MatCheckboxModule,
    MatSliderModule,
  ],
  templateUrl: './create-team-modal.component.html',
  styleUrl: './create-team-modal.component.css',
})
export class CreateTeamModalComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() availablePersonals: Personal[] = [];
  @Output() teamCreated = new EventEmitter<Team>();

  private teamService = inject(TeamService);
  private serviceLocationService = inject(ServiceLocationService);
  private toast = inject(HotToastService);
  private dialogRef = inject(MatDialogRef<CreateTeamModalComponent>);

  availableLocations: ServiceLocation[] = [];
  selectedLocationIds: Set<string> = new Set();
  locationsLoading = false;

  newTeam: Partial<Team> = {
    name: '',
    members: [],
    coordinates: undefined,
    radius: 10000,
  };

  selectedPersonals: Set<string> = new Set();
  selectedChiefId: string | null = null;
  isSubmitting = false;
  nameError = '';

  // Map related properties
  private map: L.Map | null = null;
  private locationMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;
  mapInitialized = false;

  ngOnInit() {
    this.resetForm();
    this.loadLocations();
  }

  loadLocations() {
    this.locationsLoading = true;
    this.serviceLocationService.getAllLocations().subscribe({
      next: (locations) => {
        this.availableLocations = locations.filter(loc => loc.isActive !== false);
        this.locationsLoading = false;
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.locationsLoading = false;
      },
    });
  }

  ngAfterViewInit() {
    // Initialize map after view is ready
    setTimeout(() => this.initializeMap(), 200);
  }

  ngOnChanges() {
    // Map initialization will be handled in ngAfterViewInit
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  initializeMap() {
    if (this.mapInitialized || !document.getElementById('map')) return;

    try {
      // Initialize map centered on Tunisia
      this.map = L.map('map').setView([36.8, 10.2], 7);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      // Add click event to map
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.setLocation(e.latlng.lat, e.latlng.lng);
      });

      this.mapInitialized = true;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  setLocation(lat: number, lng: number) {
    if (!this.map) return;

    // Remove existing marker and circle
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }

    // Create custom marker icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });

    // Add new marker
    this.locationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(
      this.map
    );

    // Add radius circle (convert km to meters for Leaflet)
    this.radiusCircle = L.circle([lat, lng], {
      radius: this.newTeam.radius || 1,
      fillColor: '#c3ff00',
      color: '#c3ff00',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.2,
    }).addTo(this.map);

    // Update team location
    this.newTeam.coordinates = [lng, lat];
  }

  onRadiusChange() {
    if (this.radiusCircle && this.newTeam.coordinates) {
      // Convert km to meters for Leaflet
      this.radiusCircle.setRadius(this.newTeam.radius || 1);
    }
  }

  onPersonalToggle(personalId: string) {
    if (this.selectedPersonals.has(personalId)) {
      this.selectedPersonals.delete(personalId);
      // If removing a member who is the chief, also remove them as chief
      if (this.selectedChiefId === personalId) {
        this.selectedChiefId = null;
      }
    } else {
      this.selectedPersonals.add(personalId);
    }
    this.newTeam.members = Array.from(this.selectedPersonals);
  }

  isPersonalSelected(personalId: string): boolean {
    return this.selectedPersonals.has(personalId);
  }

  onChiefToggle(personalId: string, isChief: boolean) {
    if (isChief) {
      // Setting as chief
      this.selectedChiefId = personalId;
      // Automatically add chief to team members if not already selected
      if (!this.selectedPersonals.has(personalId)) {
        this.selectedPersonals.add(personalId);
        this.newTeam.members = Array.from(this.selectedPersonals);
      }
    } else {
      // Removing as chief
      if (this.selectedChiefId === personalId) {
        this.selectedChiefId = null;
      }
    }
  }

  isChief(personalId: string): boolean {
    return this.selectedChiefId === personalId;
  }

  onLocationToggle(locationId: string) {
    if (this.selectedLocationIds.has(locationId)) {
      this.selectedLocationIds.delete(locationId);
    } else {
      this.selectedLocationIds.add(locationId);
    }
  }

  isLocationSelected(locationId: string): boolean {
    return this.selectedLocationIds.has(locationId);
  }

  onSubmit() {
    if (!this.validateForm()) return;

    this.isSubmitting = true;

    // Prepare team data with chiefId
    let chiefId = undefined;
    if (this.selectedChiefId) {
      const chief = this.availablePersonals.find(
        (p) => p._id === this.selectedChiefId
      );
      if (chief) {
        chiefId = {
          _id: chief._id,
          name: chief.name,
          email: chief.email,
        };
      }
    }

    const teamData: Partial<Team> = {
      ...this.newTeam,
      chiefId,
    };

    const selectedLocationIdArray = Array.from(this.selectedLocationIds);

    // Create team first
    this.teamService.createTeam(teamData).subscribe({
      next: (team) => {
        // Now update service locations
        this.addTeamToLocations(team._id!, selectedLocationIdArray).then(() => {
          this.toast.success('Équipe créée avec succès!');
          // Emit team with location info for parent component to update locally
          const teamWithLocationIds = {
            ...team,
            _locationIds: selectedLocationIdArray,
          };
          this.teamCreated.emit(teamWithLocationIds as any);
          this.onCancel();
        }).catch((err: any) => {
          console.error('Error updating service locations:', err);
          this.toast.error('Équipe créée mais erreur lors de la mise à jour des localisations');
          this.isSubmitting = false;
        });
      },
      error: (err) => {
        console.error('Error creating team:', err);
        this.toast.error("Erreur lors de la création de l'équipe");
        this.isSubmitting = false;
      },
    });
  }

  async addTeamToLocations(teamId: string, locationIds: string[]): Promise<void> {
    const updatePromises: Promise<any>[] = [];

    // Add team to selected locations
    for (const locationId of locationIds) {
      const location = this.availableLocations.find(loc => loc._id === locationId);
      if (location) {
        const updatedTeams = [...(location.teams || []).map((t: any) => typeof t === 'string' ? t : t._id), teamId];
        updatePromises.push(
          firstValueFrom(this.serviceLocationService.updateLocation(locationId, { teams: updatedTeams }))
        );
      }
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);
  }

  validateForm(): boolean {
    this.nameError = '';

    if (!this.newTeam.name?.trim()) {
      this.nameError = "Le nom de l'équipe est requis";
      return false;
    }

    if (this.newTeam.name.trim().length < 2) {
      this.nameError = 'Le nom doit contenir au moins 2 caractères';
      return false;
    }

    if (!this.selectedChiefId) {
      this.toast.error("Vous devez sélectionner un chef d'équipe");
      return false;
    }

    return true;
  }

  onCancel() {
    this.resetForm();
    this.destroyMap();
    this.dialogRef.close();
  }

  resetForm() {
    this.newTeam = {
      name: '',
      members: [],
      coordinates: undefined,
      radius: 10000,
    };
    this.selectedPersonals.clear();
    this.selectedChiefId = null;
    this.selectedLocationIds.clear();
    this.isSubmitting = false;
    this.nameError = '';
  }

  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.locationMarker = null;
      this.radiusCircle = null;
      this.mapInitialized = false;
    }
  }

  getPersonalName(personalId: string): string {
    const personal = this.availablePersonals.find((p) => p._id === personalId);
    return personal?.name || 'Personnel inconnu';
  }
}
