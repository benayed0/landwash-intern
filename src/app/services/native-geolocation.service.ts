import { Injectable } from '@angular/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Platform } from '@angular/cdk/platform';
import { HotToastService } from '@ngneat/hot-toast';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NativeGeolocationService {
  private watchId: string | null = null;
  private currentPosition$ = new BehaviorSubject<LocationCoordinates | null>(null);

  constructor(
    private platform: Platform,
    private toast: HotToastService
  ) {}

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<LocationCoordinates | null> {
    try {
      // Check permissions first
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        this.toast.error('Permission de localisation refusée');
        return null;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      const coords = this.formatCoordinates(position);
      this.currentPosition$.next(coords);
      return coords;
    } catch (error) {
      console.error('Error getting current position:', error);
      this.toast.error('Impossible de récupérer votre position');
      return null;
    }
  }

  /**
   * Watch position continuously (for team tracking)
   */
  async watchPosition(callback: (position: LocationCoordinates) => void): Promise<string | null> {
    try {
      // Check permissions first
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        this.toast.error('Permission de localisation refusée');
        return null;
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, error) => {
          if (error) {
            console.error('Error watching position:', error);
            return;
          }

          if (position) {
            const coords = this.formatCoordinates(position);
            this.currentPosition$.next(coords);
            callback(coords);
          }
        }
      );

      return this.watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      this.toast.error('Impossible de suivre votre position');
      return null;
    }
  }

  /**
   * Stop watching position
   */
  async clearWatch() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      console.log('Position watching stopped');
    }
  }

  /**
   * Get current position as observable
   */
  getCurrentPosition$(): Observable<LocationCoordinates | null> {
    return this.currentPosition$.asObservable();
  }

  /**
   * Check and request location permissions
   */
  async checkAndRequestPermissions(): Promise<boolean> {
    try {
      // Check current permissions
      const permission = await Geolocation.checkPermissions();

      if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
        return true;
      }

      // Request permissions if not granted
      const request = await Geolocation.requestPermissions();

      return request.location === 'granted' || request.coarseLocation === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Check permissions status
   */
  async checkPermissions(): Promise<PermissionStatus> {
    return await Geolocation.checkPermissions();
  }

  /**
   * Request permissions
   */
  async requestPermissions(): Promise<PermissionStatus> {
    return await Geolocation.requestPermissions();
  }

  /**
   * Format position to coordinates
   */
  private formatCoordinates(position: Position): LocationCoordinates {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
    };
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Open native maps app with directions
   */
  async openMapsWithDirections(latitude: number, longitude: number, label?: string) {
    const platform = this.platform.IOS ? 'ios' : 'android';
    let url = '';

    if (platform === 'ios') {
      // Apple Maps
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
      if (label) {
        url += `&q=${encodeURIComponent(label)}`;
      }
    } else {
      // Google Maps
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      if (label) {
        url += `&destination_place_id=${encodeURIComponent(label)}`;
      }
    }

    window.open(url, '_system');
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.platform.IOS || this.platform.ANDROID;
  }
}
