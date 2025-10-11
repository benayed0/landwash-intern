import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-container.component.html',
  styleUrl: './modal-container.component.css'
})
export class ModalContainerComponent {
  @Input() show: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' | 'auto' = 'auto';
  @Input() closeOnOverlayClick: boolean = true;
  @Input() showCloseButton: boolean = false;
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    if (this.show) {
      this.onClose();
    }
  }

  onOverlayClick() {
    if (this.closeOnOverlayClick) {
      this.onClose();
    }
  }

  onContentClick(event: Event) {
    // Prevent overlay click when clicking on modal content
    event.stopPropagation();
  }

  onClose() {
    this.close.emit();
  }
}
