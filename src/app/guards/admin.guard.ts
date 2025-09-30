import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AdminGuard: Checking admin access');
  console.log('🛡️ AdminGuard: isLoggedIn?', authService.isLoggedIn());
  console.log('🛡️ AdminGuard: Token:', localStorage.getItem('landwash_token'));
  console.log('🛡️ AdminGuard: UserId:', localStorage.getItem('landwash_user_id'));

  if (!authService.isLoggedIn()) {
    console.log('🛡️ AdminGuard: Not logged in, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  console.log('🛡️ AdminGuard: Checking if user is admin...');
  // Check if user is admin (this will fetch user data if needed)
  return authService.checkIsAdmin().pipe(
    map(isAdmin => {
      console.log('🛡️ AdminGuard: isAdmin?', isAdmin);
      if (isAdmin) {
        console.log('🛡️ AdminGuard: User is admin, allowing access');
        return true;
      } else {
        // Check if user is a worker and redirect to worker dashboard
        const user = authService.getCurrentUser();
        if (user?.role === 'worker') {
          console.log('🛡️ AdminGuard: User is worker, redirecting to worker-dashboard');
          return router.createUrlTree(['/worker-dashboard']);
        } else {
          console.log('🛡️ AdminGuard: User is not admin, redirecting to login');
          return router.createUrlTree(['/login']);
        }
      }
    })
  );
};