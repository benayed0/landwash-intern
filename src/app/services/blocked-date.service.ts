import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { BlockedDate, CreateBlockedDateDto } from '../models/blocked-date.model';

@Injectable({
  providedIn: 'root',
})
export class BlockedDateService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/blocked-dates';

  getAll(): Observable<BlockedDate[]> {
    return this.http.get<BlockedDate[]>(this.apiUrl);
  }

  create(dto: CreateBlockedDateDto): Observable<BlockedDate> {
    return this.http.post<BlockedDate>(this.apiUrl, dto);
  }

  update(id: string, dto: Partial<CreateBlockedDateDto>): Observable<BlockedDate> {
    return this.http.patch<BlockedDate>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
