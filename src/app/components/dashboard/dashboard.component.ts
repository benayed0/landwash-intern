import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { BookingListComponent } from '../booking-list/booking-list.component';
import { OrderListComponent } from '../order-list/order-list.component';
import { SubscriptionListComponent } from '../subscription-list/subscription-list.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { ProductsComponent } from '../products/products.component';
import { TeamsComponent } from '../teams/teams.component';
import { UsersComponent } from '../users/users.component';
import { ProfileComponent } from '../profile/profile.component';
import { WorkerDashboardComponent } from '../worker-dashboard/worker-dashboard.component';
import { CreateBookingComponent } from '../create-booking/create-booking.component';

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
    UsersComponent,
    ProfileComponent,
    WorkerDashboardComponent,
    CreateBookingComponent,
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
    | 'create-booking'
    | 'orders'
    | 'subscriptions'
    | 'analytics'
    | 'products'
    | 'personals'
    | 'users'
    | 'profile'
    | 'worker-dashboard'
  >('bookings');

  // Sidebar toggle state
  sidebarCollapsed = signal(true);

  constructor() {}

  ngOnInit() {
    this.requestNotificationPermission();

    // Listen to route changes and set initial view
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.url;
        const view = currentUrl.split('/dashboard/')[1];
        if (view && this.isValidViewType(view)) {
          this.viewType.set(view);
        }
      }
    });

    // Set initial view based on current URL
    const currentUrl = this.router.url;
    const view = currentUrl.split('/dashboard/')[1];
    if (view && this.isValidViewType(view)) {
      this.viewType.set(view);
    }
  }

  private isValidViewType(
    view: string
  ): view is
    | 'bookings'
    | 'create-booking'
    | 'orders'
    | 'subscriptions'
    | 'analytics'
    | 'products'
    | 'personals'
    | 'users'
    | 'profile'
    | 'worker-dashboard' {
    return [
      'bookings',
      'create-booking',
      'orders',
      'subscriptions',
      'analytics',
      'products',
      'personals',
      'users',
      'profile',
      'worker-dashboard',
    ].includes(view);
  }
  getPageTitle(): string {
    switch (this.viewType()) {
      case 'bookings':
        return 'Réservations';
      case 'create-booking':
        return 'Créer une réservation';
      case 'orders':
        return 'Commandes';
      case 'subscriptions':
        return 'Abonnements';
      case 'analytics':
        return 'Analytique';
      case 'products':
        return 'Produits';
      case 'personals':
        return 'Personnels';
      case 'users':
        return 'Utilisateurs';
      case 'profile':
        return 'Profil';
      case 'worker-dashboard':
        return 'Tableau de bord des employés';
      default:
        return '';
    }
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

  switchToCreateBooking() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('create-booking');
    } else {
      this.router.navigate(['/dashboard/create-booking']);
    }
  }
  switchToUsers() {
    console.log('Switching to Users view');

    this.hapticFeedback();
    if (this.authService.isWebView()) {
      // In WebView mode, just update the signal (Flutter handles navigation)
      this.viewType.set('users');
    } else {
      // In browser mode, navigate to route
      this.router.navigate(['/dashboard/users']);
    }
  }
  switchToWorkerDashboard() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      // In WebView mode, just update the signal (Flutter handles navigation)
      this.viewType.set('worker-dashboard');
    } else {
      // In browser mode, navigate to route
      this.router.navigate(['/dashboard/worker-dashboard']);
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
  switchToProfile() {
    this.hapticFeedback();
    if (this.authService.isWebView()) {
      this.viewType.set('profile');
    } else {
      this.router.navigate(['/dashboard/profile']);
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
