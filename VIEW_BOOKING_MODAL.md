# View Booking Modal - Route Integration

The application now supports opening a booking detail modal via route parameters.

## Route Format

```
/dashboard/bookings/:bookingId
```

## Usage

### 1. **Direct URL Navigation**

Navigate directly to a booking detail:

```
https://your-app.com/dashboard/bookings/65a1b2c3d4e5f6g7h8i9j0k1
```

This will:
- Load the bookings list page
- Automatically open a modal showing the booking details
- When the modal closes, it navigates back to `/dashboard/bookings`

### 2. **Programmatic Navigation (Angular)**

```typescript
// In any component
import { Router } from '@angular/router';

constructor(private router: Router) {}

viewBooking(bookingId: string) {
  this.router.navigate(['/dashboard/bookings', bookingId]);
}
```

### 3. **From Flutter WebView**

```dart
// In your Flutter code
void viewBookingInWebView(String bookingId) {
  webViewController.loadRequest(
    Uri.parse('https://your-app.com/dashboard/bookings/$bookingId')
  );
}

// Or use JavaScript channel
void viewBookingViaJS(String bookingId) {
  webViewController.runJavaScript('''
    window.location.href = '/dashboard/bookings/$bookingId';
  ''');
}
```

### 4. **Using Router Link (in templates)**

```html
<a [routerLink]="['/dashboard/bookings', booking._id]">
  View Details
</a>
```

## Modal Features

The view booking modal displays:

### Client Information
- Name
- Phone number
- Email

### Booking Details
- Date and time
- Service type (Citadine, SUV, Salon)
- Price
- Status badge

### Location
- Full address
- GPS coordinates

### Team Assignment
- Assigned team name

### Products (if any)
- Product names
- Quantities

### Comments
- Customer comments/notes

### Timestamps
- Created date
- Start date (if started)
- Last update date

## Modal Behavior

1. **Opening**: Modal opens automatically when navigating to `/dashboard/bookings/:bookingId`
2. **Loading**: Shows a spinner while fetching booking data
3. **Error Handling**: Displays error message if booking not found or fetch fails
4. **Closing**:
   - Click the X button
   - Click the "Fermer" button
   - Press ESC key (handled by MatDialog)
   - When closed, automatically navigates back to `/dashboard/bookings`

## Styling

The modal features:
- Dark theme matching your app design
- Brand color (#c3ff00) accents
- Status-specific color coding
- Responsive design (mobile-friendly)
- Smooth animations

## Integration with Booking Service

The modal uses the centralized booking service, so:
- Real-time updates from Flutter will automatically reflect in the modal
- No manual refresh needed
- Consistent data across the app

## Example: Complete Flow

```typescript
// 1. User clicks "View" on a booking
onViewBooking(bookingId: string) {
  this.router.navigate(['/dashboard/bookings', bookingId]);
}

// 2. Route activates: /dashboard/bookings/abc123

// 3. BookingListComponent detects route param

// 4. Modal opens automatically showing booking details

// 5. User reviews booking information

// 6. User closes modal

// 7. Automatically navigates to: /dashboard/bookings
```

## API Endpoint Used

```typescript
GET /bookings/:id
```

Returns a single booking with all populated relationships:
- userId (client details)
- teamId (team details)
- products (product details)

## Error Handling

If the booking doesn't exist or can't be loaded:
- Shows error icon and message
- Provides "Réessayer" (Retry) button
- Logs error to console
- Doesn't crash the app

## Browser Back Button

The browser back button works as expected:
- Forward: Opens modal
- Back: Closes modal and returns to list

## Deep Linking Support

Perfect for:
- Email notifications with booking links
- Push notifications
- SMS links
- External references
- Sharing booking URLs

## Testing

### Browser Console Test
```javascript
// Open modal programmatically
window.location.href = '/dashboard/bookings/YOUR_BOOKING_ID';
```

### Flutter Test
```dart
// Test opening a booking
final testBookingId = '65a1b2c3d4e5f6g7h8i9j0k1';
webViewController.loadRequest(
  Uri.parse('http://localhost:4200/dashboard/bookings/$testBookingId')
);
```

## Benefits

✅ **SEO Friendly**: Each booking has a unique URL
✅ **Shareable**: Can share direct links to bookings
✅ **Deep Linking**: Perfect for notifications
✅ **Browser Navigation**: Back/forward buttons work
✅ **State Preservation**: Query params preserved when modal closes
✅ **Clean URLs**: No query parameters needed
✅ **Type Safe**: TypeScript ensures correct data types
✅ **Real-time**: Integrates with Flutter event system
