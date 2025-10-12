import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './delete-confirm-modal.component.html',
  styleUrl: './delete-confirm-modal.component.css'
})
export class DeleteConfirmModalComponent {
  @Input() teamName = '';
  @Input() isDeleting = false;
  @Output() confirm = new EventEmitter<void>();

  private dialogRef = inject(MatDialogRef<DeleteConfirmModalComponent>);

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
