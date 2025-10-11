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
import { InputSwitchModule } from 'primeng/inputswitch';
import { TeamService } from '../../../services/team.service';
import { PersonalService } from '../../../services/personal.service';
import { Team } from '../../../models/team.model';
import { Personal } from '../../../models/personal.model';
import { HotToastService } from '@ngneat/hot-toast';
import * as L from 'leaflet';

@Component({
  selector: 'app-edit-team-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, InputSwitchModule],
  templateUrl: './edit-team-modal.component.html',
  styleUrl: './edit-team-modal.component.css',
})
export class EditTeamModalComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() isOpen = false;
  @Input() team: Team | null = null;
  @Input() availablePersonals: Personal[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() teamUpdated = new EventEmitter<Team>();

  private teamService = inject(TeamService);
  private personalService = inject(PersonalService);
  private toast = inject(HotToastService);

  editedTeam: Partial<Team> = {
    name: '',
    members: [],
    coordinates: undefined,
    radius: 1,
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
    this.initializeForm();
  }

  ngAfterViewInit() {
    // Map will be initialized when modal opens
  }

  ngOnChanges() {
    if (this.isOpen && !this.mapInitialized) {
      setTimeout(() => this.initializeMap(), 200);
    }
    if (this.team) {
      this.initializeForm();
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  initializeForm() {
    if (this.team) {
      this.editedTeam = {
        name: this.team.name,
        members: Array.isArray(this.team.members)
          ? typeof this.team.members[0] === 'object'
            ? (this.team.members as Personal[]).map((m) => m._id)
            : [...(this.team.members as string[])]
          : [],
        coordinates: this.team.coordinates
          ? [...this.team.coordinates]
          : undefined,
        radius: this.team.radius || 1,
      };
      this.selectedPersonals = new Set(
        Array.isArray(this.team.members)
          ? typeof this.team.members[0] === 'object'
            ? (this.team.members as Personal[]).map((m) => m._id)
            : [...(this.team.members as string[])]
          : []
      );

      // Initialize chief selection
      this.selectedChiefId = (this.team.chiefId as string) || null;
    }
  }

  initializeMap() {
    if (this.mapInitialized || !document.getElementById('edit-map')) return;

    try {
      // Initialize map centered on Tunisia or existing location
      const center = this.editedTeam.coordinates
        ? [this.editedTeam.coordinates[1], this.editedTeam.coordinates[0]]
        : [36.8, 10.2];

      // Calculate zoom level based on radius for optimal view
      const zoomLevel = this.calculateZoomFromRadius(
        this.editedTeam.radius || 1
      );

      this.map = L.map('edit-map').setView(
        center as [number, number],
        this.editedTeam.coordinates ? zoomLevel : 7
      );

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      // Add click event to map
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.setLocation(e.latlng.lat, e.latlng.lng);
      });

      // If there's an existing location, show it with marker and radius circle
      if (this.editedTeam.coordinates) {
        this.setLocation(
          this.editedTeam.coordinates[1], // lat
          this.editedTeam.coordinates[0] // lng
        );
      }

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
      radius: this.editedTeam.radius || 1,
      fillColor: '#c3ff00',
      color: '#c3ff00',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.2,
    }).addTo(this.map);

    // Update team location
    this.editedTeam.coordinates = [lng, lat];
  }

  onRadiusChange() {
    if (this.radiusCircle && this.editedTeam.coordinates) {
      // Convert km to meters for Leaflet
      this.radiusCircle.setRadius(this.editedTeam.radius || 1);

      // Adjust zoom level based on new radius for optimal view
      const newZoom = this.calculateZoomFromRadius(this.editedTeam.radius || 1);
      this.map?.setZoom(newZoom);
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
    this.editedTeam.members = Array.from(this.selectedPersonals);
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
        this.editedTeam.members = Array.from(this.selectedPersonals);
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

  onSubmit() {
    if (!this.validateForm() || !this.team?._id) return;

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
      ...this.editedTeam,
      chiefId,
    };

    this.teamService.updateTeam(this.team._id, teamData).subscribe({
      next: (team) => {
        this.toast.success('Équipe mise à jour avec succès!');
        this.teamUpdated.emit(team);
        this.onCancel();
      },
      error: (err) => {
        console.error('Error updating team:', err);
        this.toast.error("Erreur lors de la mise à jour de l'équipe");
        this.isSubmitting = false;
      },
    });
  }

  validateForm(): boolean {
    this.nameError = '';

    if (!this.editedTeam.name?.trim()) {
      this.nameError = "Le nom de l'équipe est requis";
      return false;
    }

    if (this.editedTeam.name.trim().length < 2) {
      this.nameError = 'Le nom doit contenir au moins 2 caractères';
      return false;
    }

    return true;
  }

  onCancel() {
    this.destroyMap();
    this.close.emit();
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

    // Compute zoom level based on radius using a logarithmic scale
    // Typical Leaflet zoom: 8 (country) to 15 (street)
    // This formula gives higher zoom for smaller radius, lower for larger
    const minZoom = 8;
    const maxZoom = 15;
    const minRadius = 1; // km
    const maxRadius = 100; // km (adapted to 100km)

    // Clamp radius to avoid extreme zooms
    const clampedRadius = Math.max(minRadius, Math.min(radiusKm, maxRadius));
    // Invert radius for zoom: smaller radius = higher zoom
    const zoom =
      maxZoom -
      Math.log10(clampedRadius / minRadius) *
        ((maxZoom - minZoom) / Math.log10(maxRadius / minRadius));
    return Math.round(zoom);
  }
}
