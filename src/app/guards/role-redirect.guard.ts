import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  // Get the current user
  const user = authService.getCurrentUser();

  if (user) {
    // If we already have user data, redirect based on role
    if (user.role === 'admin') {
      return router.createUrlTree(['/dashboard/bookings']);
    } else if (user.role === 'worker') {
      return router.createUrlTree(['/dashboard/worker-dashboard']);
    } else {
      return router.createUrlTree(['/login']);
    }
  }

  // If no user data cached, fetch it first
  return authService.refreshUserData().pipe(
    map((user) => {
      if (user?.role === 'admin') {
        return router.createUrlTree(['/dashboard/bookings']);
      } else if (user?.role === 'worker') {
        return router.createUrlTree(['/dashboard/worker-dashboard']);
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};
