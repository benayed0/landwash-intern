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
    } catch (error) {
      console.error('🔔 Error removing FCM token:', error);
    }
  }
}
