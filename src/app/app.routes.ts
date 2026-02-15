import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TokenAuthComponent } from './components/token-auth/token-auth.component';
import { MailActionComponent } from './components/mail-action/mail-action.component';
import { adminGuard } from './guards/admin.guard';
import { adminPartnerGuard } from './guards/admin-partner.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { roleRedirectGuard } from './guards/role-redirect.guard';
import { authGuard } from './guards/auth.guard';

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
  // Email action links - no guard, token-based verification
  {
    path: 'actions/bookings/:id/confirm/:teamId',
    component: MailActionComponent,
    data: { entity: 'bookings', action: 'confirm' },
  },
  {
    path: 'actions/bookings/:id/reject',
    component: MailActionComponent,
    data: { entity: 'bookings', action: 'reject' },
  },
  {
    path: 'actions/orders/:id/confirm',
    component: MailActionComponent,
    data: { entity: 'orders', action: 'confirm' },
  },
  {
    path: 'actions/orders/:id/cancel',
    component: MailActionComponent,
    data: { entity: 'orders', action: 'cancel' },
  },
  {
    path: 'dashboard/bookings',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/bookings/:bookingId',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  // Admin-only routes
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
    path: 'dashboard/orders/:orderId',
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
    canActivate: [adminPartnerGuard], // Allow both admin and partner roles
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
    path: 'dashboard/services',
    component: DashboardComponent,
    canActivate: [adminGuard],
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
