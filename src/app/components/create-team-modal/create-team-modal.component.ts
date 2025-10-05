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
import { TeamService } from '../../services/team.service';
import { PersonalService } from '../../services/personal.service';
import { Team } from '../../models/team.model';
import { Personal } from '../../models/personal.model';
import { HotToastService } from '@ngneat/hot-toast';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-team-modal.component.html',
  styleUrl: './create-team-modal.component.css',
})
export class CreateTeamModalComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() isOpen = false;
  @Input() availablePersonals: Personal[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() teamCreated = new EventEmitter<Team>();

  private teamService = inject(TeamService);
  private personalService = inject(PersonalService);
  private toast = inject(HotToastService);

  newTeam: Partial<Team> = {
    name: '',
    members: [],
    coordinates: undefined,
    radius: 1,
  };

  selectedPersonals: Set<string> = new Set();
  isSubmitting = false;
  nameError = '';

  // Map related properties
  private map: L.Map | null = null;
  private locationMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;
  mapInitialized = false;

  ngOnInit() {
    this.resetForm();
  }

  ngAfterViewInit() {
    // Map will be initialized when modal opens
  }

  ngOnChanges() {
    if (this.isOpen && !this.mapInitialized) {
      setTimeout(() => this.initializeMap(), 200);
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  onModalOpen() {
    if (!this.mapInitialized) {
      setTimeout(() => this.initializeMap(), 100);
    }
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
      radius: (this.newTeam.radius || 1) * 1000,
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
      this.radiusCircle.setRadius((this.newTeam.radius || 1) * 1000);

      // Adjust zoom level based on new radius for optimal view
      const newZoom = this.calculateZoomFromRadius(this.newTeam.radius || 1);
      this.map?.setZoom(newZoom);
    }
  }

  onPersonalToggle(personalId: string) {
    if (this.selectedPersonals.has(personalId)) {
      this.selectedPersonals.delete(personalId);
    } else {
      this.selectedPersonals.add(personalId);
    }
    this.newTeam.members = Array.from(this.selectedPersonals);
  }

  isPersonalSelected(personalId: string): boolean {
    return this.selectedPersonals.has(personalId);
  }

  onSubmit() {
    if (!this.validateForm()) return;

    this.isSubmitting = true;

    this.teamService.createTeam(this.newTeam).subscribe({
      next: (team) => {
        this.toast.success('Équipe créée avec succès!');
        this.teamCreated.emit(team);
        this.onCancel();
      },
      error: (err) => {
        console.error('Error creating team:', err);
        this.toast.error("Erreur lors de la création de l'équipe");
        this.isSubmitting = false;
      },
    });
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

    return true;
  }

  onCancel() {
    this.resetForm();
    this.destroyMap();
    this.close.emit();
  }

  resetForm() {
    this.newTeam = {
      name: '',
      members: [],
      coordinates: undefined,
      radius: 1,
    };
    this.selectedPersonals.clear();
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

  calculateZoomFromRadius(radiusKm: number): number {
    // Calculate appropriate zoom level based on radius
    // Smaller radius = higher zoom (closer view)
    // Larger radius = lower zoom (wider view)

    if (radiusKm <= 1) return 15;      // Very close for small areas
    if (radiusKm <= 3) return 13;      // Close for neighborhoods
    if (radiusKm <= 5) return 12;      // City district level
    if (radiusKm <= 10) return 11;     // City level
    if (radiusKm <= 20) return 10;     // Multiple cities
    if (radiusKm <= 50) return 9;      // Regional level
    return 8;                          // Wide regional view
  }
}
