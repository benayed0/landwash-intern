import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  // Check if user is admin (this will fetch user data if needed)
  return authService.checkIsAdmin().pipe(
    map((isAdmin) => {
      console.log('🛡️ AdminGuard: isAdmin?', isAdmin);
      if (isAdmin) {
        return true;
      } else {
        // Check if user is a worker and redirect to worker dashboard
        const user = authService.getCurrentUser();
        if (user?.role === 'worker') {
          return router.createUrlTree(['/dashboard/worker-dashboard']);
        } else {
          return router.createUrlTree(['/login']);
        }
      }
    })
  );
};
