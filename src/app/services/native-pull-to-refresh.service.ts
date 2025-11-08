import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Platform } from '@angular/cdk/platform';

/**
 * Native Pull-to-Refresh Service
 *
 * This service provides a native-feeling pull-to-refresh experience
 * that works well on both iOS and Android.
 */
@Injectable({
  providedIn: 'root',
})
export class NativePullToRefreshService {
  private refreshSubject = new Subject<void>();
  public refresh$ = this.refreshSubject.asObservable();

  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private isRefreshing = false;
  private readonly PULL_THRESHOLD = 80; // Reduced for more responsive feel
  private readonly MAX_PULL = 120; // Maximum pull distance

  private refresherElement: HTMLElement | null = null;
  private spinnerElement: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;

  constructor(private platform: Platform) {}

  /**
   * Initialize pull-to-refresh on an element
   */
  initialize(element: HTMLElement) {
    this.createRefresher();
    this.attachListeners(element);
    this.contentElement = element;
  }

  /**
   * Create native-style refresher UI
   */
  private createRefresher() {
    // Create refresher container
    const refresher = document.createElement('div');
    refresher.className = 'native-ptr-refresher';
    refresher.innerHTML = `
      <div class="native-ptr-spinner-wrapper">
        <div class="native-ptr-spinner"></div>
      </div>
    `;

    // Add to body
    document.body.prepend(refresher);

    this.refresherElement = refresher;
    this.spinnerElement = refresher.querySelector('.native-ptr-spinner');

    // Add styles
    this.addStyles();
  }

  /**
   * Add CSS styles for native refresher
   */
  private addStyles() {
    if (document.getElementById('native-ptr-styles')) return;

    const style = document.createElement('style');
    style.id = 'native-ptr-styles';
    style.textContent = `
      .native-ptr-refresher {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-100%);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 9998;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0) 100%);
      }

      .native-ptr-refresher.pulling {
        transition: none;
      }

      .native-ptr-refresher.refreshing {
        transform: translateY(0) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .native-ptr-spinner-wrapper {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scale(0);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .native-ptr-refresher.pulling .native-ptr-spinner-wrapper,
      .native-ptr-refresher.refreshing .native-ptr-spinner-wrapper {
        transform: scale(1);
      }

      .native-ptr-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(195, 255, 0, 0.2);
        border-top-color: #c3ff00;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        box-shadow:
          0 0 15px rgba(195, 255, 0, 0.6),
          inset 0 0 10px rgba(195, 255, 0, 0.2);
      }

      .native-ptr-refresher.refreshing .native-ptr-spinner {
        animation: native-ptr-spin 0.8s linear infinite;
      }

      @keyframes native-ptr-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* iOS-style rubber band effect */
      ${this.platform.IOS ? `
        .native-ptr-content {
          overscroll-behavior-y: contain;
        }
      ` : ''}

      /* Android-style material pull effect */
      ${this.platform.ANDROID ? `
        .native-ptr-refresher {
          background: linear-gradient(180deg,
            rgba(195, 255, 0, 0.05) 0%,
            rgba(10, 10, 10, 0) 100%);
        }
      ` : ''}
    `;

    document.head.appendChild(style);
  }

  /**
   * Attach touch event listeners
   */
  private attachListeners(element: HTMLElement) {
    element.classList.add('native-ptr-content');

    let touchStarted = false;

    // Touch start
    element.addEventListener('touchstart', (e) => {
      // Only start if at top of scroll
      if (element.scrollTop === 0 && !this.isRefreshing) {
        touchStarted = true;
        this.startY = e.touches[0].pageY;
        this.isPulling = false;
      }
    }, { passive: true });

    // Touch move
    element.addEventListener('touchmove', (e) => {
      if (!touchStarted || this.isRefreshing) return;

      this.currentY = e.touches[0].pageY;
      const pullDistance = this.currentY - this.startY;

      // Only handle downward pulls
      if (pullDistance > 0 && element.scrollTop === 0) {
        this.isPulling = true;

        // Calculate pull amount with resistance
        const resistance = 0.5; // Makes pull feel more natural
        const actualPull = Math.min(pullDistance * resistance, this.MAX_PULL);

        // Update refresher position
        if (this.refresherElement) {
          this.refresherElement.classList.add('pulling');
          const translateY = -100 + (actualPull / this.MAX_PULL) * 100;
          this.refresherElement.style.transform = `translateY(${translateY}%)`;

          // Rotate spinner based on pull
          if (this.spinnerElement) {
            const rotation = (actualPull / this.MAX_PULL) * 360;
            this.spinnerElement.style.transform = `rotate(${rotation}deg)`;
          }
        }

        // Add slight haptic feedback at threshold (if available)
        if (pullDistance * resistance >= this.PULL_THRESHOLD) {
          this.triggerHapticFeedback();
        }
      }
    }, { passive: true });

    // Touch end
    element.addEventListener('touchend', () => {
      if (!this.isPulling || this.isRefreshing) {
        touchStarted = false;
        return;
      }

      const pullDistance = (this.currentY - this.startY) * 0.5;

      // Trigger refresh if pulled enough
      if (pullDistance >= this.PULL_THRESHOLD) {
        this.triggerRefresh();
      } else {
        this.resetRefresher();
      }

      touchStarted = false;
      this.isPulling = false;
      this.startY = 0;
      this.currentY = 0;
    }, { passive: true });
  }

  /**
   * Trigger refresh action
   */
  private triggerRefresh() {
    if (this.isRefreshing) return;

    this.isRefreshing = true;

    // Add refreshing class
    if (this.refresherElement) {
      this.refresherElement.classList.remove('pulling');
      this.refresherElement.classList.add('refreshing');
    }

    // Trigger haptic feedback
    this.triggerHapticFeedback('medium');

    // Emit refresh event
    this.refreshSubject.next();

    // Auto-complete after 2 seconds (component should call complete() before this)
    setTimeout(() => {
      if (this.isRefreshing) {
        this.complete();
      }
    }, 3000);
  }

  /**
   * Complete refresh and hide refresher
   */
  complete() {
    if (!this.isRefreshing) return;

    this.isRefreshing = false;

    // Reset refresher
    setTimeout(() => {
      this.resetRefresher();
    }, 300);
  }

  /**
   * Reset refresher to initial state
   */
  private resetRefresher() {
    if (this.refresherElement) {
      this.refresherElement.classList.remove('pulling', 'refreshing');
      this.refresherElement.style.transform = 'translateY(-100%)';
    }

    if (this.spinnerElement) {
      this.spinnerElement.style.transform = 'rotate(0deg)';
    }
  }

  /**
   * Trigger haptic feedback (Capacitor Haptics)
   */
  private async triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
    try {
      // Only trigger once per pull
      if (this.isPulling) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');

        const styleMap = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };

        await Haptics.impact({ style: styleMap[style] });
      }
    } catch (error) {
      // Haptics not available or not installed
      console.log('Haptics not available');
    }
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    if (this.refresherElement) {
      this.refresherElement.remove();
    }

    const styles = document.getElementById('native-ptr-styles');
    if (styles) {
      styles.remove();
    }

    if (this.contentElement) {
      this.contentElement.classList.remove('native-ptr-content');
    }
  }

  /**
   * Manually trigger refresh
   */
  async manualRefresh() {
    this.triggerRefresh();
  }
}
