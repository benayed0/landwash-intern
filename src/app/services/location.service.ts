import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface LocationSearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private http: HttpClient) {}

  searchLocations(query: string): Observable<LocationSearchResult[]> {
    if (!query || query.length < 3) {
      return of([]);
    }

    const params = {
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'tn', // Restrict to Tunisia
      'accept-language': 'fr,en'
    };

    return this.http.get<LocationSearchResult[]>(`${this.nominatimBaseUrl}/search`, { params })
      .pipe(
        map(results => results || []),
        catchError(error => {
          console.error('Error searching locations:', error);
          return of([]);
        })
      );
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    const params = {
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      'accept-language': 'fr,en'
    };

    return this.http.get<any>(`${this.nominatimBaseUrl}/reverse`, { params })
      .pipe(
        map(result => result?.display_name || `${lat}, ${lng}`),
        catchError(error => {
          console.error('Error reverse geocoding:', error);
          return of(`${lat}, ${lng}`);
        })
      );
  }
}