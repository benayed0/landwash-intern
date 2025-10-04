import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔀 RoleRedirectGuard: Checking user role for redirection');

  if (!authService.isLoggedIn()) {
    console.log('🔀 RoleRedirectGuard: Not logged in, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // Get the current user
  const user = authService.getCurrentUser();

  if (user) {
    // If we already have user data, redirect based on role
    if (user.role === 'admin') {
      console.log(
        '🔀 RoleRedirectGuard: User is admin, redirecting to admin dashboard'
      );
      return router.createUrlTree(['/dashboard/bookings']);
    } else if (user.role === 'worker') {
      console.log(
        '🔀 RoleRedirectGuard: User is worker, redirecting to worker dashboard'
      );
      return router.createUrlTree(['/dashboard/worker-dashboard']);
    } else {
      console.log('🔀 RoleRedirectGuard: Unknown role, redirecting to login');
      return router.createUrlTree(['/login']);
    }
  }

  // If no user data cached, fetch it first
  console.log('🔀 RoleRedirectGuard: No cached user, fetching user data...');
  return authService.refreshUserData().pipe(
    map((user) => {
      if (user?.role === 'admin') {
        console.log(
          '🔀 RoleRedirectGuard: User is admin, redirecting to admin dashboard'
        );
        return router.createUrlTree(['/dashboard/bookings']);
      } else if (user?.role === 'worker') {
        console.log(
          '🔀 RoleRedirectGuard: User is worker, redirecting to worker dashboard'
        );
        return router.createUrlTree(['/dashboard/worker-dashboard']);
      } else {
        console.log(
          '🔀 RoleRedirectGuard: No valid user role, redirecting to login'
        );
        return router.createUrlTree(['/login']);
      }
    })
  );
};
