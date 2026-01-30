import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getAvailableTeams(
    lat: number,
    lng: number,
    date: string,
  ): Observable<{ teams: Team[]; total: number }> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('date', date);
    return this.http.get<{ teams: Team[]; total: number }>(
      `${this.apiUrl}/teams/available`,
      { params },
    );
  }

  getTeamById(id: string): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/teams/${id}`);
  }

  getAllPersonals(): Observable<Personal[]> {
    return this.http.get<Personal[]>(`${this.apiUrl}/personals`);
  }

  createTeam(team: Partial<Team>, locationIds?: string[]): Observable<Team> {
    let params = new HttpParams();
    if (locationIds && locationIds.length > 0) {
      params = params.set('locationIds', locationIds.join(','));
    }
    return this.http.post<Team>(`${this.apiUrl}/teams`, team, { params });
  }

  updateTeam(id: string, team: Partial<Team>, locationIds?: string[]): Observable<Team> {
    let params = new HttpParams();
    if (locationIds !== undefined) {
      params = params.set('locationIds', locationIds.join(','));
    }
    return this.http.patch<Team>(`${this.apiUrl}/teams/${id}`, team, { params });
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${id}`);
  }

  updatePersonal(id: string, personal: Partial<Personal>): Observable<Personal> {
    return this.http.patch<Personal>(`${this.apiUrl}/personals/${id}`, personal);
  }
}
