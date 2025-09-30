import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-bar.component.html',
  styleUrl: './bottom-bar.component.css'
})
export class BottomBarComponent {
  @Input() activeTab: 'dashboard' | 'bookings' | 'teams' | 'profile' = 'dashboard';

  private authService = inject(AuthService);

  getDashboardRoute(): string {
    const user = this.authService.getCurrentUser();
    return user?.role === 'worker' ? '/worker-dashboard' : '/dashboard';
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
