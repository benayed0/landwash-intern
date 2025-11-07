import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchLocations(query: string): Observable<LocationSearchResult[]> {
    if (!query || query.length < 3) {
      return of([]);
    }

    const params = {
      input: query,
      language: 'fr',
      components: 'country:tn', // Restrict to Tunisia
    };

    return this.http.get<any>(`${this.apiUrl}/places/autocomplete`, { params })
      .pipe(
        map(response => {
          if (response.status === 'OK' && response.predictions) {
            // Transform Google Places API response to match our interface
            return response.predictions.map((prediction: any) => ({
              place_id: prediction.place_id,
              display_name: prediction.description,
              lat: '', // Will be fetched when user selects
              lon: '', // Will be fetched when user selects
              type: prediction.types?.[0] || 'place',
              importance: 1,
              structured_formatting: prediction.structured_formatting
            }));
          }
          return [];
        }),
        catchError(error => {
          console.error('Error searching locations:', error);
          return of([]);
        })
      );
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    const params = {
      lat: lat.toString(),
      lng: lng.toString()
    };

    return this.http.get<{ address: string }>(`${this.apiUrl}/places/reverse-geocode`, { params })
      .pipe(
        map(result => result?.address || `${lat}, ${lng}`),
        catchError(error => {
          console.error('Error reverse geocoding:', error);
          return of(`${lat}, ${lng}`);
        })
      );
  }

  getPlaceDetails(placeId: string): Observable<{ lat: number; lng: number; address: string } | null> {
    const params = {
      place_id: placeId,
      fields: 'formatted_address,geometry'
    };

    return this.http.get<any>(`${this.apiUrl}/places/details`, { params })
      .pipe(
        map(response => {
          if (response.status === 'OK' && response.result) {
            const location = response.result.geometry.location;
            return {
              lat: location.lat,
              lng: location.lng,
              address: response.result.formatted_address
            };
          }
          return null;
        }),
        catchError(error => {
          console.error('Error getting place details:', error);
          return of(null);
        })
      );
  }
}