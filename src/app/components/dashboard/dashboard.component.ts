import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { BookingListComponent } from '../booking-list/booking-list.component';
import { OrderListComponent } from '../order-list/order-list.component';
import { SubscriptionListComponent } from '../subscription-list/subscription-list.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { BottomBarComponent } from '../shared/bottom-bar/bottom-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BookingListComponent,
    OrderListComponent,
    SubscriptionListComponent,
    AnalyticsComponent,
    NavbarComponent,
    BottomBarComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: `
    .dashboard-container {
      min-height: 100vh;
      background: #0a0a0a;
      padding-bottom: 80px;
    }

    .view-tabs {
      display: flex;
      background: #0a0a0a;
      padding: 15px;
      gap: 15px;
      justify-content: center;
      border-bottom: 2px solid #2a2a2a;
    }

    .view-tab {
      flex: 1;
      max-width: 200px;
      padding: 15px 25px;
      background: #1a1a1a;
      color: #999;
      border: 2px solid #2a2a2a;
      border-radius: 15px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
    }

    .view-tab.active {
      background: #c3ff00;
      color: #0a0a0a;
      border-color: #c3ff00;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(195, 255, 0, 0.3);
    }

    .content {
      padding: 20px;
    }

    @media (max-width: 768px) {
      .view-tabs {
        flex-direction: column;
        gap: 10px;
      }

      .view-tab {
        max-width: 100%;
      }

      .content {
        padding: 15px;
      }
    }
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private pushNotificationService = inject(PushNotificationService);
  private router = inject(Router);

  viewType = signal<'bookings' | 'orders' | 'subscriptions' | 'analytics'>('bookings');

  constructor() {}

  ngOnInit() {
    this.requestNotificationPermission();
  }

  switchToBookings() {
    this.viewType.set('bookings');
  }

  switchToOrders() {
    this.viewType.set('orders');
  }

  switchToSubscriptions() {
    this.viewType.set('subscriptions');
  }

  switchToAnalytics() {
    this.viewType.set('analytics');
  }

  private async requestNotificationPermission() {
    try {
      await this.pushNotificationService.requestPermission();
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}