import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-confirm-dialog.component.html',
  styleUrls: ['./custom-confirm-dialog.component.css']
})
export class CustomConfirmDialogComponent {
  @Input() visible: boolean = false;
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Êtes-vous sûr ?';
  @Input() acceptLabel: string = 'Oui';
  @Input() rejectLabel: string = 'Non';
  @Input() acceptButtonClass: string = 'danger';
  @Input() icon: string = 'pi-exclamation-triangle';

  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  onAccept() {
    this.accept.emit();
    this.close();
  }

  onReject() {
    this.reject.emit();
    this.close();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}