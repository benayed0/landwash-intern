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
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../models/team.model';
import { Personal } from '../../../models/personal.model';
import { HotToastService } from '@ngneat/hot-toast';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputSwitchModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
  private toast = inject(HotToastService);
  private dialogRef = inject(MatDialogRef<CreateTeamModalComponent>);

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

    this.teamService.createTeam(teamData).subscribe({
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
