import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ImageFullscreenData {
  imageUrl: string;
  title?: string;
}

@Component({
  selector: 'app-image-fullscreen-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-fullscreen-modal.component.html',
  styleUrls: ['./image-fullscreen-modal.component.css'],
})
export class ImageFullscreenModalComponent {
  private dialogRef = inject(MatDialogRef<ImageFullscreenModalComponent>);
  public data = inject<ImageFullscreenData>(MAT_DIALOG_DATA);

  close() {
    this.dialogRef.close();
  }

  onImageClick(event: MouseEvent) {
    // Don't close if clicking on the image itself
    event.stopPropagation();
  }

  onBackdropClick() {
    this.close();
  }
}
