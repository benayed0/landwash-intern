import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Personal } from '../../models/personal.model';
import { PushNotificationService } from '../../services/push-notification.service';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private pushNotificationService = inject(PushNotificationService);
  private toast = inject(HotToastService);

  currentUser: Personal | null = null;
  isEditing = false;
  editedUser: Partial<Personal> = {};
  notificationsEnabled = false;
  isMobile = false;
  isLoadingNotificationStatus = false;

  ngOnInit() {
    this.loadUserProfile();
    this.checkMobilePlatform();
    this.checkNotificationStatus();
  }

  loadUserProfile() {
    this.authService.currentUser$.subscribe((user) => {
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

  checkMobilePlatform() {
    this.isMobile = this.pushNotificationService.isMobilePlatform();
  }

  async checkNotificationStatus() {
    if (!this.isMobile) {
      return;
    }

    this.isLoadingNotificationStatus = true;
    try {
      this.notificationsEnabled =
        await this.pushNotificationService.areNotificationsEnabled();
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      this.isLoadingNotificationStatus = false;
    }
  }

  async toggleNotifications() {
    if (!this.isMobile) {
      return;
    }

    this.isLoadingNotificationStatus = true;
    try {
      if (this.notificationsEnabled) {
        // Disable notifications
        await this.pushNotificationService.disableNotifications();
        this.notificationsEnabled = false;
        this.toast.success('Notifications désactivées', {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        // Enable notifications
        await this.pushNotificationService.enableNotifications();
        this.notificationsEnabled = true;
        this.toast.success('Notifications activées', {
          duration: 3000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Error toggling notifications:', error);
      if (error.message === 'Permission denied') {
        this.toast.error(
          'Permission refusée. Veuillez activer les notifications dans les paramètres de votre appareil.',
          {
            duration: 5000,
            position: 'top-center',
          }
        );
      } else {
        this.toast.error('Erreur lors de la modification des notifications', {
          duration: 3000,
          position: 'top-center',
        });
      }
    } finally {
      this.isLoadingNotificationStatus = false;
    }
  }
}
