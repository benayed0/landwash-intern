import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PullToRefreshService {
  private refreshSubject = new Subject<void>();
  public refresh$ = this.refreshSubject.asObservable();

  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private isRefreshing = false;
  private readonly PULL_THRESHOLD = 80; // pixels to trigger refresh

  private indicatorElement: HTMLElement | null = null;

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

    element.addEventListener('touchstart', (e) => {
      // Only start pull-to-refresh if we're at the top of the page
      if (window.scrollY === 0 && !this.isRefreshing) {
        isTouching = true;
        this.startY = e.touches[0].pageY;
      }
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      if (!isTouching || this.isRefreshing) return;

      this.currentY = e.touches[0].pageY;
      const pullDistance = this.currentY - this.startY;

      if (pullDistance > 0 && window.scrollY === 0) {
        this.isPulling = true;

        // Show indicator
        if (this.indicatorElement) {
          this.indicatorElement.classList.add('pulling');
        }
      }
    }, { passive: true });

    element.addEventListener('touchend', () => {
      if (!this.isPulling || this.isRefreshing) {
        isTouching = false;
        return;
      }

      const pullDistance = this.currentY - this.startY;

      if (pullDistance >= this.PULL_THRESHOLD) {
        this.triggerRefresh();
      } else {
        this.resetIndicator();
      }

      isTouching = false;
      this.isPulling = false;
      this.startY = 0;
      this.currentY = 0;
    }, { passive: true });
  }

  private triggerRefresh() {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
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
    const container = document.querySelector('.ptr-container');
    if (container) {
      container.remove();
    }
  }
}
