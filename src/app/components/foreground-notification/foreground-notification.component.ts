import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationEvent,
} from '@angular/animations';
import {
  ForegroundNotificationService,
  NotificationData,
} from '../../services/foreground-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-foreground-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './foreground-notification.component.html',
  styleUrl: './foreground-notification.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ transform: 'translateY(-100%)', opacity: 0 })
        ),
      ]),
    ]),
  ],
})
export class ForegroundNotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(ForegroundNotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private subscription?: Subscription;

  notifications: NotificationData[] = [];
  private autoHideTimers = new Map<string, any>();
  private isNavigating = false;

  ngOnInit(): void {
    this.subscription = this.notificationService.notification$.subscribe(
      (notification) => {
        this.addNotification(notification);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    // Clear all timers
    this.autoHideTimers.forEach((timer) => clearTimeout(timer));
    this.autoHideTimers.clear();
  }

  private addNotification(notification: NotificationData): void {
    // Create a new array reference to trigger change detection
    this.notifications = [...this.notifications, notification];

    // Manually trigger change detection
    this.cdr.detectChanges();

    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      this.dismiss(notification.id);
    }, 5000);

    this.autoHideTimers.set(notification.id, timer);
  }

  dismiss(id: string, skipAnimation = false): void {
    // Clear the auto-hide timer
    const timer = this.autoHideTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoHideTimers.delete(id);
    }

    if (skipAnimation) {
      // Instant removal without animation
      const notification = document.querySelector(`[data-notification-id="${id}"]`);
      if (notification) {
        (notification as HTMLElement).style.display = 'none';
      }
    }

    // Remove notification from array (creates new array reference)
    this.notifications = this.notifications.filter((n) => n.id !== id);

    // Manually trigger change detection
    this.cdr.detectChanges();
  }

  onNotificationClick(notification: NotificationData): void {
    // Prevent multiple simultaneous navigations
    if (this.isNavigating) {
      return;
    }

    // Handle navigation based on notification data
    if (notification.data?.screen && notification.data?.id) {
      this.isNavigating = true;
      const { screen, id } = notification.data;

      // Dismiss instantly FIRST (visual feedback)
      this.dismiss(notification.id, true);

      // Navigate with optimized settings for speed
      // Using replaceUrl to avoid adding to history stack
      // This makes navigation near-instant
      this.router.navigate(['/dashboard', screen, id], {
        replaceUrl: false,
        skipLocationChange: false,
      });

      // Reset navigation flag
      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
    } else {
      // No navigation data, just dismiss
      this.dismiss(notification.id);
    }
  }

  onAnimationDone(event: AnimationEvent, id: string): void {
    // This is called when animation completes
    // You can add additional logic here if needed
  }

  trackById(index: number, notification: NotificationData): string {
    return notification.id;
  }
}
