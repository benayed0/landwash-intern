import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';
import { CreatePersonalDto, Personal } from '../../models/personal.model';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { BottomBarComponent } from '../shared/bottom-bar/bottom-bar.component';
import { AddPersonalModalComponent } from '../add-personal-modal/add-personal-modal.component';
import { PersonalService } from '../../services/personal.service';
import { HotToastService } from '@ngneat/hot-toast';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    BottomBarComponent,
    AddPersonalModalComponent,
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
  loading = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
      },
      error: (err) => {
        console.error('Error loading teams:', err);
      },
    });

    this.teamService.getAllPersonals().subscribe({
      next: (personals) => {
        this.personals = personals;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading personals:', err);
        this.loading = false;
      },
    });
  }

  getMemberDetails(memberId: string): Personal | undefined {
    return this.personals.find((p) => p._id === memberId);
  }
  createdAccount(data: Personal) {
    this.personals.push(data);
    this.showAddPersonalModal = false;
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
