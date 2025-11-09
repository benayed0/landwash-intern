import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { ForegroundNotificationComponent } from './components/foreground-notification/foreground-notification.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { BiometricLockComponent } from './components/biometric-lock/biometric-lock.component';
import { AuthService } from './services/auth.service';
import { BiometricAuthService } from './services/biometric-auth.service';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    ForegroundNotificationComponent,
    SplashScreenComponent,
    BiometricLockComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private authService = inject(AuthService);
  private biometricService = inject(BiometricAuthService);

  title = 'landwash-intern';
  isMobile = Capacitor.getPlatform() !== 'web';
  showSplash = !sessionStorage.getItem('isRefreshing');
  isAppLocked$ = this.biometricService.isAppLocked$;

  constructor() {
    // Clean up old splash flags from previous implementation
    localStorage.removeItem('splashShown');
    sessionStorage.removeItem('splashShown');

    // Clear the refresh flag now that app has loaded
    sessionStorage.removeItem('isRefreshing');

    if (Capacitor.getPlatform() === 'ios') {
      Keyboard.setAccessoryBarVisible({ isVisible: false });
    }

    // Hide the native splash screen immediately
    // Our custom splash screen will handle the display
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide();
    }

    // Check if app should be locked on startup (fresh start)
    this.checkInitialLockState();

    // Set up app state listeners for biometric lock
    this.setupAppStateListeners();
  }

  /**
   * Check if app should be locked on initial startup
   */
  private checkInitialLockState(): void {
    // Only lock on initial app startup, not on every navigation
    // Check if this is truly a fresh app start (not a hot reload or navigation)
    const hasLockedBefore = sessionStorage.getItem('has_locked_on_startup');

    if (!hasLockedBefore && this.biometricService.canLock()) {
      // Small delay to ensure auth service has initialized
      setTimeout(() => {
        if (
          this.authService.isLoggedIn() &&
          this.biometricService.isBiometricEnabled() &&
          Capacitor.isNativePlatform()
        ) {
          console.log('🔒 App started, user logged in with biometric enabled - locking');
          this.biometricService.lockApp();
          // Mark that we've locked on this session
          sessionStorage.setItem('has_locked_on_startup', 'true');
        }
      }, 100);
    }
  }

  /**
   * Set up listeners for app state changes (background/foreground)
   */
  private setupAppStateListeners(): void {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Listen for app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Active:', isActive);

      if (!isActive) {
        // App went to background
        this.onAppBackground();
      } else {
        // App came to foreground
        this.onAppForeground();
      }
    });

    // Listen for app URL open (deep links)
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data);
    });
  }

  /**
   * Called when app goes to background
   */
  private onAppBackground(): void {
    console.log('🔒 App backgrounded');
    // Mark that app is backgrounded and lock it if user is logged in and biometric is enabled
    if (
      this.authService.isLoggedIn() &&
      this.biometricService.isBiometricEnabled()
    ) {
      // Enable auto-lock when app goes to background
      this.biometricService.enableAutoLock();
      this.biometricService.markAppBackgrounded();
      this.biometricService.lockApp();
    }
  }

  /**
   * Called when app comes to foreground
   */
  private async onAppForeground(): Promise<void> {
    console.log('🔓 App foregrounded');
    // Check if app should be locked (only if auto-lock is enabled)
    if (
      this.authService.isLoggedIn() &&
      this.biometricService.isBiometricEnabled() &&
      this.biometricService.canLock() &&
      !this.biometricService.isAppLocked()
    ) {
      this.biometricService.lockApp();
    }
  }

  onSplashComplete() {
    this.showSplash = false;
  }
  async handleRefresh(event: any) {
    console.log('🔄 Pull to refresh triggered');

    try {
      // Add minimum delay to show spinner animation
      const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

      // Refresh user data
      const refreshPromise = this.authService.isLoggedIn()
        ? new Promise((resolve) => {
            this.authService.forceRefreshUserData().subscribe({
              next: () => resolve(true),
              error: () => resolve(false),
            });
          })
        : Promise.resolve();

      // Wait for both the refresh and minimum delay
      await Promise.all([refreshPromise, minDelay]);

      // Set flag to skip splash screen on reload
      sessionStorage.setItem('isRefreshing', 'true');

      // Reload the current route
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      // Complete the refresher animation
      event.target.complete();
    }
  }
}
