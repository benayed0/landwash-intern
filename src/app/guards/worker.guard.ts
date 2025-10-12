import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const workerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return authService.checkIsWorker().pipe(
    map((isWorker) => {
      if (isWorker) {
        return true;
      } else {
        // Check if user is admin and redirect to admin dashboard
        const user = authService.getCurrentUser();
        if (user?.role === 'admin') {
          return router.createUrlTree(['/dashboard']);
        } else {
          return router.createUrlTree(['/login']);
        }
      }
    }),
    catchError((err) => {
      return of(router.createUrlTree(['/login']));
    })
  );
};
