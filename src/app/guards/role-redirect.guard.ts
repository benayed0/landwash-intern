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
    return router.createUrlTree(['/dashboard/bookings']);
  }

  // If no user data cached, fetch it first
  return authService.refreshUserData().pipe(
    map((user) => {
      if (user) {
        return router.createUrlTree(['/dashboard/bookings']);
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};
