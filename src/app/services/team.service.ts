import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from '../models/team.model';
import { Personal } from '../models/personal.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; // Update with your NestJS API URL

  getAllTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/teams`);
  }

  getTeamById(id: string): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/teams/${id}`);
  }

  getAllPersonals(): Observable<Personal[]> {
    return this.http.get<Personal[]>(`${this.apiUrl}/personals`);
  }

  createTeam(team: Partial<Team>): Observable<Team> {
    return this.http.post<Team>(`${this.apiUrl}/teams`, team);
  }

  updateTeam(id: string, team: Partial<Team>): Observable<Team> {
    return this.http.patch<Team>(`${this.apiUrl}/teams/${id}`, team);
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${id}`);
  }

  updatePersonal(id: string, personal: Partial<Personal>): Observable<Personal> {
    return this.http.patch<Personal>(`${this.apiUrl}/personals/${id}`, personal);
  }
}
