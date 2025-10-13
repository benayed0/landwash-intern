import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../models/team.model';
import { Personal } from '../../../models/personal.model';
import { AddPersonalModalComponent } from '../add-personal-modal/add-personal-modal.component';
import { CreateTeamModalComponent } from '../create-team-modal/create-team-modal.component';
import { EditTeamModalComponent } from '../edit-team-modal/edit-team-modal.component';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';
import { HotToastService } from '@ngneat/hot-toast';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css',
})
export class TeamsComponent implements OnInit {
  private teamService = inject(TeamService);
  private toast = inject(HotToastService);
  private dialog = inject(MatDialog);

  teams: Team[] = [];
  personals: Personal[] = [];
  selectedTeam: Team | null = null;
  isDeleting = false;
  loading = false;
  isDialogOpen = false;

  // Tab functionality
  activeTab: 'teams' | 'personnel' = 'teams';

  // Search functionality
  searchTerm = '';
  filteredTeams: Team[] = [];
  filteredPersonals: Personal[] = [];

  // Sort and filter options for teams
  teamSortBy: 'name' | 'members' | 'date' = 'name';
  teamSortOrder: 'asc' | 'desc' = 'asc';
  showTeamSortMenu = false;
  showTeamFilterPanel = false;

  // Sort and filter options for personnel
  personalSortBy: 'name' | 'role' | 'date' = 'name';
  personalSortOrder: 'asc' | 'desc' = 'asc';
  showPersonalSortMenu = false;
  showPersonalFilterPanel = false;

