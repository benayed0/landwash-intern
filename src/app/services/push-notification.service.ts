import { Injectable, inject } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { ForegroundNotificationService } from './foreground-notification.service';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private foregroundNotificationService = inject(ForegroundNotificationService);
  private apiUrl = environment.apiUrl;
  private isInitialized = false;

  async init() {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('🔔 Push notifications already initialized');
      return;
    }

    // Only request permissions on native platforms (iOS/Android)
    if (Capacitor.getPlatform() === 'web') {
      console.log('🔔 Push notifications not available on web platform');
      return;
    }

    try {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== 'granted') {
        console.log('🔔 Push notification permission denied');
        return;
      }

      await PushNotifications.register();

      // Remove all existing listeners before adding new ones
      await PushNotifications.removeAllListeners();

      PushNotifications.addListener('registration', async (token) => {
        console.log('🔔 FCM token:', token.value);

        // Store token in localStorage for later reference
        localStorage.setItem('fcm_token', token.value);

        // Check if user is logged in and sync token
        if (this.authService.isLoggedIn()) {
          await this.syncFcmToken(token.value);
        }
      });

      PushNotifications.addListener('pushNotificationReceived', (n) => {
        // Show custom foreground notification
        this.foregroundNotificationService.show({
          title: n.title || 'New Notification',
          body: n.body || '',
          data: n.data,
          image: n.data?.image,
        });
      });

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          console.log('🔔 Notification tapped:', action);
        }
      );

      // Mark as initialized
      this.isInitialized = true;
      console.log('🔔 Push notifications initialized successfully');
    } catch (error) {
      console.error('🔔 Error initializing push notifications:', error);
    }
  }

  /**
   * Syncs the FCM token with the backend
   * Checks if the token exists in user's fcmTokens array, adds it if not present
   */
  private async syncFcmToken(fcmToken: string): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        console.log('🔔 No user found, skipping FCM token sync');
        return;
      }

      // Check if the token already exists in user's fcmTokens
      const existingTokens = user.fcmTokens || [];
      if (existingTokens.includes(fcmToken)) {
        console.log('🔔 FCM token already registered for this user');
        return;
      }

      // Add the token to the user's fcmTokens array
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/personals/${user._id}/fcm-token`, {
          fcmToken,
        })
      );

      console.log('🔔 FCM token successfully synced with backend');

      // Refresh user data to update local cache
      await firstValueFrom(this.authService.forceRefreshUserData());
    } catch (error) {
      console.error('🔔 Error syncing FCM token:', error);
    }
  }

  /**
   * Call this method when user logs in to sync the current FCM token
   */
  async syncTokenOnLogin(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    try {
      // The token will be synced via the 'registration' listener
      // So we just ensure registration is active
      await PushNotifications.register();
    } catch (error) {
      console.error('🔔 Error syncing token on login:', error);
    }
  }

  /**
   * Remove FCM token from user's account (e.g., on logout)
   */
  async removeFcmToken(fcmToken: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        console.log('🔔 No user found, skipping FCM token removal');
        return;
      }

      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/personals/${user._id}/fcm-token`, {
          body: { fcmToken },
        })
      );
      console.log('🔔 FCM token removed from backend');

      // Refresh user data to update local cache
      await firstValueFrom(this.authService.forceRefreshUserData());
    } catch (error) {
      console.error('🔔 Error removing FCM token:', error);
    }
  }

  /**
   * Get the current FCM token for this device
   */
  async getCurrentToken(): Promise<string | null> {
    if (Capacitor.getPlatform() === 'web') {
      return null;
    }

    try {
      // Check if we have permission
      const permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== 'granted') {
        return null;
      }

      // Get delivered notifications to extract token (workaround)
      // Note: There's no direct API to get the current token,
      // so we'll store it when registration happens
      const storedToken = localStorage.getItem('fcm_token');
      return storedToken;
    } catch (error) {
      console.error('🔔 Error getting current token:', error);
      return null;
    }
  }

  /**
   * Disable notifications by removing the current device's FCM token
   */
  async disableNotifications(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    try {
      const token = await this.getCurrentToken();
      if (token) {
        await this.removeFcmToken(token);
        localStorage.removeItem('fcm_token');
        console.log('🔔 Notifications disabled for this device');
      }
    } catch (error) {
      console.error('🔔 Error disabling notifications:', error);
      throw error;
    }
  }

  /**
   * Enable notifications by re-registering the device
   */
  async enableNotifications(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    try {
      const permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== 'granted') {
        // Request permissions again
        const newPermStatus = await PushNotifications.requestPermissions();
        if (newPermStatus.receive !== 'granted') {
          throw new Error('Permission denied');
        }
      }

      // Create a promise that resolves when token is registered and synced
      const tokenSyncPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Token registration timeout'));
        }, 10000); // 10 second timeout

        // Add a one-time listener for registration
        PushNotifications.addListener('registration', async (token) => {
          clearTimeout(timeout);
          console.log('🔔 FCM token received for enabling:', token.value);

          // Store token in localStorage
          localStorage.setItem('fcm_token', token.value);

          // Sync token with backend if user is logged in
          if (this.authService.isLoggedIn()) {
            try {
              await this.syncFcmToken(token.value);
              console.log('🔔 Token synced successfully');
              resolve();
            } catch (error) {
              console.error('🔔 Error syncing token:', error);
              reject(error);
            }
          } else {
            resolve();
          }
        });
      });

      // Re-register to get a new token
      await PushNotifications.register();

      // Wait for token to be received and synced
      await tokenSyncPromise;

      console.log('🔔 Notifications enabled for this device');
    } catch (error) {
      console.error('🔔 Error enabling notifications:', error);
      throw error;
    }
  }

  /**
   * Check if notifications are enabled for this device
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return false;
    }

    try {
      const token = await this.getCurrentToken();
      if (!token) {
        return false;
      }

      const user = this.authService.getCurrentUser();
      if (!user) {
        return false;
      }

      // Check if token exists in user's fcmTokens
      const existingTokens = user.fcmTokens || [];
      return existingTokens.includes(token);
    } catch (error) {
      console.error('🔔 Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Check if running on mobile platform
   */
  isMobilePlatform(): boolean {
    return Capacitor.getPlatform() !== 'web';
  }
}
