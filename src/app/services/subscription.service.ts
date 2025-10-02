import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription } from '../models/subscription.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/subscriptions';

  getAllSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.apiUrl);
  }

  updateSubscription(id: string, updateData: Partial<Subscription>): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/update/${id}`, updateData);
  }

  deleteSubscription(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateSubscriptionStatus(id: string, status: string): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/update/${id}`, { status });
  }
}