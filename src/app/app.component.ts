import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { PullToRefreshService } from './services/pull-to-refresh.service';
import { PwaUpdateService } from './services/pwa-update.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'landwash-intern';
  private refreshSubscription?: Subscription;

  constructor(
    private pullToRefreshService: PullToRefreshService,
    private pwaUpdateService: PwaUpdateService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    // Initialize PWA update service for automatic cache reload on new deployments
    this.pwaUpdateService.initialize();

    // Initialize pull-to-refresh
    this.pullToRefreshService.initialize(this.elementRef.nativeElement);

    // Subscribe to refresh events
    this.refreshSubscription = this.pullToRefreshService.refresh$.subscribe(
      () => {
        this.onRefresh();
      }
    );
  }

  ngOnDestroy() {
    this.refreshSubscription?.unsubscribe();
    this.pullToRefreshService.destroy();
  }

  private onRefresh() {
    // Reload the current route
    const currentUrl = this.router.url;
    window.location.reload();
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}
