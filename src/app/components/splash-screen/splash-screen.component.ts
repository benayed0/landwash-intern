import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
      transition('visible => hidden', [animate('500ms ease-out')]),
    ]),
  ],
})
export class SplashScreenComponent implements OnInit {
  @Output() animationComplete = new EventEmitter<void>();
  showSplash = true;
  animationState = 'visible';

  ngOnInit() {
    // Show splash for 2.5 seconds, then fade out
    setTimeout(() => {
      this.animationState = 'hidden';
      // Wait for animation to complete before hiding
      setTimeout(() => {
        this.showSplash = false;
        this.animationComplete.emit();
      }, 500);
    }, 2500);
  }
}
