# 🚀 Native Features Implementation Guide

This guide shows you how to integrate all the native services into your Landwash app.

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [Push Notifications](#push-notifications)
3. [Camera Integration](#camera-integration)
4. [Geolocation](#geolocation)
5. [Pull-to-Refresh](#pull-to-refresh)
6. [Local Notifications](#local-notifications)
7. [Complete Examples](#complete-examples)

---

## 🎯 Initial Setup

### 1. Initialize Services in `app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Platform } from '@angular/cdk/platform';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    Platform,
    // Other providers...
  ],
};
```

### 2. Initialize in `main.ts` or `app.component.ts`

```typescript
// app.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { NativePushNotificationService } from './services/native-push-notification.service';
import { NativeLocalNotificationsService } from './services/native-local-notifications.service';
import { PwaUpdateService } from './services/pwa-update.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  private pushService = inject(NativePushNotificationService);
  private localNotifications = inject(NativeLocalNotificationsService);
  private pwaUpdate = inject(PwaUpdateService);

  ngOnInit() {
    // Initialize native features
    this.pushService.initialize();
    this.localNotifications.initialize();
    this.pwaUpdate.initialize();
  }
}
```

---

## 🔔 Push Notifications

### Receive Push Notifications

The service automatically handles push notifications. To customize behavior:

```typescript
// In your booking service or component
import { NativePushNotificationService } from '../services/native-push-notification.service';

constructor(private pushService: NativePushNotificationService) {}

async checkPushPermissions() {
  const permissions = await this.pushService.checkPermissions();
  console.log('Push permissions:', permissions);
}
```

### Send Push Notification from Backend

Your NestJS backend should send notifications like this:

```json
{
  "notification": {
    "title": "Nouvelle réservation",
    "body": "Une nouvelle réservation vient d'être créée"
  },
  "data": {
    "type": "booking_new",
    "bookingId": "123",
    "route": "/dashboard"
  }
}
```

---

## 📷 Camera Integration

### Example: Take Photo for Rating

Update your rating component to use the native camera:

```typescript
// rating-display.component.ts or similar
import { NativeCameraService } from '../../services/native-camera.service';

export class RatingDisplayComponent {
  private cameraService = inject(NativeCameraService);

  async takePhoto() {
    const photo = await this.cameraService.pickPhoto();

    if (photo) {
      // Convert to File for upload
      const file = this.cameraService.dataUrlToFile(
        photo.dataUrl,
        'rating-photo.jpg'
      );

      // Upload to server
      await this.uploadPhoto(file);

      // Or display immediately
      this.photoUrl = photo.dataUrl;
    }
  }

  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('bookingId', this.booking.id);

    // Upload to your API
    this.http.post(`${environment.apiUrl}/bookings/upload-photo`, formData)
      .subscribe({
        next: (response) => {
          console.log('Photo uploaded:', response);
          this.toast.success('Photo uploadée avec succès');
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.toast.error('Erreur lors de l\'upload');
        }
      });
  }
}
```

### Example: Add Photo to Booking Card HTML

```html
<!-- booking-card.component.html -->
<button class="action-btn photo-btn" (click)="takePhoto()">
  <span class="btn-icon">📷</span>
  <span class="btn-text">Photo</span>
</button>
```

---

## 📍 Geolocation

### Example: Enhanced Location Picker

Update `location-picker.component.ts`:

```typescript
import { NativeGeolocationService } from '../../services/native-geolocation.service';

export class LocationPickerComponent {
  private nativeGeo = inject(NativeGeolocationService);

  async useMyLocation() {
    const position = await this.nativeGeo.getCurrentPosition();

    if (position) {
      // Reverse geocode to get address
      this.locationService.reverseGeocode(
        position.latitude,
        position.longitude
      ).subscribe({
        next: (address) => {
          this.setLocation(
            position.latitude,
            position.longitude,
            address
          );
        }
      });
    }
  }

  async openDirections() {
    if (this.currentSelection()) {
      await this.nativeGeo.openMapsWithDirections(
        this.currentSelection()!.lat,
        this.currentSelection()!.lng,
        this.currentSelection()!.address
      );
    }
  }
}
```

### Example: Team Location Tracking

For tracking team members in real-time:

```typescript
// teams.component.ts
import { NativeGeolocationService } from '../../services/native-geolocation.service';

export class TeamsComponent implements OnInit, OnDestroy {
  private nativeGeo = inject(NativeGeolocationService);
  private watchId: string | null = null;

  async startLocationTracking() {
    this.watchId = await this.nativeGeo.watchPosition((position) => {
      console.log('Team position updated:', position);

      // Send to server
      this.updateTeamLocation(position);
    });
  }

  private updateTeamLocation(position: LocationCoordinates) {
    this.http.post(`${environment.apiUrl}/teams/update-location`, {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      timestamp: new Date().toISOString(),
    }).subscribe();
  }

  ngOnDestroy() {
    // Stop tracking when component is destroyed
    if (this.watchId) {
      this.nativeGeo.clearWatch();
    }
  }
}
```

---

## 🔄 Pull-to-Refresh

### Replace Old Service

Update your components to use the new native pull-to-refresh:

```typescript
// booking-list.component.ts
import { NativePullToRefreshService } from '../../services/native-pull-to-refresh.service';

export class BookingListComponent implements OnInit, OnDestroy {
  private refreshService = inject(NativePullToRefreshService);

  ngOnInit() {
    // Initialize on the scrollable container
    const container = document.querySelector('.booking-list-container') as HTMLElement;
    if (container) {
      this.refreshService.initialize(container);
    }

    // Listen for refresh events
    this.refreshService.refresh$.subscribe(() => {
      this.handleRefresh();
    });
  }

  private async handleRefresh() {
    console.log('Refreshing bookings...');

    try {
      // Reload data
      await this.loadBookings();

      // Show success message
      this.toast.success('Réservations actualisées');
    } catch (error) {
      console.error('Refresh error:', error);
      this.toast.error('Erreur lors de l\'actualisation');
    } finally {
      // Complete the refresh animation
      this.refreshService.complete();
    }
  }

  private async loadBookings() {
    // Your existing load logic
    return new Promise((resolve) => {
      this.bookingService.getBookings().subscribe({
        next: (bookings) => {
          this.bookings = bookings;
          resolve(bookings);
        }
      });
    });
  }

  ngOnDestroy() {
    this.refreshService.destroy();
  }
}
```

### Update HTML

No changes needed in HTML! The service creates its own UI overlay.

---

## 🔔 Local Notifications

### Example: Schedule Booking Reminders

```typescript
// create-booking.component.ts
import { NativeLocalNotificationsService } from '../../services/native-local-notifications.service';

export class CreateBookingComponent {
  private localNotifications = inject(NativeLocalNotificationsService);

  async createBooking(bookingData: any) {
    // Create booking via API
    const booking = await this.bookingService.create(bookingData).toPromise();

    if (booking) {
      // Schedule reminders
      await this.scheduleReminders(booking);

      this.toast.success('Réservation créée avec succès');
      this.router.navigate(['/dashboard']);
    }
  }

  private async scheduleReminders(booking: any) {
    const notificationIds = await this.localNotifications.scheduleMultipleReminders(
      booking.id,
      new Date(booking.scheduledDate),
      booking.client.name,
      booking.service.name
    );

    console.log(`Scheduled ${notificationIds.length} reminders for booking ${booking.id}`);
  }
}
```

### Example: Cancel Reminders on Booking Cancellation

```typescript
async cancelBooking(bookingId: string) {
  // Cancel booking via API
  await this.bookingService.cancel(bookingId).toPromise();

  // Cancel all local notifications for this booking
  await this.localNotifications.cancelBookingNotifications(bookingId);

  this.toast.success('Réservation annulée');
}
```

### Example: Team Assignment Notification

```typescript
// team-assign-modal.component.ts
async assignTeam(teamId: string, bookingId: string) {
  const team = this.teams.find(t => t.id === teamId);
  const booking = this.booking;

  // Assign via API
  await this.teamService.assign(teamId, bookingId).toPromise();

  // Send local notification to team
  await this.localNotifications.scheduleTeamNotification(
    team.name,
    `${booking.service.name} - ${booking.client.name}`,
    new Date(booking.scheduledDate) // Notify at booking time
  );

  this.toast.success('Équipe assignée');
}
```

---

## 📱 Complete Examples

### Example 1: Complete Booking Flow with All Features

```typescript
// booking-flow.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { NativeCameraService } from '../../services/native-camera.service';
import { NativeGeolocationService } from '../../services/native-geolocation.service';
import { NativeLocalNotificationsService } from '../../services/native-local-notifications.service';
import { NativePullToRefreshService } from '../../services/native-pull-to-refresh.service';

export class BookingFlowComponent implements OnInit {
  private camera = inject(NativeCameraService);
  private geo = inject(NativeGeolocationService);
  private notifications = inject(NativeLocalNotificationsService);
  private refresh = inject(NativePullToRefreshService);

  // 1. Get user's current location
  async useCurrentLocation() {
    const position = await this.geo.getCurrentPosition();
    if (position) {
      this.bookingForm.patchValue({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    }
  }

  // 2. Take photo of vehicle
  async takeVehiclePhoto() {
    const photo = await this.camera.takePhoto();
    if (photo) {
      this.vehiclePhotoUrl = photo.dataUrl;
    }
  }

  // 3. Create booking with all features
  async submitBooking() {
    const formValue = this.bookingForm.value;

    // Upload photo if exists
    let photoUrl = null;
    if (this.vehiclePhotoUrl) {
      const file = this.camera.dataUrlToFile(
        this.vehiclePhotoUrl,
        'vehicle-photo.jpg'
      );
      photoUrl = await this.uploadPhoto(file);
    }

    // Create booking
    const booking = await this.bookingService.create({
      ...formValue,
      photoUrl,
    }).toPromise();

    // Schedule notifications
    await this.notifications.scheduleMultipleReminders(
      booking.id,
      new Date(booking.scheduledDate),
      booking.client.name,
      booking.service.name
    );

    // Navigate to confirmation
    this.router.navigate(['/booking-confirmation', booking.id]);
  }
}
```

### Example 2: Team Dashboard with Real-time Location

```typescript
// team-dashboard.component.ts
export class TeamDashboardComponent implements OnInit, OnDestroy {
  private geo = inject(NativeGeolocationService);
  private refresh = inject(NativePullToRefreshService);
  private watchId: string | null = null;

  ngOnInit() {
    // Setup pull-to-refresh
    const container = document.querySelector('.team-dashboard') as HTMLElement;
    this.refresh.initialize(container);

    this.refresh.refresh$.subscribe(() => {
      this.loadTeamBookings();
    });

    // Start location tracking for team members
    if (this.isTeamMember()) {
      this.startLocationTracking();
    }
  }

  private async startLocationTracking() {
    this.watchId = await this.geo.watchPosition((position) => {
      // Update position on server every 30 seconds
      this.updateLocationThrottled(position);
    });
  }

  private updateLocationThrottled = this.throttle((position: LocationCoordinates) => {
    this.http.post(`${environment.apiUrl}/teams/location`, position).subscribe();
  }, 30000); // 30 seconds

  private throttle(func: Function, delay: number) {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  private async loadTeamBookings() {
    try {
      const bookings = await this.bookingService.getTeamBookings().toPromise();
      this.bookings = bookings;
      this.refresh.complete();
    } catch (error) {
      this.refresh.complete();
      throw error;
    }
  }

  ngOnDestroy() {
    if (this.watchId) {
      this.geo.clearWatch();
    }
    this.refresh.destroy();
  }
}
```

---

## 🎨 UI/UX Best Practices

### 1. Permission Requests

Always explain why you need permissions:

```typescript
async requestCameraPermission() {
  const alert = await this.showAlert({
    title: 'Permission requise',
    message: 'Landwash a besoin d\'accéder à votre caméra pour prendre des photos des services effectués.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Autoriser', handler: () => this.camera.requestPermissions() }
    ]
  });
}
```

### 2. Loading States

Show loading indicators during async operations:

```typescript
async takePhoto() {
  this.isLoading = true;
  try {
    const photo = await this.camera.pickPhoto();
    // Process photo...
  } finally {
    this.isLoading = false;
  }
}
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
async getCurrentLocation() {
  try {
    const position = await this.geo.getCurrentPosition();
    return position;
  } catch (error) {
    this.toast.error('Impossible d\'obtenir votre position');
    // Fallback to manual input
    this.showManualLocationInput();
    return null;
  }
}
```

---

## 🧪 Testing on Devices

### iOS Simulator

```bash
# Build and run on iOS simulator
npm run build
npx cap sync ios
npx cap run ios
```

### Android Emulator

```bash
# Build and run on Android emulator
npm run build
npx cap sync android
npx cap run android
```

### Real Devices with Live Reload

```bash
# iOS
npx cap run ios --livereload --external --host=192.168.1.100

# Android
npx cap run android --livereload --external --host=192.168.1.100
```

Replace `192.168.1.100` with your computer's local IP address.

---

## 🚀 Deployment Checklist

Before deploying to App Store / Play Store:

- [ ] Test all native features on real devices
- [ ] Verify push notifications work
- [ ] Test camera on both iOS and Android
- [ ] Test location services
- [ ] Test pull-to-refresh
- [ ] Verify local notifications appear
- [ ] Check all permissions are requested properly
- [ ] Test offline functionality
- [ ] Verify app icons and splash screens
- [ ] Test deep links / notification actions
- [ ] Performance testing
- [ ] Battery usage testing (for location tracking)

---

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)
- [Local Notifications Plugin](https://capacitorjs.com/docs/apis/local-notifications)

---

## 🆘 Troubleshooting

### Camera not working on iOS

Make sure you added camera permission in `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Your description here</string>
```

### Push notifications not received

1. Check Firebase configuration (Android)
2. Check APNS certificates (iOS)
3. Verify device token is saved to server
4. Check notification payload format

### Location always returns null

1. Check permissions in device settings
2. Verify permission strings in `Info.plist` (iOS) and `AndroidManifest.xml`
3. Test on real device (simulators may have issues)

### Pull-to-refresh not working

1. Ensure container has proper scroll behavior
2. Check that element is passed to `initialize()`
3. Verify `complete()` is called after refresh

---

That's it! Your Landwash app is now fully native-ready with all the features mobile users expect. 🎉
