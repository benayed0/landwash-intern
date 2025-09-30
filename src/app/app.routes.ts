import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { WorkerDashboardComponent } from './components/worker-dashboard/worker-dashboard.component';
import { TeamsComponent } from './components/teams/teams.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { workerGuard } from './guards/worker.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { roleRedirectGuard } from './guards/role-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [roleRedirectGuard],
    component: LoginComponent, // Dummy component, guard will redirect
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard] // Prevent logged-in users from accessing login
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'worker-dashboard',
    component: WorkerDashboardComponent,
    canActivate: [workerGuard]
  },
  {
    path: 'teams',
    component: TeamsComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    canActivate: [roleRedirectGuard],
    component: LoginComponent // Dummy component, guard will redirect
  }
];
