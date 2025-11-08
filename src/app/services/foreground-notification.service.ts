import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForegroundNotificationService {
  private notificationSubject = new Subject<NotificationData>();
  public notification$ = this.notificationSubject.asObservable();

  /**
   * Show a foreground notification
   */
  show(notification: Omit<NotificationData, 'id'>): void {
    const notificationWithId: NotificationData = {
      ...notification,
      id: this.generateId(),
    };
    this.notificationSubject.next(notificationWithId);
  }

  /**
   * Generate a unique ID for the notification
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
