import { Injectable } from '@angular/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@angular/cdk/platform';
import { environment } from '../../environments/environment';
import { HotToastService } from '@ngneat/hot-toast';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NativePushNotificationService {
  private readonly SERVER_URL = environment.apiUrl + '/notifications';

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private toast: HotToastService,
    private router: Router
  ) {}

  /**
   * Initialize native push notifications
   * Call this when app starts
   */
  async initialize() {
    // Only run on native platforms
    if (!this.isNativePlatform()) {
      console.log('Not a native platform, skipping native push notifications');
      return;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();

      if (permission.receive === 'granted') {
        // Register with Apple / Google to receive push notifications
        await PushNotifications.register();
        console.log('Push notifications registered successfully');
      } else {
        console.log('Push notification permission denied');
      }

      // Set up listeners
      this.setupListeners();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Set up event listeners for push notifications
   */
  private setupListeners() {
    // On registration success, save the token
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.saveTokenToServer(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // When a notification is received (app in foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);

        // Show toast notification
        this.toast.success(notification.title || 'Nouvelle notification', {
          duration: 3000,
          position: 'top-center',
        });

        // Handle specific notification types
        this.handleNotification(notification);
      }
    );

    // When user taps on a notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);

        // Navigate based on notification data
        this.handleNotificationAction(notification);
      }
    );
  }

  /**
   * Handle incoming notifications based on type
   */
  private handleNotification(notification: PushNotificationSchema) {
    const data = notification.data;

    switch (data?.type) {
      case 'booking_new':
        // Refresh bookings list
        console.log('New booking notification');
        break;

      case 'booking_confirmed':
        console.log('Booking confirmed notification');
        break;

      case 'booking_completed':
        console.log('Booking completed notification');
        break;

      case 'team_assigned':
        console.log('Team assigned notification');
        break;

      default:
        console.log('Unknown notification type:', data?.type);
    }
  }

  /**
   * Handle notification tap actions
   */
  private handleNotificationAction(action: ActionPerformed) {
    const data = action.notification.data;

    if (data?.bookingId) {
      // Navigate to specific booking
      this.router.navigate(['/dashboard'], {
        queryParams: { bookingId: data.bookingId }
      });
    } else if (data?.route) {
      // Navigate to specific route
      this.router.navigate([data.route]);
    } else {
      // Default to dashboard
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Save device token to server
   */
  private saveTokenToServer(token: string) {
    const deviceInfo = {
      token,
      platform: this.platform.IOS ? 'ios' : 'android',
      timestamp: new Date().toISOString()
    };

    this.http.post(`${this.SERVER_URL}/register-device`, deviceInfo).subscribe({
      next: () => {
        console.log('Device token saved to server');
      },
      error: (error) => {
        console.error('Error saving device token:', error);
      }
    });
  }

  /**
   * Check if running on native platform
   */
  private isNativePlatform(): boolean {
    return this.platform.IOS || this.platform.ANDROID;
  }

  /**
   * Get list of delivered notifications (iOS only)
   */
  async getDeliveredNotifications() {
    if (this.isNativePlatform()) {
      const notifications = await PushNotifications.getDeliveredNotifications();
      return notifications.notifications;
    }
    return [];
  }

  /**
   * Remove delivered notifications
   */
  async removeDeliveredNotifications(ids: string[]) {
    if (this.isNativePlatform()) {
      await PushNotifications.removeDeliveredNotifications({
        notifications: ids.map(id => ({ id }))
      });
    }
  }

  /**
   * Remove all delivered notifications
   */
  async removeAllDeliveredNotifications() {
    if (this.isNativePlatform()) {
      await PushNotifications.removeAllDeliveredNotifications();
    }
  }

  /**
   * Check permission status
   */
  async checkPermissions() {
    if (this.isNativePlatform()) {
      return await PushNotifications.checkPermissions();
    }
    return { receive: 'prompt' };
  }
}
