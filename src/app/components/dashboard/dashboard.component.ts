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
  ],
  templateUrl: './dashboard.component.html',
  styles: `
    .app-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #0a0a0a 0%, #121212 100%);
      color: #e5e5e5;
      display: flex;
      position: relative;
    }

    .app-container.webview-mode {
      flex-direction: column;
    }

    /* Desktop Sidebar Navigation */
    .desktop-sidebar {
      width: 280px;
      background: rgba(16, 16, 16, 0.95);
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-header .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sidebar-header .logo-img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .sidebar-header .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: #c3ff00;
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: #e5e5e5;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      position: relative;
    }

    .nav-item:hover {
      background: rgba(42, 42, 42, 0.8);
      transform: translateX(4px);
    }

    .nav-item.active {
      background: rgba(195, 255, 0, 0.15);
      color: #c3ff00;
      border-left: 4px solid #c3ff00;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 30px;
      background: #c3ff00;
      border-radius: 2px;
    }

    .nav-icon {
      font-size: 20px;
      min-width: 20px;
    }

    .nav-label {
      flex: 1;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-footer .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 16px 20px;
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sidebar-footer .logout-btn:hover {
      background: rgba(244, 67, 54, 0.2);
      transform: translateY(-2px);
    }

    .logout-text {
      flex: 1;
    }

    /* Content area adjustments */
    .content-container {
      flex: 1;
      position: relative;
    }

    .content-container.with-sidebar {
      margin-left: 280px;
      padding: 20px;
    }

    .content-container.webview-mode {
      margin-left: 0;
      padding: 16px;
      padding-bottom: calc(100px + env(safe-area-inset-bottom));
    }

    /* Mobile Header Styles */
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-img {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: #c3ff00;
    }

    .logout-btn {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .logout-btn:hover {
      background: rgba(244, 67, 54, 0.2);
      transform: translateY(-1px);
    }

    .logout-btn:active {
      transform: scale(0.95);
    }

    .logout-icon {
      font-size: 16px;
    }

    /* Tab Styles */
    .tab-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }

    .tab-label {
      font-size: 11px;
      font-weight: 600;
      text-align: center;
    }

    /* Mobile responsive adjustments */
    @media (max-width: 480px) {
      .logo-text {
        font-size: 16px;
      }

      .logout-btn {
        padding: 6px 10px;
        font-size: 12px;
      }

      .tab-label {
        font-size: 10px;
      }

      .tab-icon {
        font-size: 18px;
      }
    }

    /* View Container Animations - Fixed Layout */
    .mobile-container {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .view-container {
      display: none;
      opacity: 0;
      transform: translateX(30px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, opacity;
    }

    .view-container.active {
      display: block;
      opacity: 1;
      transform: translateX(0);
      animation: slideInView 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideInView {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Enhanced tab animations */
    .mobile-tab {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .mobile-tab::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: #c3ff00;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(-50%);
    }

    .mobile-tab.active::before {
      width: 70%;
    }

    .mobile-tab:active {
      transform: scale(0.95);
    }

    .tab-icon {
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mobile-tab.active .tab-icon {
      transform: scale(1.1);
    }

    .tab-label {
      transition: color 0.2s ease;
    }

    /* Smooth fade animations for global styles */
    * {
      -webkit-tap-highlight-color: transparent;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      /* Hide sidebar on mobile/tablet screens */
      .desktop-sidebar {
        display: none;
      }

      .content-container.with-sidebar {
        margin-left: 0;
        padding: 16px;
        padding-bottom: calc(100px + env(safe-area-inset-bottom));
      }

      /* Show mobile navigation on small screens */
      .mobile-nav.webview-only {
        display: block !important;
      }
    }

    @media (min-width: 769px) {
      /* Hide mobile navigation on desktop screens when not in WebView */
      .mobile-nav.webview-only {
        display: none !important;
      }
    }

    /* Extra small screens */
    @media (max-width: 360px) {
      .tab-label {
        display: none;
      }

      .mobile-tab {
        min-width: 50px;
      }

      .view-container {
        transform: translateX(50px);
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private pushNotificationService = inject(PushNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  viewType = signal<
    'bookings' | 'orders' | 'subscriptions' | 'analytics' | 'products'
  >('bookings');

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
    | 'products' {
    return [
      'bookings',
      'orders',
      'subscriptions',
      'analytics',
      'products',
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

  private hapticFeedback() {
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
