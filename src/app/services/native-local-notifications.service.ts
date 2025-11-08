import { Injectable } from '@angular/core';
import {
  LocalNotifications,
  ScheduleOptions,
  ActionPerformed,
  PendingResult,
} from '@capacitor/local-notifications';
import { Platform } from '@angular/cdk/platform';
import { Router } from '@angular/router';

export interface BookingReminder {
  bookingId: string;
  title: string;
  body: string;
  scheduleAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NativeLocalNotificationsService {
  private notificationIdCounter = 1;

  constructor(
    private platform: Platform,
    private router: Router
  ) {}

  /**
   * Initialize local notifications
   */
  async initialize() {
    if (!this.isNativePlatform()) {
      console.log('Not a native platform, skipping local notifications');
      return;
    }

    try {
      // Request permissions
      const permission = await LocalNotifications.requestPermissions();

      if (permission.display === 'granted') {
        console.log('Local notifications permission granted');
        this.setupListeners();
      } else {
        console.log('Local notifications permission denied');
      }
    } catch (error) {
      console.error('Error initializing local notifications:', error);
    }
  }

  /**
   * Set up event listeners
   */
  private setupListeners() {
    // Handle notification received (app in foreground)
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Local notification received:', notification);
    });

    // Handle notification action (user tapped)
    LocalNotifications.addListener('localNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Local notification action performed:', action);
      this.handleNotificationAction(action);
    });
  }

  /**
   * Schedule a booking reminder
   */
  async scheduleBookingReminder(reminder: BookingReminder): Promise<number> {
    const notificationId = this.notificationIdCounter++;

    const options: ScheduleOptions = {
      notifications: [
        {
          id: notificationId,
          title: reminder.title,
          body: reminder.body,
          schedule: {
            at: reminder.scheduleAt,
          },
          sound: 'default',
          attachments: undefined,
          actionTypeId: 'BOOKING_REMINDER',
          extra: {
            bookingId: reminder.bookingId,
            type: 'booking_reminder',
          },
        },
      ],
    };

    try {
      await LocalNotifications.schedule(options);
      console.log(`Booking reminder scheduled (ID: ${notificationId}) for:`, reminder.scheduleAt);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling booking reminder:', error);
      return -1;
    }
  }

  /**
   * Schedule multiple booking reminders
   * For example: 24h before, 1h before, 15min before
   */
  async scheduleMultipleReminders(
    bookingId: string,
    bookingDate: Date,
    clientName: string,
    serviceName: string
  ): Promise<number[]> {
    const now = new Date();
    const bookingTime = new Date(bookingDate);
    const notificationIds: number[] = [];

    // 24 hours before
    const reminder24h = new Date(bookingTime);
    reminder24h.setHours(reminder24h.getHours() - 24);

    if (reminder24h > now) {
      const id = await this.scheduleBookingReminder({
        bookingId,
        title: 'Rappel de réservation - Demain',
        body: `${clientName}, votre rendez-vous ${serviceName} est demain à ${this.formatTime(bookingTime)}`,
        scheduleAt: reminder24h,
      });
      if (id > 0) notificationIds.push(id);
    }

    // 1 hour before
    const reminder1h = new Date(bookingTime);
    reminder1h.setHours(reminder1h.getHours() - 1);

    if (reminder1h > now) {
      const id = await this.scheduleBookingReminder({
        bookingId,
        title: 'Rappel de réservation - Dans 1 heure',
        body: `${clientName}, votre rendez-vous ${serviceName} commence dans 1 heure`,
        scheduleAt: reminder1h,
      });
      if (id > 0) notificationIds.push(id);
    }

    // 15 minutes before
    const reminder15min = new Date(bookingTime);
    reminder15min.setMinutes(reminder15min.getMinutes() - 15);

    if (reminder15min > now) {
      const id = await this.scheduleBookingReminder({
        bookingId,
        title: 'Rappel de réservation - Dans 15 minutes',
        body: `${clientName}, votre rendez-vous ${serviceName} commence bientôt!`,
        scheduleAt: reminder15min,
      });
      if (id > 0) notificationIds.push(id);
    }

    return notificationIds;
  }

  /**
   * Schedule team assignment notification
   */
  async scheduleTeamNotification(
    teamName: string,
    bookingDetails: string,
    scheduleAt?: Date
  ): Promise<number> {
    const notificationId = this.notificationIdCounter++;

    const options: ScheduleOptions = {
      notifications: [
        {
          id: notificationId,
          title: '🚗 Nouvelle mission assignée',
          body: `${teamName}, vous avez une nouvelle mission: ${bookingDetails}`,
          schedule: scheduleAt ? { at: scheduleAt } : undefined,
          sound: 'default',
          actionTypeId: 'TEAM_ASSIGNMENT',
          extra: {
            type: 'team_assignment',
          },
        },
      ],
    };

    try {
      if (scheduleAt) {
        await LocalNotifications.schedule(options);
      } else {
        // Show immediately
        await LocalNotifications.schedule({
          notifications: [
            {
              ...options.notifications[0],
              schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            },
          ],
        });
      }
      return notificationId;
    } catch (error) {
      console.error('Error scheduling team notification:', error);
      return -1;
    }
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<PendingResult> {
    try {
      return await LocalNotifications.getPending();
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return { notifications: [] };
    }
  }

  /**
   * Cancel a notification
   */
  async cancelNotification(id: number) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log(`Notification ${id} cancelled`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications for a booking
   */
  async cancelBookingNotifications(bookingId: string) {
    try {
      const pending = await this.getPendingNotifications();

      const bookingNotifications = pending.notifications
        .filter((n) => n.extra?.bookingId === bookingId)
        .map((n) => ({ id: n.id }));

      if (bookingNotifications.length > 0) {
        await LocalNotifications.cancel({ notifications: bookingNotifications });
        console.log(`Cancelled ${bookingNotifications.length} notifications for booking ${bookingId}`);
      }
    } catch (error) {
      console.error('Error cancelling booking notifications:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      const pending = await this.getPendingNotifications();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
        console.log('All notifications cancelled');
      }
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Handle notification actions
   */
  private handleNotificationAction(action: ActionPerformed) {
    const extra = action.notification.extra;

    if (extra?.bookingId) {
      // Navigate to booking details
      this.router.navigate(['/dashboard'], {
        queryParams: { bookingId: extra.bookingId },
      });
    } else if (extra?.type === 'team_assignment') {
      // Navigate to team bookings
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Check if running on native platform
   */
  private isNativePlatform(): boolean {
    return this.platform.IOS || this.platform.ANDROID;
  }

  /**
   * Check permissions
   */
  async checkPermissions() {
    if (this.isNativePlatform()) {
      return await LocalNotifications.checkPermissions();
    }
    return { display: 'prompt' };
  }

  /**
   * Request permissions
   */
  async requestPermissions() {
    if (this.isNativePlatform()) {
      return await LocalNotifications.requestPermissions();
    }
    return { display: 'prompt' };
  }
}
