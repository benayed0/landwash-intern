import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryType,
  BiometryError,
  BiometryErrorType,
} from '@aparajita/capacitor-biometric-auth';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: BiometryType;
  reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BiometricAuthService {
  private isAppLockedSubject = new BehaviorSubject<boolean>(false);
  public isAppLocked$ = this.isAppLockedSubject.asObservable();

  private biometricEnabledKey = 'biometric_enabled';
  private appBackgroundedKey = 'app_backgrounded';

  // Track if we should allow locking (prevents locking during navigation)
  private shouldAllowLock = true;

  constructor() {
    // Check if app was backgrounded and should be locked on startup
    this.checkAndLockOnStartup();
  }

  /**
   * Check if app should be locked on startup (e.g., after being backgrounded)
   */
  private checkAndLockOnStartup(): void {
    const wasBackgrounded = sessionStorage.getItem(this.appBackgroundedKey);
    // Only lock if was backgrounded AND biometric is enabled
    // Note: We can't check login here because AuthService might not be initialized yet
    // The app component will handle the login check
    if (wasBackgrounded === 'true' && this.isBiometricEnabled()) {
      console.log('🔒 App was backgrounded, locking on startup');
      this.lockApp();
      // Clear the backgrounded flag
      sessionStorage.removeItem(this.appBackgroundedKey);
      // Set the startup lock flag to prevent re-locking on navigation
      sessionStorage.setItem('has_locked_on_startup', 'true');
    }
  }

  /**
   * Check if locking is currently allowed
   */
  canLock(): boolean {
    return this.shouldAllowLock;
  }

  /**
   * Disable automatic locking (used after initial unlock)
   */
  disableAutoLock(): void {
    this.shouldAllowLock = false;
    console.log('🔓 Auto-lock disabled (navigation allowed)');
  }

  /**
   * Enable automatic locking (used when app backgrounds)
   */
  enableAutoLock(): void {
    this.shouldAllowLock = true;
    console.log('🔒 Auto-lock enabled (app backgrounded)');
  }

  /**
   * Check if biometric authentication is available on the device
   */
  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    // Only available on native platforms
    if (!Capacitor.isNativePlatform()) {
      return {
        isAvailable: false,
        biometryType: BiometryType.none,
        reason: 'Not running on native platform',
      };
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      return {
        isAvailable: result.isAvailable,
        biometryType: result.biometryType,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        isAvailable: false,
        biometryType: BiometryType.none,
        reason: 'Error checking biometry',
      };
    }
  }

  /**
   * Get user-friendly name for the biometry type
   */
  getBiometryTypeName(type: BiometryType): string {
    switch (type) {
      case BiometryType.faceId:
        return 'Face ID';
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.fingerprintAuthentication:
        return 'Fingerprint';
      case BiometryType.faceAuthentication:
        return 'Face Authentication';
      case BiometryType.irisAuthentication:
        return 'Iris Authentication';
      default:
        return 'Biometric Authentication';
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(): Promise<boolean> {
    try {
      const availability = await this.checkBiometricAvailability();

      if (!availability.isAvailable) {
        console.log('Biometric authentication not available');
        return false;
      }

      const biometryName = this.getBiometryTypeName(availability.biometryType);

      await BiometricAuth.authenticate({
        reason: `Use ${biometryName} to unlock`,
        cancelTitle: 'Cancel',
        allowDeviceCredential: false, // Only allow biometric, not device passcode
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Unlock App',
        androidSubtitle: `Use ${biometryName} to continue`,
        androidConfirmationRequired: false,
      });

      console.log('Biometric authentication successful');
      return true;
    } catch (error) {
      const biometricError = error as BiometryError;

      // Handle different error types
      switch (biometricError.code) {
        case BiometryErrorType.userCancel:
          console.log('User cancelled biometric authentication');
          break;
        case BiometryErrorType.authenticationFailed:
          console.log('Biometric authentication failed');
          break;
        case BiometryErrorType.biometryLockout:
          console.log('Biometric authentication locked out');
          break;
        case BiometryErrorType.biometryNotAvailable:
          console.log('Biometric authentication not available');
          break;
        default:
          console.error('Biometric authentication error:', error);
      }

      return false;
    }
  }

  /**
   * Lock the app (show lock screen)
   */
  lockApp(): void {
    console.log('🔒 Locking app');
    this.isAppLockedSubject.next(true);
  }

  /**
   * Mark that the app has been backgrounded
   */
  markAppBackgrounded(): void {
    sessionStorage.setItem(this.appBackgroundedKey, 'true');
  }

  /**
   * Unlock the app (hide lock screen)
   */
  unlockApp(): void {
    console.log('🔓 Unlocking app');
    this.isAppLockedSubject.next(false);
    // Disable auto-lock after successful unlock to prevent locking on navigation
    this.disableAutoLock();
  }

  /**
   * Check if app is currently locked
   */
  isAppLocked(): boolean {
    return this.isAppLockedSubject.value;
  }

  /**
   * Check if biometric authentication is enabled
   * Always returns true on native platforms (biometric is always enabled)
   */
  isBiometricEnabled(): boolean {
    // Biometric is always enabled on native platforms
    return Capacitor.isNativePlatform();
  }

  /**
   * Enable biometric authentication
   * @deprecated - Biometric is now always enabled
   */
  enableBiometric(): void {
    // No longer needed - always enabled
  }

  /**
   * Disable biometric authentication
   * @deprecated - Biometric is now always enabled
   */
  disableBiometric(): void {
    // No longer needed - always enabled
  }

  /**
   * Attempt to unlock the app with biometrics
   * Returns true if successful, false otherwise
   */
  async attemptUnlock(): Promise<boolean> {
    const success = await this.authenticate();
    if (success) {
      this.unlockApp();
    }
    return success;
  }
}
