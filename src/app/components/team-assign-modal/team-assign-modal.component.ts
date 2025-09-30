import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking } from '../../models/booking.model';
import { Team } from '../../models/team.model';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'app-team-assign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-assign-modal.component.html',
  styleUrl: './team-assign-modal.component.css'
})
export class TeamAssignModalComponent implements OnInit {
  @Input() booking: Booking | null = null;
  @Input() isOpen = false;
  @Output() confirmAssign = new EventEmitter<{ id: string, teamId: string }>();
  @Output() close = new EventEmitter<void>();

  private teamService = inject(TeamService);

  teams: Team[] = [];
  selectedTeamId = '';
  loadingTeams = false;

  ngOnInit() {
    if (this.isOpen) {
      this.loadTeams();
    }
  }

  ngOnChanges() {
    if (this.isOpen && this.teams.length === 0) {
      this.loadTeams();
    }
    if (!this.isOpen) {
      this.selectedTeamId = '';
    }
  }

  loadTeams() {
    this.loadingTeams = true;
    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.loadingTeams = false;
      },
      error: (err) => {
        console.error('Error loading teams:', err);
        this.loadingTeams = false;
      }
    });
  }

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      'small': 'Citadines / Petites Voitures',
      'big': 'SUV / Grandes Voitures',
      'salon': 'Salon'
    };
    return labels[type] || type;
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  confirm() {
    if (this.booking?._id && this.selectedTeamId) {
      this.confirmAssign.emit({ id: this.booking._id, teamId: this.selectedTeamId });
    }
  }

  onClose() {
    this.close.emit();
  }
}
