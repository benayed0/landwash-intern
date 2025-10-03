import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PullToRefreshService {
  private refreshSubject = new Subject<string>();
  public refresh$ = this.refreshSubject.asObservable();

  // Global loading state
  isRefreshing = signal(false);

  // Trigger refresh for specific component or global
  triggerRefresh(component?: string) {
    this.isRefreshing.set(true);
    this.refreshSubject.next(component || 'global');

    // Auto-hide after 2 seconds max
    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 2000);
  }

  // Complete refresh manually
  completeRefresh() {
    console.log('🔄 PullToRefreshService: completeRefresh() called');
    this.isRefreshing.set(false);
    console.log('🔄 PullToRefreshService: isRefreshing set to false');
  }

  // Check if device supports pull-to-refresh
  isPullToRefreshSupported(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}