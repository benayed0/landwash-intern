import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PullToRefreshService {
  private refreshSubject = new Subject<void>();
  public refresh$ = this.refreshSubject.asObservable();

  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private isRefreshing = false;
  private readonly PULL_THRESHOLD = 120; // pixels to trigger refresh
  private readonly MIN_PULL_DISTANCE = 50; // minimum distance before showing indicator
  private readonly HOLD_DURATION = 1000; // milliseconds user must hold at threshold

  private indicatorElement: HTMLElement | null = null;
  private holdTimer: any = null;
  private thresholdReached = false;

  constructor() {}

  initialize(element: HTMLElement) {
    this.createIndicator();
    this.attachListeners(element);
  }

  private createIndicator() {
    // Create the pull-to-refresh indicator
    const container = document.createElement('div');
    container.className = 'ptr-container';

    const indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';

    const spinner = document.createElement('div');
    spinner.className = 'ptr-spinner';

    indicator.appendChild(spinner);
    container.appendChild(indicator);
    document.body.appendChild(container);

    this.indicatorElement = indicator;
  }

  private attachListeners(element: HTMLElement) {
    let isTouching = false;

    element.addEventListener(
      'touchstart',
      (e) => {
        // Only start pull-to-refresh if we're at the top of the page
        if (window.scrollY === 0 && !this.isRefreshing) {
          isTouching = true;
          this.startY = e.touches[0].pageY;
          this.thresholdReached = false;
          this.clearHoldTimer();
        }
      },
      { passive: true }
    );

    element.addEventListener(
      'touchmove',
      (e) => {
        if (!isTouching || this.isRefreshing) return;

        this.currentY = e.touches[0].pageY;
        const pullDistance = this.currentY - this.startY;

        // Only show indicator if pull distance exceeds minimum threshold
        if (pullDistance > this.MIN_PULL_DISTANCE && window.scrollY === 0) {
          this.isPulling = true;

          // Show indicator
          if (this.indicatorElement) {
            this.indicatorElement.classList.add('pulling');
          }

          // Start hold timer when threshold is reached
          if (pullDistance >= this.PULL_THRESHOLD && !this.thresholdReached) {
            this.thresholdReached = true;
            this.startHoldTimer();
          } else if (
            pullDistance < this.PULL_THRESHOLD &&
            this.thresholdReached
          ) {
            // User pulled back below threshold, cancel timer
            this.thresholdReached = false;
            this.clearHoldTimer();
          }
        }
      },
      { passive: true }
    );

    element.addEventListener(
      'touchend',
      () => {
        // Clear timer when touch ends
        this.clearHoldTimer();

        if (!this.isPulling || this.isRefreshing) {
          isTouching = false;
          this.thresholdReached = false;
          return;
        }

        // Only trigger refresh if user released after threshold was held
        // (The timer will have called triggerRefresh if held long enough)
        // If released before hold duration, just reset
        this.resetIndicator();

        isTouching = false;
        this.isPulling = false;
        this.thresholdReached = false;
        this.startY = 0;
        this.currentY = 0;
      },
      { passive: true }
    );
  }

  private startHoldTimer() {
    this.clearHoldTimer();
    this.holdTimer = setTimeout(() => {
      // User held the pull position long enough, trigger refresh
      this.triggerRefresh();
    }, this.HOLD_DURATION);
  }

  private clearHoldTimer() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private triggerRefresh() {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    this.clearHoldTimer();
    this.refreshSubject.next();

    // Auto-hide the indicator after 2 seconds
    setTimeout(() => {
      this.resetIndicator();
      this.isRefreshing = false;
    }, 2000);
  }

  private resetIndicator() {
    if (this.indicatorElement) {
      this.indicatorElement.classList.remove('pulling');
    }
  }

  destroy() {
    this.clearHoldTimer();
    const container = document.querySelector('.ptr-container');
    if (container) {
      container.remove();
    }
  }
}
