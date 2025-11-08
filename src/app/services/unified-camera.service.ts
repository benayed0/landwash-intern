import { Injectable, inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { NativeCameraService, PhotoResult } from './native-camera.service';
import { HotToastService } from '@ngneat/hot-toast';

/**
 * Unified Camera Service
 *
 * Automatically uses native camera on mobile apps
 * and falls back to file input on web
 */
@Injectable({
  providedIn: 'root',
})
export class UnifiedCameraService {
  private platform = inject(Platform);
  private nativeCamera = inject(NativeCameraService);
  private toast = inject(HotToastService);

  /**
   * Pick a photo - automatically uses best method for platform
   */
  async pickPhoto(): Promise<PhotoResult | null> {
    if (this.isNativePlatform()) {
      // Use native camera on mobile
      return await this.nativeCamera.pickPhoto();
    } else {
      // Use web file input
      return await this.pickPhotoFromWeb();
    }
  }

  /**
   * Take photo from camera (native only, falls back to file input on web)
   */
  async takePhoto(): Promise<PhotoResult | null> {
    if (this.isNativePlatform()) {
      return await this.nativeCamera.takePhoto();
    } else {
      // On web, fall back to file input (can't force camera)
      this.toast.info('Sélectionnez une photo');
      return await this.pickPhotoFromWeb();
    }
  }

  /**
   * Select from gallery
   */
  async selectFromGallery(): Promise<PhotoResult | null> {
    if (this.isNativePlatform()) {
      return await this.nativeCamera.selectFromGallery();
    } else {
      return await this.pickPhotoFromWeb();
    }
  }

  /**
   * Web fallback - use file input
   */
  private pickPhotoFromWeb(): Promise<PhotoResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          try {
            const dataUrl = await this.fileToDataUrl(file);
            resolve({
              dataUrl,
              format: file.type.split('/')[1] || 'jpeg',
              saved: false,
            });
          } catch (error) {
            console.error('Error reading file:', error);
            this.toast.error('Erreur lors de la lecture du fichier');
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }

  /**
   * Convert File to Data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert data URL to Blob (works on all platforms)
   */
  dataUrlToBlob(dataUrl: string): Blob {
    if (this.isNativePlatform()) {
      return this.nativeCamera.dataUrlToBlob(dataUrl);
    }

    // Web implementation
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  /**
   * Convert data URL to File (works on all platforms)
   */
  dataUrlToFile(dataUrl: string, fileName: string): File {
    if (this.isNativePlatform()) {
      return this.nativeCamera.dataUrlToFile(dataUrl, fileName);
    }

    const blob = this.dataUrlToBlob(dataUrl);
    return new File([blob], fileName, { type: blob.type });
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
}
