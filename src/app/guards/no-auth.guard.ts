import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const noAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is logged in, redirect to dashboard
  if (authService.isLoggedIn()) {
    // Check if user data is loaded
    const user = authService.getCurrentUser();

    if (user) {
      // Redirect based on role
      if (user.role === 'admin') {
        return router.createUrlTree(['/dashboard']);
      } else {
        return router.createUrlTree(['/worker']);
      }
    } else {
      // User data not loaded yet, wait for it
      return authService.refreshUserData().pipe(
        map((user) => {
          console.log('🔐 NoAuthGuard: Fetched user data:', user);
          if (user) {
            if (user.role === 'admin') {
              return router.createUrlTree(['/dashboard']);
            } else {
              return router.createUrlTree(['/worker']);
            }
          }
          return true; // Allow access to login if no user data
        })
      );
    }
  }

  return true; // Allow access to login page if not logged in
};
