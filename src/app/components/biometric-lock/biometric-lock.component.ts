import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BiometricAuthService } from '../../services/biometric-auth.service';
import { AuthService } from '../../services/auth.service';
import { BiometryType } from '@aparajita/capacitor-biometric-auth';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-biometric-lock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './biometric-lock.component.html',
  styleUrls: ['./biometric-lock.component.css'],
})
export class BiometricLockComponent implements OnInit {
  private biometricService = inject(BiometricAuthService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  biometryType: BiometryType = BiometryType.none;
  biometryName: string = 'Biometric';
  isAuthenticating = false;
  authError = false;

  async ngOnInit() {
    // Check if user is logged in - if not, unlock and don't show lock screen
    if (!this.authService.isLoggedIn()) {
      console.log('🔓 User not logged in, unlocking app');
      this.biometricService.unlockApp();
      return;
    }

    // Check what type of biometry is available
    const availability =
      await this.biometricService.checkBiometricAvailability();
    this.biometryType = availability.biometryType;
    this.biometryName = this.biometricService.getBiometryTypeName(
      availability.biometryType
    );

    // Automatically attempt authentication on load
    this.authenticate();
  }

  async authenticate() {
    if (this.isAuthenticating) return;

    this.isAuthenticating = true;
    this.authError = false;

    const success = await this.biometricService.attemptUnlock();

    if (!success) {
      this.authError = true;
      this.isAuthenticating = false;
    }
  }

  logout() {
    // First unlock the app to close the biometric lock screen
    this.dialog.closeAll();
    this.biometricService.unlockApp();

    // Small delay to ensure UI updates before logout
    setTimeout(() => {
      // Disable auto-lock to prevent re-locking during logout
      this.biometricService.disableAutoLock();

      // Clear any session flags
      sessionStorage.removeItem('has_locked_on_startup');
      sessionStorage.removeItem('app_backgrounded');

      // Perform logout
      this.authService.logout();
    }, 100);
  }

  getBiometryIcon(): string {
    switch (this.biometryType) {
      case BiometryType.faceId:
        return '👤';
      case BiometryType.touchId:
      case BiometryType.fingerprintAuthentication:
        return '👆';
      default:
        return '🔒';
    }
  }
}
