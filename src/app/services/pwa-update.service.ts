import { Injectable, ApplicationRef, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, interval, concat } from 'rxjs';
import { HotToastService } from '@ngneat/hot-toast';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);
  private toast = inject(HotToastService);

  constructor() {}

  /**
   * Initialize PWA update checking
   * - Checks for updates when app becomes stable
   * - Checks for updates every 6 hours
   * - Automatically reloads when new version is available
   */
  initialize() {
    // Only run if service worker is enabled
    if (!this.swUpdate.isEnabled) {
      console.log('PWA: Service Worker is not enabled');
      return;
    }

    console.log('PWA: Update service initialized');

    // Check for updates when app becomes stable
    this.checkForUpdatesOnStable();

    // Check for updates periodically (every 6 hours)
    this.checkForUpdatesPeriodically();

    // Listen for version updates
    this.listenForUpdates();

    // Listen for unrecoverable state (corrupted cache)
    this.handleUnrecoverableState();
  }

  /**
   * Check for updates when app becomes stable
   */
  private checkForUpdatesOnStable() {
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable === true)
    );

    appIsStable$.subscribe(() => {
      console.log('PWA: App is stable, checking for updates...');
      this.swUpdate
        .checkForUpdate()
        .then((updateFound) => {
          if (updateFound) {
            console.log('PWA: Update found on stability check');
          } else {
            console.log('PWA: No update available');
          }
        })
        .catch((err) => {
          console.error('PWA: Error checking for updates', err);
        });
    });
  }

  /**
   * Check for updates periodically (every 6 hours)
   */
  private checkForUpdatesPeriodically() {
    const everySixHours$ = interval(6 * 60 * 60 * 1000); // 6 hours in milliseconds

    everySixHours$.subscribe(() => {
      console.log('PWA: Periodic update check (6 hours)...');
      this.swUpdate
        .checkForUpdate()
        .then((updateFound) => {
          if (updateFound) {
            console.log('PWA: Update found on periodic check');
          }
        })
        .catch((err) => {
          console.error('PWA: Error on periodic update check', err);
        });
    });
  }

  /**
   * Listen for version updates and automatically reload
   */
  private listenForUpdates() {
    this.swUpdate.versionUpdates
      .pipe(
        filter(
          (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'
        )
      )
      .subscribe((evt) => {
        console.log('PWA: New version detected', {
          current: evt.currentVersion,
          latest: evt.latestVersion,
        });

        // Show notification
        this.toast.success('Nouvelle version disponible! Actualisation...', {
          duration: 2000,
          position: 'top-center',
        });

        // Wait a moment for the toast to be visible, then reload
        setTimeout(() => {
          console.log('PWA: Activating update and reloading...');
          this.activateUpdateAndReload();
        }, 2000);
      });
  }

  /**
   * Handle unrecoverable state (corrupted cache)
   */
  private handleUnrecoverableState() {
    this.swUpdate.unrecoverable.subscribe((event) => {
      console.error('PWA: Unrecoverable state detected', event.reason);

      // Notify user and reload
      this.toast.error('Une erreur est survenue. Actualisation...', {
        duration: 2000,
        position: 'top-center',
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });
  }

  /**
   * Activate the latest version and reload the page
   */
  private activateUpdateAndReload() {
    this.swUpdate
      .activateUpdate()
      .then(() => {
        console.log('PWA: Update activated, reloading page...');
        // Force reload to get the new version
        window.location.reload();
      })
      .catch((err) => {
        console.error('PWA: Error activating update', err);
        // Try to reload anyway
        window.location.reload();
      });
  }

  /**
   * Manually check for updates (can be called from UI)
   */
  checkForUpdate() {
    if (!this.swUpdate.isEnabled) {
      console.log('PWA: Service Worker is not enabled');
      return;
    }

    console.log('PWA: Manual update check requested');
    this.swUpdate
      .checkForUpdate()
      .then((updateFound) => {
        if (updateFound) {
          console.log('PWA: Update found on manual check');
          this.toast.info('Mise à jour trouvée!', {
            duration: 2000,
            position: 'top-center',
          });
        } else {
          console.log('PWA: No update available on manual check');
          this.toast.success('Application à jour!', {
            duration: 2000,
            position: 'top-center',
          });
        }
      })
      .catch((err) => {
        console.error('PWA: Error on manual update check', err);
        this.toast.error('Erreur lors de la vérification', {
          duration: 2000,
          position: 'top-center',
        });
      });
  }
}
