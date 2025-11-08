import { Injectable, inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { NativePushNotificationService } from './native-push-notification.service';
import { PushNotificationService } from './push-notification.service';

/**
 * Unified Notification Service
 *
 * Automatically uses native push notifications on mobile apps
 * and falls back to PWA push notifications on web
 */
@Injectable({
  providedIn: 'root',
})
export class UnifiedNotificationService {
  private platform = inject(Platform);
  private nativePush = inject(NativePushNotificationService);
  private webPush = inject(PushNotificationService);

  /**
   * Initialize the appropriate push notification service
   */
  async initialize() {
    if (this.isNativePlatform()) {
      console.log('📱 Using native push notifications');
      await this.nativePush.initialize();
    } else {
      console.log('🌐 Using web push notifications');
      await this.webPush.subscribeToNotifications();
      this.webPush.listenForMessages();
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    if (this.isNativePlatform()) {
      const result = await this.nativePush.checkPermissions();
      return result.receive === 'granted';
    } else {
      const permission = await this.webPush.requestPermission();
      return permission === 'granted';
    }
  }

  /**
   * Check if running on native platform
   */
  private isNativePlatform(): boolean {
    return this.platform.IOS || this.platform.ANDROID;
  }

  /**
   * Get platform type for debugging
   */
  getPlatformType(): string {
    if (this.platform.IOS) return 'iOS';
    if (this.platform.ANDROID) return 'Android';
    return 'Web';
  }
}
