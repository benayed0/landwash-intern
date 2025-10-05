import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirm-modal.component.html',
  styleUrl: './delete-confirm-modal.component.css'
})
export class DeleteConfirmModalComponent {
  @Input() isOpen = false;
  @Input() teamName = '';
  @Input() isDeleting = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onCancel() {
    this.close.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
