import { Component, OnInit, Output, EventEmitter, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, race, timer } from 'rxjs';
import { first, filter, tap, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css'],
  animations: [
    trigger('fadeOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [animate('400ms ease-out')]),
    ]),
  ],
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private subscription?: Subscription;

  @Output() animationComplete = new EventEmitter<void>();
  showSplash = true;
  animationState = 'visible';
  private minDisplayTime = 800; // Minimum 800ms to prevent flash
  private maxDisplayTime = 2500; // Maximum 2.5 seconds as fallback

  ngOnInit() {
    const startTime = Date.now();

    // Wait for first navigation to complete OR timeout
    this.subscription = race(
      // Router navigation completed - app UI is ready
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        first(),
        debounceTime(50), // Small debounce to ensure rendering complete
        tap(() => console.log('✅ Navigation complete, hiding splash'))
      ),
      // Maximum timeout fallback
      timer(this.maxDisplayTime).pipe(
        tap(() => console.log('⏱️ Max splash time reached, hiding splash'))
      )
    ).subscribe(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, this.minDisplayTime - elapsedTime);

      // Ensure minimum display time to prevent flash, then hide splash
      setTimeout(() => {
        this.hideSplash();
      }, remainingTime);
    });
  }

  private hideSplash(): void {
    this.animationState = 'hidden';
    // Wait for fade-out animation to complete before hiding
    setTimeout(() => {
      this.showSplash = false;
      this.animationComplete.emit();
    }, 400);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
