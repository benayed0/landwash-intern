import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreatePersonalDto, Personal } from '../models/personal.model';
import { environment } from '../../environments/environment';

export interface UpdatePersonalDto {
  name?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; // Update with your NestJS API URL

  // Create a new personal
  createPersonal(
    personalData: CreatePersonalDto
  ): Observable<{ success: boolean; message: string; personal?: Personal }> {
    return this.http.post<{
      success: boolean;
      message: string;
      personal?: Personal;
    }>(`${this.apiUrl}/personals`, personalData);
  }

  // Update personal profile
  updatePersonal(id: string, updates: UpdatePersonalDto): Observable<Personal> {
    return this.http.patch<Personal>(`${this.apiUrl}/personals/${id}`, updates);
  }

  // Get all personals (admin only)
  getAllPersonals(): Observable<Personal[]> {
    return this.http.get<Personal[]>(`${this.apiUrl}/personals`);
  }

  // Get personal by ID
  getPersonalById(id: string): Observable<Personal> {
    return this.http.get<Personal>(`${this.apiUrl}/personals/${id}`);
  }

  // Delete personal (admin only)
  deletePersonal(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/personals/${id}`);
  }

  // Update personal status
  updatePersonalStatus(
    id: string,
    status: 'active' | 'inactive'
  ): Observable<Personal> {
    return this.http.patch<Personal>(`${this.apiUrl}/personals/${id}`, {
      status,
    });
  }
}
