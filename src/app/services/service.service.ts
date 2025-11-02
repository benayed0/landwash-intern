import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Service, UpdateServiceDto } from '../models/service.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  constructor() {}

  // Get all services
  getAllServices(type?: string): Observable<Service[]> {
    if (type) {
      return this.http.get<Service[]>(`${this.apiUrl}/services`, {
        params: { type },
      });
    }
    return this.http.get<Service[]>(`${this.apiUrl}/services`);
  }

  // Get services by type
  getServicesByType(type: string): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services/type/${type}`);
  }

  // Get nearby services
  getNearbyServices(
    lng: number,
    lat: number,
    maxDistance?: number
  ): Observable<Service[]> {
    const params: any = { lng: lng.toString(), lat: lat.toString() };
    if (maxDistance) {
      params.maxDistance = maxDistance.toString();
    }
    return this.http.get<Service[]>(`${this.apiUrl}/services/nearby`, {
      params,
    });
  }

  // Get service by ID
  getServiceById(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/services/${id}`);
  }

  // Update a service
  updateService(
    id: string,
    serviceData: UpdateServiceDto
  ): Observable<Service> {
    return this.http.patch<Service>(
      `${this.apiUrl}/services/${id}`,
      serviceData
    );
  }

  // Delete a service
  deleteService(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/services/${id}`
    );
  }
}
