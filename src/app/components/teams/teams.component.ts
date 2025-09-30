import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';
import { Personal } from '../../models/personal.model';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { BottomBarComponent } from '../shared/bottom-bar/bottom-bar.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, BottomBarComponent],
  templateUrl: './teams.component.html',
  styles: `
    .teams-container {
      min-height: 100vh;
      background: #0a0a0a;
      padding-bottom: 80px;
    }

    .page-header {
      background: #1a1a1a;
      padding: 20px;
      color: white;
      text-align: center;
      border-bottom: 1px solid rgba(195, 255, 0, 0.2);
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #c3ff00;
    }

    .content {
      padding: 20px;
    }

    .section-title {
      color: white;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .team-card {
      background: #1a1a1a;
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 15px;
      color: #e5e5e5;
      border: 1px solid #2a2a2a;
    }

    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .team-name {
      font-size: 18px;
      font-weight: 600;
    }

    .team-badge {
      background: #c3ff00;
      color: #0a0a0a;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .member-list {
      margin-top: 10px;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #333;
    }

    .member-item:last-child {
      border-bottom: none;
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      background: #444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #c3ff00;
    }

    .member-info {
      flex: 1;
    }

    .member-name {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .member-contact {
      font-size: 12px;
      color: #999;
    }

    .member-role {
      background: #444;
      color: #aaa;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
    }

    .personals-section {
      margin-top: 30px;
    }

    .personal-card {
      background: #1a1a1a;
      border-radius: 15px;
      padding: 15px;
      margin-bottom: 10px;
      color: #e5e5e5;
      display: flex;
      align-items: center;
      gap: 15px;
      border: 1px solid #2a2a2a;
    }

    .personal-avatar {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #c3ff00, #8bc34a);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #0a0a0a;
      font-size: 20px;
    }

    .personal-info {
      flex: 1;
    }

    .personal-name {
      font-weight: 600;
      margin-bottom: 5px;
    }

    .personal-details {
      font-size: 12px;
      color: #999;
    }

    .personal-role {
      background: #c3ff00;
      color: #0a0a0a;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }


    @media (max-width: 480px) {
      .team-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .content {
        padding: 15px;
      }

      .page-header h1 {
        font-size: 20px;
      }
    }
  `
})
export class TeamsComponent implements OnInit {
  private teamService = inject(TeamService);

  teams: Team[] = [];
  personals: Personal[] = [];
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
      }
    });

    this.teamService.getAllPersonals().subscribe({
      next: (personals) => {
        this.personals = personals;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading personals:', err);
        this.loading = false;
      }
    });
  }

  getMemberDetails(memberId: string): Personal | undefined {
    return this.personals.find(p => p._id === memberId);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}