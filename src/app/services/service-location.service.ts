import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ServiceLocation,
  CreateServiceLocationDto,
  UpdateServiceLocationDto,
} from '../models/service-location.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceLocationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  constructor() {}

  // Create a new service location
  createLocation(
    locationData: CreateServiceLocationDto
  ): Observable<ServiceLocation> {
    return this.http.post<ServiceLocation>(
      `${this.apiUrl}/service-locations`,
      locationData
    );
  }

  // Get all service locations
  getAllLocations(isActive?: boolean): Observable<ServiceLocation[]> {
    const params: any = {};
    if (isActive !== undefined) {
      params.isActive = isActive.toString();
    }
    return this.http.get<ServiceLocation[]>(
      `${this.apiUrl}/service-locations`,
      { params }
    );
  }

  // Get nearby service locations
  getNearbyLocations(
    lng: number,
    lat: number,
    maxDistance?: number
  ): Observable<ServiceLocation[]> {
    const params: any = { lng: lng.toString(), lat: lat.toString() };
    if (maxDistance) {
      params.maxDistance = maxDistance.toString();
    }
    return this.http.get<ServiceLocation[]>(
      `${this.apiUrl}/service-locations/nearby`,
      { params }
    );
  }

  // Get location by ID
  getLocationById(id: string): Observable<ServiceLocation> {
    return this.http.get<ServiceLocation>(
      `${this.apiUrl}/service-locations/${id}`
    );
  }

  // Update a location
  updateLocation(
    id: string,
    locationData: UpdateServiceLocationDto
  ): Observable<ServiceLocation> {
    return this.http.patch<ServiceLocation>(
      `${this.apiUrl}/service-locations/${id}`,
      locationData
    );
  }

  // Delete a location
  deleteLocation(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/service-locations/${id}`
    );
  }
}
