import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TokenAuthComponent } from './components/token-auth/token-auth.component';
import { adminGuard } from './guards/admin.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { roleRedirectGuard } from './guards/role-redirect.guard';

export const routes: Routes = [
  // {
  //   path: '',
  //   canActivate: [roleRedirectGuard],
  //   component: LoginComponent, // Dummy component, guard will redirect
  //   pathMatch: 'full',
  // },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard], // Prevent logged-in users from accessing login
  },
  {
    path: 'token-auth',
    component: TokenAuthComponent,
    // No guard - this route should be accessible for WebView integration
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  // {
  //   path: 'dashboard/:view',
  //   component: DashboardComponent,
  // },
  // Admin-only routes
  {
    path: 'dashboard/bookings',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/create-booking',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/discounts',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/orders',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/subscriptions',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/analytics',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/products',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/personals',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/users',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard/worker-dashboard',
    component: DashboardComponent,
  },
  {
    path: 'dashboard/profile',
    component: DashboardComponent,
  },
  {
    path: '**',
    canActivate: [roleRedirectGuard],
    component: LoginComponent, // Dummy component, guard will redirect
  },
];
