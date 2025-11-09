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
import { ForegroundNotificationComponent } from './components/foreground-notification/foreground-notification.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { AuthService } from './services/auth.service';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    ForegroundNotificationComponent,
    SplashScreenComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private authService = inject(AuthService);

  title = 'landwash-intern';
  isMobile = Capacitor.getPlatform() !== 'web';
  showSplash = !sessionStorage.getItem('isRefreshing');

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
