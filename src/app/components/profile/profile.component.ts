import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Personal } from '../../models/personal.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  currentUser: Personal | null = null;
  isEditing = false;
  editedUser: Partial<Personal> = {};
  private userSubscription?: Subscription;

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    this.userSubscription?.unsubscribe();
  }

  loadUserProfile() {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.editedUser = { ...user };
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset edited data if canceling
      this.editedUser = { ...this.currentUser };
    }
  }

  saveProfile() {
    // TODO: Implement save profile functionality
    // This would typically call a service to update the user profile
    console.log('Saving profile:', this.editedUser);
    this.isEditing = false;
  }

  logout() {
    this.authService.logout();
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      admin: 'Administrateur',
      worker: 'Travailleur',
      user: 'Utilisateur',
    };
    return labels[role] || role;
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Actif' : 'Inactif';
  }
}
