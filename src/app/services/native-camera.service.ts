import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Platform } from '@angular/cdk/platform';
import { HotToastService } from '@ngneat/hot-toast';

export interface PhotoResult {
  dataUrl: string;
  format: string;
  saved: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NativeCameraService {
  constructor(
    private platform: Platform,
    private toast: HotToastService
  ) {}

  /**
   * Take a photo using the camera
   */
  async takePhoto(): Promise<PhotoResult | null> {
    try {
      const permissions = await Camera.checkPermissions();

      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['camera'] });
        if (request.camera !== 'granted') {
          this.toast.error('Permission d\'accès à la caméra refusée');
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true,
        width: 1920, // Max width for good quality
        height: 1920, // Max height
      });

      return this.processPhoto(photo);
    } catch (error: any) {
      if (error?.message !== 'User cancelled photos app') {
        console.error('Error taking photo:', error);
        this.toast.error('Erreur lors de la prise de photo');
      }
      return null;
    }
  }

  /**
   * Select a photo from gallery
   */
  async selectFromGallery(): Promise<PhotoResult | null> {
    try {
      const permissions = await Camera.checkPermissions();

      if (permissions.photos !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['photos'] });
        if (request.photos !== 'granted') {
          this.toast.error('Permission d\'accès aux photos refusée');
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true, // Allow cropping
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1920,
        height: 1920,
      });

      return this.processPhoto(photo);
    } catch (error: any) {
      if (error?.message !== 'User cancelled photos app') {
        console.error('Error selecting photo:', error);
        this.toast.error('Erreur lors de la sélection de la photo');
      }
      return null;
    }
  }

  /**
   * Show action sheet to choose between camera or gallery
   */
  async pickPhoto(): Promise<PhotoResult | null> {
    try {
      // Check permissions first
      const permissions = await Camera.checkPermissions();

      // Request permissions if needed
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Let user choose
        promptLabelHeader: 'Choisir une photo',
        promptLabelPhoto: 'Galerie',
        promptLabelPicture: 'Caméra',
        correctOrientation: true,
        width: 1920,
        height: 1920,
      });

      return this.processPhoto(photo);
    } catch (error: any) {
      if (error?.message !== 'User cancelled photos app') {
        console.error('Error picking photo:', error);
        this.toast.error('Erreur lors de la sélection de la photo');
      }
      return null;
    }
  }

  /**
   * Process and format photo data
   */
  private processPhoto(photo: Photo): PhotoResult {
    return {
      dataUrl: photo.dataUrl!,
      format: photo.format,
      saved: photo.saved || false,
    };
  }

  /**
   * Convert data URL to Blob for upload
   */
  dataUrlToBlob(dataUrl: string): Blob {
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
   * Convert data URL to File for upload
   */
  dataUrlToFile(dataUrl: string, fileName: string): File {
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
   * Request camera permissions
   */
  async requestPermissions() {
    try {
      const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
      return result;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return null;
    }
  }

  /**
   * Check camera permissions
   */
  async checkPermissions() {
    try {
      return await Camera.checkPermissions();
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return null;
    }
  }
}
