import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  inject,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking } from '../../../models/booking.model';
import { Team } from '../../../models/team.model';
import { TeamService } from '../../../services/team.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-team-assign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './team-assign-modal.component.html',
  styleUrl: './team-assign-modal.component.css',
})
export class TeamAssignModalComponent implements OnInit {
  @Output() confirmAssign = new EventEmitter<{
    booking: Booking;
    teamId: string;
  }>();
  @Output() reassignTeam = new EventEmitter<{
    booking: Booking;
    teamId: string;
  }>();

  private teamService = inject(TeamService);

  booking: Booking;
  isReassignment: boolean;
  teams: Team[] = [];
  selectedTeamId = '';
  loadingTeams = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { booking: Booking; isReassignment?: boolean },
    private dialogRef: MatDialogRef<TeamAssignModalComponent>
  ) {
    this.booking = data.booking;
    this.isReassignment = data.isReassignment ?? data.booking.teamId != null;
  }

  ngOnInit() {
    this.loadTeams();
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
      },
    });
  }

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      salon: 'Salon',
    };
    return labels[type] || type;
  }

  getCurrentTeamName(): string {
    if (!this.booking?.teamId) return 'N/A';
    const team = this.booking.teamId;
    return (team as any)?.name || 'N/A';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }

  confirm() {
    if (this.booking?._id && this.selectedTeamId) {
      if (this.isReassignment) {
        // For reassignment, only update team without changing status
        this.reassignTeam.emit({
          booking: this.booking,
          teamId: this.selectedTeamId,
        });
      } else {
        // For new assignment, assign team and confirm booking
        this.confirmAssign.emit({
          booking: this.booking,
          teamId: this.selectedTeamId,
        });
      }
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
