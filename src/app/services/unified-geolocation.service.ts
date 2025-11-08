import { Injectable, inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { NativeGeolocationService, LocationCoordinates } from './native-geolocation.service';
import { HotToastService } from '@ngneat/hot-toast';
import { Observable, from } from 'rxjs';

/**
 * Unified Geolocation Service
 *
 * Automatically uses native geolocation on mobile apps
 * and falls back to browser geolocation API on web
 */
@Injectable({
  providedIn: 'root',
})
export class UnifiedGeolocationService {
  private platform = inject(Platform);
  private nativeGeo = inject(NativeGeolocationService);
  private toast = inject(HotToastService);

  /**
   * Get current position - works on all platforms
   */
  async getCurrentPosition(): Promise<LocationCoordinates | null> {
    if (this.isNativePlatform()) {
      // Use native geolocation
      return await this.nativeGeo.getCurrentPosition();
    } else {
      // Use browser geolocation
      return await this.getWebPosition();
    }
  }

  /**
   * Watch position continuously
   * Returns watch ID that can be used to clear the watch
   */
  async watchPosition(
    callback: (position: LocationCoordinates) => void
  ): Promise<string | number | null> {
    if (this.isNativePlatform()) {
      // Use native watch
      return await this.nativeGeo.watchPosition(callback);
    } else {
      // Use browser watch
      return await this.watchWebPosition(callback);
    }
  }

  /**
   * Clear position watch
   */
  async clearWatch(watchId?: string | number | null) {
    if (!watchId) return;

    if (this.isNativePlatform()) {
      await this.nativeGeo.clearWatch();
    } else {
      if (typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
      }
    }
  }

  /**
   * Get current position as Observable
   */
  getCurrentPosition$(): Observable<LocationCoordinates | null> {
    return from(this.getCurrentPosition());
  }

  /**
   * Calculate distance between two points (works on all platforms)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    if (this.isNativePlatform()) {
      return this.nativeGeo.calculateDistance(lat1, lon1, lat2, lon2);
    }

    // Web implementation
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
   * Open maps with directions - works on all platforms
   */
  async openMapsWithDirections(
    latitude: number,
    longitude: number,
    label?: string
  ) {
    if (this.isNativePlatform()) {
      // Use native maps
      await this.nativeGeo.openMapsWithDirections(latitude, longitude, label);
    } else {
      // Open Google Maps in browser
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  }

  /**
   * Web geolocation implementation
   */
  private getWebPosition(): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        this.toast.error('La géolocalisation n\'est pas supportée');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          });
        },
        (error) => {
          console.error('Error getting position:', error);
          this.toast.error('Impossible de récupérer votre position');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Web watch position implementation
   */
  private watchWebPosition(
    callback: (position: LocationCoordinates) => void
  ): Promise<number | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        this.toast.error('La géolocalisation n\'est pas supportée');
        resolve(null);
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          });
        },
        (error) => {
          console.error('Error watching position:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      resolve(watchId);
    });
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.platform.IOS || this.platform.ANDROID;
  }

  /**
   * Get platform type
   */
  getPlatformType(): string {
    if (this.platform.IOS) return 'iOS';
    if (this.platform.ANDROID) return 'Android';
    return 'Web';
  }

  /**
   * Check if geolocation is available
   */
  isAvailable(): boolean {
    if (this.isNativePlatform()) {
      return true; // Always available on native
    }
    return 'geolocation' in navigator;
  }
}
