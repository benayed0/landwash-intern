import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css',
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message: string = 'Chargement...';
  @Input() overlay: boolean = false;
  @Input() color: 'primary' | 'white' | 'dark' = 'primary';

  // Get spinner diameter based on size
  get diameter(): number {
    switch (this.size) {
      case 'small':
        return 30;
      case 'large':
        return 80;
      default: // medium
        return 50;
    }
  }

  // Get stroke width based on size
  get strokeWidth(): number {
    switch (this.size) {
      case 'small':
        return 3;
      case 'large':
        return 5;
      default: // medium
        return 4;
    }
  }
}
