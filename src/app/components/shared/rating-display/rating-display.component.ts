import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ImageFullscreenModalComponent } from '../image-fullscreen-modal/image-fullscreen-modal.component';

export interface Rating {
  value: number;
  comment?: string;
  photoUrl?: string;
}

@Component({
  selector: 'app-rating-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-display.component.html',
  styleUrls: ['./rating-display.component.css'],
})
export class RatingDisplayComponent {
  @Input() rating!: Rating;
  @Input() variant: 'compact' | 'detailed' = 'compact'; // compact for card, detailed for modal

  private dialog = inject(MatDialog);

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  isStarFilled(star: number): boolean {
    return star <= this.rating.value;
  }

  openImageFullscreen() {
    if (this.rating.photoUrl) {
      this.dialog.open(ImageFullscreenModalComponent, {
        data: {
          imageUrl: this.rating.photoUrl,
          title: 'Photo de la réservation',
        },
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'fullscreen-dialog',
      });
    }
  }
}
