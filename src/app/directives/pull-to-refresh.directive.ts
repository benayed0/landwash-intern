import {
  Directive,
  ElementRef,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  inject,
  effect,
  EffectRef,
} from '@angular/core';
import { PullToRefreshService } from '../services/pull-to-refresh.service';

@Directive({
  selector: '[pullToRefresh]',
  standalone: true,
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  @Output() refresh = new EventEmitter<void>();

  private pullToRefreshService = inject(PullToRefreshService);
  private el = inject(ElementRef);

  private startY = 0;
  private currentY = 0;
  private pullDistance = 0;
  private threshold = 80; // Minimum pull distance to trigger refresh
  private maxPullDistance = 120;
  private isPulling = false;
  private refreshIndicator?: HTMLElement;
  private refreshEffect?: EffectRef;
  private isRefreshing = false;

  constructor() {
    // Listen for refresh completion from service using effect
    this.refreshEffect = effect(() => {
      const isRefreshing = this.pullToRefreshService.isRefreshing();
      console.log(
        '🔄 PullToRefreshDirective: effect triggered, isRefreshing:',
        isRefreshing,
        'this.isRefreshing:',
        this.isRefreshing
      );
      if (!isRefreshing && this.isRefreshing) {
        console.log('🔄 PullToRefreshDirective: calling completeRefresh()');
        this.completeRefresh();
      }
    });
  }

  ngOnInit() {
    if (this.pullToRefreshService.isPullToRefreshSupported()) {
      this.setupPullToRefresh();
      this.createRefreshIndicator();
    }
  }

  ngOnDestroy() {
    this.removeEventListeners();
    this.removeRefreshIndicator();
    this.refreshEffect?.destroy();
  }

  private setupPullToRefresh() {
    const element = this.el.nativeElement;

    element.addEventListener('touchstart', this.onTouchStart.bind(this), {
      passive: true,
    });
    element.addEventListener('touchmove', this.onTouchMove.bind(this), {
      passive: false,
    });
    element.addEventListener('touchend', this.onTouchEnd.bind(this), {
      passive: true,
    });
  }

  private removeEventListeners() {
    const element = this.el.nativeElement;
    element.removeEventListener('touchstart', this.onTouchStart.bind(this));
    element.removeEventListener('touchmove', this.onTouchMove.bind(this));
    element.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private createRefreshIndicator() {
    this.refreshIndicator = document.createElement('div');
    this.refreshIndicator.className = 'pull-refresh-indicator';
    this.refreshIndicator.innerHTML = `
      <div class="refresh-icon">
        <div class="pull-arrow">↓</div>
        <div class="spinner-ring" style="display: none;"></div>
      </div>
    `;

    // Add styles
    Object.assign(this.refreshIndicator.style, {
      position: 'absolute',
      top: '-50px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '40px',
      height: '40px',
      background: 'rgba(26, 26, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '50%',
      color: '#c3ff00',
      zIndex: '1000',
      opacity: '0',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(195, 255, 0, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    });

    // Add icon styles
    const style = document.createElement('style');
    style.textContent = `
      .refresh-icon {
        width: 24px;
        height: 24px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pull-arrow {
        font-size: 18px;
        font-weight: bold;
        color: #c3ff00;
        transition: transform 0.3s ease;
        display: block;
      }

      .spinner-ring {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(195, 255, 0, 0.3);
        border-top: 2px solid #c3ff00;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        position: absolute;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* States */
      .pull-refresh-indicator.pulling .pull-arrow {
        transform: rotate(0deg);
      }

      .pull-refresh-indicator.ready .pull-arrow {
        transform: rotate(180deg);
      }

      .pull-refresh-indicator.refreshing .pull-arrow {
        display: none;
      }

      .pull-refresh-indicator.refreshing .spinner-ring {
        display: block !important;
        animation: spin 1s linear infinite;
      }
    `;

    if (!document.head.querySelector('style[data-pull-refresh]')) {
      style.setAttribute('data-pull-refresh', '');
      document.head.appendChild(style);
    }

    this.el.nativeElement.style.position = 'relative';
    this.el.nativeElement.appendChild(this.refreshIndicator);
  }

  private removeRefreshIndicator() {
    if (this.refreshIndicator) {
      this.refreshIndicator.remove();
    }
  }

  private onTouchStart(event: TouchEvent) {
    if (this.el.nativeElement.scrollTop === 0) {
      this.startY = event.touches[0].clientY;
      this.isPulling = true;
    }
  }

  private onTouchMove(event: TouchEvent) {
    if (!this.isPulling) return;

    this.currentY = event.touches[0].clientY;
    this.pullDistance = Math.max(0, this.currentY - this.startY);

    if (this.pullDistance > 0 && this.el.nativeElement.scrollTop === 0) {
      event.preventDefault();

      // Limit pull distance
      const dampedDistance = Math.min(
        this.pullDistance * 0.5,
        this.maxPullDistance
      );

      if (this.refreshIndicator) {
        const opacity = Math.min(dampedDistance / this.threshold, 1);
        const translateY = dampedDistance - 50;

        this.refreshIndicator.style.opacity = opacity.toString();
        this.refreshIndicator.style.transform = `translateX(-50%) translateY(${Math.max(
          translateY,
          -50
        )}px)`;

        // Update indicator state
        if (this.pullDistance >= this.threshold) {
          this.refreshIndicator.className = 'pull-refresh-indicator ready';
        } else {
          this.refreshIndicator.className = 'pull-refresh-indicator pulling';
        }
      }
    }
  }

  private onTouchEnd() {
    if (!this.isPulling) return;

    this.isPulling = false;

    if (this.pullDistance >= this.threshold) {
      this.triggerRefresh();
    } else {
      this.resetIndicator();
    }

    this.pullDistance = 0;
  }

  private triggerRefresh() {
    this.isRefreshing = true;

    if (this.refreshIndicator) {
      this.refreshIndicator.className = 'pull-refresh-indicator refreshing';
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    this.pullToRefreshService.triggerRefresh();
    this.refresh.emit();

    // Fallback timeout (will be overridden if completeRefresh is called sooner)
    setTimeout(() => {
      if (this.isRefreshing) {
        this.completeRefresh();
      }
    }, 2000);
  }

  private completeRefresh() {
    console.log(
      '🔄 PullToRefreshDirective: completeRefresh() called, hiding indicator'
    );
    this.isRefreshing = false;
    this.resetIndicator();
  }

  private resetIndicator() {
    if (this.refreshIndicator) {
      this.refreshIndicator.style.opacity = '0';
      this.refreshIndicator.style.transform =
        'translateX(-50%) translateY(-50px)';
      this.refreshIndicator.className = 'pull-refresh-indicator';
    }
  }
}
