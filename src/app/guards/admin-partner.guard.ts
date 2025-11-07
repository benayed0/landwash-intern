import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Guard that allows access only to admin and partner roles
 * Redirects workers to bookings and others to login
 */
export const adminPartnerGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  // Check if user is admin or partner (follows same pattern as adminGuard)
  return authService.refreshUserData().pipe(
    map((user) => {
      const isAdminOrPartner = user?.role === 'admin' || user?.role === 'partner';

      if (isAdminOrPartner) {
        return true;
      } else {
        // Check if user is a worker and redirect to worker dashboard
        if (user?.role === 'worker') {
          return router.createUrlTree(['/dashboard/bookings']);
        } else {
          return router.createUrlTree(['/login']);
        }
      }
    })
  );
};
