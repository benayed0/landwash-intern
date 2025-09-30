import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TeamsComponent } from './components/teams/teams.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
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
    path: 'teams',
    component: TeamsComponent,
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
