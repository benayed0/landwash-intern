# Flutter JavaScript Integration for Real-time Bookings

This document explains how to send real-time booking updates from Flutter to the Angular WebView using JavaScript channels.

## Overview

The Angular booking service now listens for custom JavaScript events that you can dispatch from your Flutter app. This allows real-time synchronization of booking data between Flutter and the WebView.

## Available Events

### 1. Update Booking (`flutter-booking-update`)

Triggered when a booking is updated.

**Flutter Code Example:**

```dart
// In your Flutter code
void updateBookingInWebView(Booking booking) {
  final bookingJson = jsonEncode(booking.toJson());

  webViewController.runJavaScript('''
    window.dispatchEvent(new CustomEvent('flutter-booking-update', {
      detail: $bookingJson
    }));
  ''');
}
```

**Expected Data Format:**
```javascript
{
  _id: "booking123",
  status: "confirmed",
  date: "2025-01-15T10:00:00.000Z",
  userId: { _id: "user123", name: "John Doe", ... },
  teamId: "team123",
  price: 50,
  // ... other booking properties
}
```

### 2. Create Booking (`flutter-booking-create`)

Triggered when a new booking is created.

**Flutter Code Example:**

```dart
void addBookingInWebView(Booking booking) {
  final bookingJson = jsonEncode(booking.toJson());

  webViewController.runJavaScript('''
    window.dispatchEvent(new CustomEvent('flutter-booking-create', {
      detail: $bookingJson
    }));
  ''');
}
```

### 3. Delete Booking (`flutter-booking-delete`)

Triggered when a booking is deleted.

**Flutter Code Example:**

```dart
void deleteBookingInWebView(String bookingId) {
  webViewController.runJavaScript('''
    window.dispatchEvent(new CustomEvent('flutter-booking-delete', {
      detail: { bookingId: "$bookingId" }
    }));
  ''');
}
```

**Expected Data Format:**
```javascript
{
  bookingId: "booking123"
}
```

### 4. Refresh All Bookings (`flutter-booking-refresh`)

Triggered to force a full refresh of all bookings from the server.

**Flutter Code Example:**

```dart
void refreshBookingsInWebView() {
  webViewController.runJavaScript('''
    window.dispatchEvent(new CustomEvent('flutter-booking-refresh'));
  ''');
}
```

## Complete Flutter Integration Example

```dart
import 'dart:convert';
import 'package:webview_flutter/webview_flutter.dart';

class BookingWebViewManager {
  final WebViewController webViewController;

  BookingWebViewManager(this.webViewController);

  /// Update a booking in the WebView
  Future<void> updateBooking(Booking booking) async {
    final bookingJson = jsonEncode(booking.toJson());

    await webViewController.runJavaScript('''
      window.dispatchEvent(new CustomEvent('flutter-booking-update', {
        detail: $bookingJson
      }));
    ''');

    print('Sent booking update to WebView: ${booking.id}');
  }

  /// Add a new booking to the WebView
  Future<void> createBooking(Booking booking) async {
    final bookingJson = jsonEncode(booking.toJson());

    await webViewController.runJavaScript('''
      window.dispatchEvent(new CustomEvent('flutter-booking-create', {
        detail: $bookingJson
      }));
    ''');

    print('Sent new booking to WebView: ${booking.id}');
  }

  /// Delete a booking from the WebView
  Future<void> deleteBooking(String bookingId) async {
    await webViewController.runJavaScript('''
      window.dispatchEvent(new CustomEvent('flutter-booking-delete', {
        detail: { bookingId: "$bookingId" }
      }));
    ''');

    print('Sent booking delete to WebView: $bookingId');
  }

  /// Refresh all bookings in the WebView
  Future<void> refreshBookings() async {
    await webViewController.runJavaScript('''
      window.dispatchEvent(new CustomEvent('flutter-booking-refresh'));
    ''');

    print('Sent booking refresh request to WebView');
  }
}

// Usage in your Flutter app
class BookingService {
  final BookingWebViewManager? webViewManager;

  BookingService({this.webViewManager});

  Future<void> updateBookingStatus(String bookingId, String status) async {
    // Update booking in your Flutter backend
    final updatedBooking = await api.updateBooking(bookingId, {'status': status});

    // Sync with WebView if available
    if (webViewManager != null) {
      await webViewManager!.updateBooking(updatedBooking);
    }
  }

  Future<void> createNewBooking(Booking booking) async {
    // Create booking in your Flutter backend
    final newBooking = await api.createBooking(booking);

    // Sync with WebView if available
    if (webViewManager != null) {
      await webViewManager!.createBooking(newBooking);
    }
  }

  Future<void> deleteBooking(String bookingId) async {
    // Delete booking in your Flutter backend
    await api.deleteBooking(bookingId);

    // Sync with WebView if available
    if (webViewManager != null) {
      await webViewManager!.deleteBooking(bookingId);
    }
  }
}
```

## Event Handlers in Angular

The Angular service automatically listens for these events in the constructor:

```typescript
// In booking.service.ts
private setupFlutterEventListeners(): void {
  window.addEventListener('flutter-booking-update', (event: CustomEvent) => {
    const updatedBooking = event.detail as Booking;
    this.updateBookingFromExternal(updatedBooking);
  });

  window.addEventListener('flutter-booking-create', (event: CustomEvent) => {
    const newBooking = event.detail as Booking;
    this.addBookingFromExternal(newBooking);
  });

  window.addEventListener('flutter-booking-delete', (event: CustomEvent) => {
    const bookingId = event.detail.bookingId as string;
    this.removeBookingFromExternal(bookingId);
  });

  window.addEventListener('flutter-booking-refresh', () => {
    this.refreshBookings();
  });
}
```

## Benefits

1. **Real-time Updates**: Bookings are updated instantly in the WebView without page refresh
2. **Automatic UI Updates**: Angular signals automatically trigger UI updates when data changes
3. **No Polling**: No need to constantly check for updates
4. **Bidirectional Sync**: Keep Flutter and WebView in perfect sync
5. **Performance**: Efficient state management with Angular signals

## Debugging

To test if events are being received in the Angular WebView, open the browser console and check for these log messages:

- `"Received booking update from Flutter: {booking}"`
- `"Received new booking from Flutter: {booking}"`
- `"Received booking delete from Flutter: {bookingId}"`
- `"Received booking refresh request from Flutter"`

You can also manually test events from the browser console:

```javascript
// Test update
window.dispatchEvent(new CustomEvent('flutter-booking-update', {
  detail: { _id: "test123", status: "confirmed", /* ... */ }
}));

// Test create
window.dispatchEvent(new CustomEvent('flutter-booking-create', {
  detail: { _id: "new123", status: "pending", /* ... */ }
}));

// Test delete
window.dispatchEvent(new CustomEvent('flutter-booking-delete', {
  detail: { bookingId: "test123" }
}));

// Test refresh
window.dispatchEvent(new CustomEvent('flutter-booking-refresh'));
```

## Notes

- Make sure the WebView is fully loaded before sending events
- All booking data must match the `Booking` TypeScript interface structure
- Date fields should be ISO 8601 strings (e.g., `"2025-01-15T10:00:00.000Z"`)
- Nested objects (like `userId`, `teamId`) can be either populated objects or string IDs
