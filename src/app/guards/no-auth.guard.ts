import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const noAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 NoAuthGuard: Checking if user should access login page');
  console.log('🔐 NoAuthGuard: isLoggedIn?', authService.isLoggedIn());
  console.log('🔐 NoAuthGuard: Token:', localStorage.getItem('landwash_token'));

  // If user is logged in, redirect to dashboard
  if (authService.isLoggedIn()) {
    // Check if user data is loaded
    const user = authService.getCurrentUser();
    console.log('🔐 NoAuthGuard: Current user:', user);

    if (user) {
      // Redirect based on role
      if (user.role === 'admin') {
        console.log('🔐 NoAuthGuard: User is admin, redirecting to dashboard');
        return router.createUrlTree(['/dashboard']);
      } else {
        console.log('🔐 NoAuthGuard: User is worker, redirecting to worker page');
        return router.createUrlTree(['/worker']);
      }
    } else {
      // User data not loaded yet, wait for it
      console.log('🔐 NoAuthGuard: User data not loaded, fetching...');
      return authService.refreshUserData().pipe(
        map(user => {
          console.log('🔐 NoAuthGuard: Fetched user data:', user);
          if (user) {
            if (user.role === 'admin') {
              console.log('🔐 NoAuthGuard: Fetched user is admin, redirecting to dashboard');
              return router.createUrlTree(['/dashboard']);
            } else {
              console.log('🔐 NoAuthGuard: Fetched user is worker, redirecting to worker page');
              return router.createUrlTree(['/worker']);
            }
          }
          console.log('🔐 NoAuthGuard: No user data found, allowing access to login');
          return true; // Allow access to login if no user data
        })
      );
    }
  }

  console.log('🔐 NoAuthGuard: Not logged in, allowing access to login page');
  return true; // Allow access to login page if not logged in
};