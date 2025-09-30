import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const workerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('👷 workerGuard: Checking if user is worker...');

  if (!authService.isLoggedIn()) {
    console.log('👷 workerGuard: Not logged in, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  return authService.checkIsWorker().pipe(
    map(isWorker => {
      console.log('👷 workerGuard: Is worker?', isWorker);
      if (isWorker) {
        return true;
      } else {
        // Check if user is admin and redirect to admin dashboard
        const user = authService.getCurrentUser();
        if (user?.role === 'admin') {
          console.log('👷 workerGuard: User is admin, redirecting to admin dashboard');
          return router.createUrlTree(['/dashboard']);
        } else {
          console.log('👷 workerGuard: Not a worker, redirecting to login');
          return router.createUrlTree(['/login']);
        }
      }
    }),
    catchError(err => {
      console.error('👷 workerGuard: Error checking worker status:', err);
      return of(router.createUrlTree(['/login']));
    })
  );
};
