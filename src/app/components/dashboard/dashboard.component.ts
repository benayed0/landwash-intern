import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { BookingListComponent } from '../booking-list/booking-list.component';
import { OrderListComponent } from '../order-list/order-list.component';
import { SubscriptionListComponent } from '../subscription-list/subscription-list.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { ProductsComponent } from '../products/products.component';
import { TeamsComponent } from '../teams/teams.component';

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
    ProductsComponent,
    TeamsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private pushNotificationService = inject(PushNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  viewType = signal<
    | 'bookings'
    | 'orders'
    | 'subscriptions'
    | 'analytics'
    | 'products'
    | 'personals'
  >('bookings');

  // Sidebar toggle state
  sidebarCollapsed = signal(true);

  constructor() {}

  ngOnInit() {
    this.requestNotificationPermission();

    // Listen to route parameter changes
    this.route.params.subscribe((params) => {
      const view = params['view'];
      if (view && this.isValidViewType(view)) {
        this.viewType.set(view);
      }
    });
  }

  private isValidViewType(
    view: string
  ): view is
    | 'bookings'
    | 'orders'
    | 'subscriptions'
    | 'analytics'
    | 'products'
    | 'personals' {
    return [
      'bookings',
      'orders',
      'subscriptions',
      'analytics',
      'products',
      'personals',
    ].includes(view);
  }

  switchToBookings() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      // In WebView mode, just update the signal (Flutter handles navigation)
      this.viewType.set('bookings');
    } else {
      // In browser mode, navigate to route
      this.router.navigate(['/dashboard/bookings']);
    }
  }

  switchToOrders() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('orders');
    } else {
      this.router.navigate(['/dashboard/orders']);
    }
  }

  switchToSubscriptions() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('subscriptions');
    } else {
      this.router.navigate(['/dashboard/subscriptions']);
    }
  }

  switchToAnalytics() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('analytics');
    } else {
      this.router.navigate(['/dashboard/analytics']);
    }
  }

  switchToProducts() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('products');
    } else {
      this.router.navigate(['/dashboard/products']);
    }
  }
  switchToPersonals() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('personals');
    } else {
      this.router.navigate(['/dashboard/personals']);
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  closeSidebar() {
    this.sidebarCollapsed.set(true);
  }

  private hapticFeedback() {
    this.toggleSidebar();
    // Add subtle haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Very light vibration (10ms)
    }
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
