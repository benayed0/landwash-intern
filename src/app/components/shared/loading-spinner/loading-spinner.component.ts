import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ProgressSpinner,
  ProgressSpinnerModule,
} from 'primeng/progressspinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css',
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message: string = 'Chargement...';
  @Input() overlay: boolean = false;
  @Input() color: 'primary' | 'white' | 'dark' = 'primary';
}