  // Advanced filters for personnel
  roleFilters = {
    admin: false,
    worker: false,
  };

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
    // Filter teams
    let filteredTeams = [...this.teams];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredTeams = filteredTeams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchLower) ||
          team.members?.some((memberId) => {
            const member = this.getMemberDetails(memberId as string);
            return (
              member?.name.toLowerCase().includes(searchLower) ||
              member?.email.toLowerCase().includes(searchLower)
            );
          })
      );
    }

    // Sort teams
    this.filteredTeams = this.sortTeams(filteredTeams);

    // Filter personals
    let filteredPersonals = [...this.personals];

    // Apply role filters
    const activeRoleFilters = Object.entries(this.roleFilters)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    if (activeRoleFilters.length > 0) {
      filteredPersonals = filteredPersonals.filter((personal) => {
        if (activeRoleFilters.includes('admin') && personal.role === 'admin')
          return true;
        if (activeRoleFilters.includes('worker') && personal.role === 'worker')
          return true;
        return false;
      });
    }

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredPersonals = filteredPersonals.filter(
        (personal) =>
          personal.name.toLowerCase().includes(searchLower) ||
          personal.email.toLowerCase().includes(searchLower) ||
          personal.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Sort personals
    this.filteredPersonals = this.sortPersonals(filteredPersonals);

    // Reset pagination when search changes
    this.currentTeamPage = 1;
    this.currentPersonalPage = 1;
    this.updatePaginatedLists();
  }

  sortTeams(teams: Team[]): Team[] {
    return teams.sort((a, b) => {
      let compareValue = 0;

      switch (this.teamSortBy) {
        case 'name':
          compareValue = a.name
            .toLowerCase()
            .localeCompare(b.name.toLowerCase());
          break;
        case 'members':
          compareValue = (a.members?.length || 0) - (b.members?.length || 0);
          break;
        case 'date':
          // Assuming teams have a creation date, otherwise use name
          compareValue = a.name
            .toLowerCase()
            .localeCompare(b.name.toLowerCase());
          break;
      }

      return this.teamSortOrder === 'asc' ? compareValue : -compareValue;
    });
  }

  sortPersonals(personals: Personal[]): Personal[] {
    return personals.sort((a, b) => {
      let compareValue = 0;

      switch (this.personalSortBy) {
        case 'name':
          compareValue = a.name
            .toLowerCase()
            .localeCompare(b.name.toLowerCase());
          break;
        case 'role':
          const roleA = a.role || '';
          const roleB = b.role || '';
          compareValue = roleA.localeCompare(roleB);
          break;
        case 'date':
          // Assuming personals have a creation date, otherwise use name
          compareValue = a.name
            .toLowerCase()
            .localeCompare(b.name.toLowerCase());
          break;
      }

      return this.personalSortOrder === 'asc' ? compareValue : -compareValue;
    });
  }

  updatePaginatedLists() {
    // Teams pagination
    const teamStart = (this.currentTeamPage - 1) * this.itemsPerPage;
    const teamEnd = teamStart + this.itemsPerPage;
    this.paginatedTeams = this.filteredTeams.slice(teamStart, teamEnd);

    // Personals pagination
    const personalStart = (this.currentPersonalPage - 1) * this.itemsPerPage;
    const personalEnd = personalStart + this.itemsPerPage;
    this.paginatedPersonals = this.filteredPersonals.slice(
      personalStart,
      personalEnd
    );
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

  switchTab(tab: 'teams' | 'personnel') {
    this.activeTab = tab;
    // Close any open menus when switching tabs
    this.showTeamSortMenu = false;
    this.showTeamFilterPanel = false;
    this.showPersonalSortMenu = false;
    this.showPersonalFilterPanel = false;
  }

  // Team sort and filter methods
  setTeamSortBy(sortBy: 'name' | 'members' | 'date'): void {
    if (this.teamSortBy === sortBy) {
      this.teamSortOrder = this.teamSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.teamSortBy = sortBy;
      this.teamSortOrder = 'asc';
    }
    this.showTeamSortMenu = false;
    this.updateFilteredLists();
  }

  toggleTeamSortMenu(): void {
    this.showTeamSortMenu = !this.showTeamSortMenu;
    if (this.showTeamSortMenu) {
      this.showTeamFilterPanel = false;
    }
  }

  toggleTeamFilterPanel(): void {
    this.showTeamFilterPanel = !this.showTeamFilterPanel;
    if (this.showTeamFilterPanel) {
      this.showTeamSortMenu = false;
    }
  }

  // Personal sort and filter methods
  setPersonalSortBy(sortBy: 'name' | 'role' | 'date'): void {
    if (this.personalSortBy === sortBy) {
      this.personalSortOrder =
        this.personalSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.personalSortBy = sortBy;
      this.personalSortOrder = 'asc';
    }
    this.showPersonalSortMenu = false;
    this.updateFilteredLists();
  }

  togglePersonalSortMenu(): void {
    this.showPersonalSortMenu = !this.showPersonalSortMenu;
    if (this.showPersonalSortMenu) {
      this.showPersonalFilterPanel = false;
    }
  }

  togglePersonalFilterPanel(): void {
    this.showPersonalFilterPanel = !this.showPersonalFilterPanel;
    if (this.showPersonalFilterPanel) {
      this.showPersonalSortMenu = false;
    }
  }

  toggleRoleFilter(role: keyof typeof this.roleFilters): void {
    this.roleFilters[role] = !this.roleFilters[role];
    this.updateFilteredLists();
  }

  clearPersonalFilters(): void {
    this.roleFilters = {
      admin: false,
      worker: false,
    };
    this.updateFilteredLists();
  }

  getActiveRoleFiltersCount(): number {
    return Object.values(this.roleFilters).filter((v) => v).length;
  }

  getChiefInfo(team: Team): Personal {
    return this.personals.find((p) => p._id === (team.chiefId as string))!;
  }
  getMemberDetails(memberId: string | Personal): Personal | undefined {
    if (typeof memberId === 'string') {
      return this.personals.find((p) => p._id === memberId);
    } else {
      return memberId; // If it's already a Personal object
    }
  }

  // Helper method to get iterable members for the template
  getIterableMembers(
    members: string[] | Personal[] | undefined
  ): (string | Personal)[] {
    return members || [];
  }
  openAddPersonalModal() {
    const dialogRef = this.dialog.open(AddPersonalModalComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.componentInstance.confirmAdd.subscribe((data: Personal) => {
      this.personals.push(data);
      this.updateFilteredLists();
      dialogRef.close();
    });
  }

  openCreateTeamModal() {
    const dialogRef = this.dialog.open(CreateTeamModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
    });

    dialogRef.componentInstance.availablePersonals = this.personals;

    dialogRef.componentInstance.teamCreated.subscribe((data: Team) => {
      this.teams.push(data);
      this.updateFilteredLists();
      dialogRef.close();
    });
  }

  openEditTeam(team: Team) {
    // Prevent multiple dialogs from opening (Chrome fix)
    if (this.isDialogOpen) {
      console.log('Dialog already open, ignoring click');
      return;
    }

    try {
      this.isDialogOpen = true;
      this.selectedTeam = team;
      console.log('Opening edit dialog for team:', team);

      const dialogRef = this.dialog.open(EditTeamModalComponent, {
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        disableClose: false,
        hasBackdrop: true,
        data: {
          team: team,
          availablePersonals: this.personals,
        },
      });
      console.log('Dialog ref created:', dialogRef);

      // Subscribe to the teamUpdated event
      const subscription = dialogRef.componentInstance.teamUpdated.subscribe(
        (updatedTeam: Team) => {
          console.log('Team updated:', updatedTeam);
          const index = this.teams.findIndex((t) => t._id === updatedTeam._id);
          if (index !== -1) {
            this.teams[index] = updatedTeam;
          }
          this.updateFilteredLists();
          this.selectedTeam = null;
        }
      );

      // Clean up subscription when dialog closes
      dialogRef.afterClosed().subscribe(() => {
        subscription.unsubscribe();
        this.selectedTeam = null;
        this.isDialogOpen = false;
        console.log('Edit dialog closed and cleaned up');
      });
    } catch (error) {
      console.error('Error opening edit dialog:', error);
      this.toast.error("Erreur lors de l'ouverture du dialogue");
      this.isDialogOpen = false;
    }
  }

  openDeleteConfirm(team: Team) {
    this.selectedTeam = team;
    const dialogRef = this.dialog.open(DeleteConfirmModalComponent, {
      width: '500px',
      disableClose: false,
    });

    dialogRef.componentInstance.teamName = team.name || '';

    dialogRef.componentInstance.confirm.subscribe(() => {
      this.confirmDelete();
      dialogRef.close();
    });
  }

  confirmDelete() {
    if (!this.selectedTeam?._id) return;

    this.isDeleting = true;
    this.teamService.deleteTeam(this.selectedTeam._id).subscribe({
      next: () => {
        this.teams = this.teams.filter((t) => t._id !== this.selectedTeam?._id);
        this.updateFilteredLists();
        this.toast.success('Équipe supprimée avec succès!');
        this.closeDeleteConfirm();
      },
      error: (err) => {
        console.error('Error deleting team:', err);
        this.toast.error("Erreur lors de la suppression de l'équipe");
        this.isDeleting = false;
      },
    });
  }

  closeDeleteConfirm() {
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
