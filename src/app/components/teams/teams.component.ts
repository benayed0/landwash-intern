import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';
import { CreatePersonalDto, Personal } from '../../models/personal.model';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { BottomBarComponent } from '../shared/bottom-bar/bottom-bar.component';
import { AddPersonalModalComponent } from '../add-personal-modal/add-personal-modal.component';
import { CreateTeamModalComponent } from '../create-team-modal/create-team-modal.component';
import { EditTeamModalComponent } from '../edit-team-modal/edit-team-modal.component';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';
import { PersonalService } from '../../services/personal.service';
import { HotToastService } from '@ngneat/hot-toast';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    BottomBarComponent,
    AddPersonalModalComponent,
    CreateTeamModalComponent,
    EditTeamModalComponent,
    DeleteConfirmModalComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css',
})
export class TeamsComponent implements OnInit {
  private teamService = inject(TeamService);
  private personalService = inject(PersonalService);
  private toast = inject(HotToastService);
  teams: Team[] = [];
  personals: Personal[] = [];
  showAddPersonalModal = false;
  showCreateTeamModal = false;
  showEditTeamModal = false;
  showDeleteConfirmModal = false;
  selectedTeam: Team | null = null;
  isDeleting = false;
  loading = false;

  // Search functionality
  searchTerm = '';
  filteredTeams: Team[] = [];
  filteredPersonals: Personal[] = [];

  // Pagination
  currentTeamPage = 1;
  currentPersonalPage = 1;
  itemsPerPage = 6;
  paginatedTeams: Team[] = [];
  paginatedPersonals: Personal[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.updateFilteredLists();
      },
      error: (err) => {
        console.error('Error loading teams:', err);
      },
    });

    this.teamService.getAllPersonals().subscribe({
      next: (personals) => {
        this.personals = personals;
        this.updateFilteredLists();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading personals:', err);
        this.loading = false;
      },
    });
  }

  updateFilteredLists() {
    if (!this.searchTerm.trim()) {
      this.filteredTeams = this.teams;
      this.filteredPersonals = this.personals;
    } else {
      const searchLower = this.searchTerm.toLowerCase();

      this.filteredTeams = this.teams.filter(team =>
        team.name.toLowerCase().includes(searchLower) ||
        team.members.some(memberId => {
          const member = this.getMemberDetails(memberId);
          return member?.name.toLowerCase().includes(searchLower) ||
                 member?.email.toLowerCase().includes(searchLower);
        })
      );

      this.filteredPersonals = this.personals.filter(personal =>
        personal.name.toLowerCase().includes(searchLower) ||
        personal.email.toLowerCase().includes(searchLower) ||
        personal.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Reset pagination when search changes
    this.currentTeamPage = 1;
    this.currentPersonalPage = 1;
    this.updatePaginatedLists();
  }

  updatePaginatedLists() {
    // Teams pagination
    const teamStart = (this.currentTeamPage - 1) * this.itemsPerPage;
    const teamEnd = teamStart + this.itemsPerPage;
    this.paginatedTeams = this.filteredTeams.slice(teamStart, teamEnd);

    // Personals pagination
    const personalStart = (this.currentPersonalPage - 1) * this.itemsPerPage;
    const personalEnd = personalStart + this.itemsPerPage;
    this.paginatedPersonals = this.filteredPersonals.slice(personalStart, personalEnd);
  }

  // Pagination methods
  get totalTeamPages(): number {
    return Math.ceil(this.filteredTeams.length / this.itemsPerPage);
  }

  get totalPersonalPages(): number {
    return Math.ceil(this.filteredPersonals.length / this.itemsPerPage);
  }

  onTeamPageChange(page: number) {
    this.currentTeamPage = page;
    this.updatePaginatedLists();
  }

  onPersonalPageChange(page: number) {
    this.currentPersonalPage = page;
    this.updatePaginatedLists();
  }

  getTeamPageNumbers(): number[] {
    return Array.from({ length: this.totalTeamPages }, (_, i) => i + 1);
  }

  getPersonalPageNumbers(): number[] {
    return Array.from({ length: this.totalPersonalPages }, (_, i) => i + 1);
  }

  onSearchChange() {
    this.updateFilteredLists();
  }

  clearSearch() {
    this.searchTerm = '';
    this.updateFilteredLists();
  }

  getMemberDetails(memberId: string): Personal | undefined {
    return this.personals.find((p) => p._id === memberId);
  }
  createdAccount(data: Personal) {
    this.personals.push(data);
    this.showAddPersonalModal = false;
  }

  teamCreated(data: Team) {
    this.teams.push(data);
    this.updateFilteredLists();
    this.showCreateTeamModal = false;
  }

  openEditTeam(team: Team) {
    this.selectedTeam = team;
    this.showEditTeamModal = true;
  }

  teamUpdated(updatedTeam: Team) {
    const index = this.teams.findIndex(t => t._id === updatedTeam._id);
    if (index !== -1) {
      this.teams[index] = updatedTeam;
    }
    this.updateFilteredLists();
    this.showEditTeamModal = false;
    this.selectedTeam = null;
  }

  openDeleteConfirm(team: Team) {
    this.selectedTeam = team;
    this.showDeleteConfirmModal = true;
  }

  confirmDelete() {
    if (!this.selectedTeam?._id) return;

    this.isDeleting = true;
    this.teamService.deleteTeam(this.selectedTeam._id).subscribe({
      next: () => {
        this.teams = this.teams.filter(t => t._id !== this.selectedTeam?._id);
        this.updateFilteredLists();
        this.toast.success('Équipe supprimée avec succès!');
        this.closeDeleteConfirm();
      },
      error: (err) => {
        console.error('Error deleting team:', err);
        this.toast.error('Erreur lors de la suppression de l\'équipe');
        this.isDeleting = false;
      }
    });
  }

  closeDeleteConfirm() {
    this.showDeleteConfirmModal = false;
    this.selectedTeam = null;
    this.isDeleting = false;
  }
  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
