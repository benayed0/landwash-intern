import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE'; // Replace with your actual VAPID public key
  private readonly SERVER_URL = 'http://localhost:3000/notifications'; // Your NestJS API endpoint

  constructor(private swPush: SwPush, private http: HttpClient) {
    this.showNotification(
      'Service Initialisé',
      'Le service de notification est prêt.'
    );
  }

  requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.reject('Notifications not supported');
  }

  subscribeToNotifications(): Promise<void> {
    if (!this.swPush.isEnabled) {
      console.log('Service Worker Push is not enabled');
      return Promise.resolve();
    }

    return this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      })
      .then((subscription) => {
        console.log('Push subscription:', subscription);
        return this.sendSubscriptionToServer(subscription).toPromise();
      })
      .then(() => {
        console.log('Subscription sent to server');
      })
      .catch((err) => {
        console.error('Could not subscribe to push notifications', err);
      });
  }

  private sendSubscriptionToServer(
    subscription: PushSubscription
  ): Observable<any> {
    return this.http.post(`${this.SERVER_URL}/subscribe`, subscription);
  }

  listenForMessages() {
    if (!this.swPush.isEnabled) {
      return;
    }

    this.swPush.messages.subscribe(
      (message: any) => {
        console.log('Push message received:', message);

        // Handle different types of notifications
        if (message.notification) {
          this.showNotification(
            message.notification.title,
            message.notification.body,
            message.notification.data
          );
        }
      },
      (err) => {
        console.error('Error receiving push messages:', err);
      }
    );

    // Handle notification clicks
    this.swPush.notificationClicks.subscribe((click: any) => {
      console.log('Notification clicked:', click);

      // Navigate based on notification data
      if (click.notification && click.notification.data) {
        const data = click.notification.data;
        if (data.url) {
          window.open(data.url, '_self');
        }
      }
    });
  }

  private showNotification(title: string, body: string, data?: any) {
    const options: NotificationOptions = {
      body,
      icon: '/assets/logo.png',
      badge: '/assets/logo.png',
      // vibrate: [200, 100, 200],
      data,
      // actions: [
      //   { action: 'view', title: 'Voir' },
      //   { action: 'close', title: 'Fermer' }
      // ]
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  // Send test notification
  sendTestNotification() {
    this.showNotification(
      'Nouvelle réservation',
      "Une nouvelle réservation vient d'être créée",
      { url: '/dashboard' }
    );
  }
}
