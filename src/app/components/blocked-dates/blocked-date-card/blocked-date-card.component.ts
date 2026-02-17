import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

import { BlockedDate, CreateBlockedDateDto } from '../../../models/blocked-date.model';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-blocked-date-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './blocked-date-card.component.html',
  styleUrls: ['./blocked-date-card.component.css'],
})
export class BlockedDateCardComponent implements OnChanges {
  @Input() blockedDate!: BlockedDate;
  @Output() update = new EventEmitter<{
    blockedDateId: string;
    updateData: Partial<CreateBlockedDateDto>;
  }>();
  @Output() delete = new EventEmitter<string>();

  private toast = inject(HotToastService);
  private dialog = inject(MatDialog);

  isEditing = signal<boolean>(false);
  editForm = signal<{
    startDate?: Date;
    endDate?: Date;
    reason?: string;
  }>({});

  isExpired = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(this.blockedDate.endDate) < now;
  });

  statusColor = computed(() => {
    return this.isExpired() ? 'warning' : 'success';
  });

  statusText = computed(() => {
    return this.isExpired() ? 'Expire' : 'Actif';
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['blockedDate'] && changes['blockedDate'].currentValue) {
      this.isEditing.set(false);
      this.editForm.set({});
    }
  }

  startEdit() {
    this.editForm.set({
      startDate: new Date(this.blockedDate.startDate),
      endDate: new Date(this.blockedDate.endDate),
      reason: this.blockedDate.reason || '',
    });
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editForm.set({});
  }

  saveChanges() {
    const formData = this.editForm();
    if (!formData.startDate) {
      this.toast.error('La date de debut est requise');
      return;
    }
    if (!formData.endDate) {
      this.toast.error('La date de fin est requise');
      return;
    }
    if (formData.endDate < formData.startDate) {
      this.toast.error('La date de fin doit etre apres la date de debut');
      return;
    }

    const updateData: Partial<CreateBlockedDateDto> = {
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      reason: formData.reason || undefined,
    };

    this.update.emit({
      blockedDateId: this.blockedDate._id!,
      updateData,
    });
  }

  confirmDelete() {
    const dialogData: ConfirmDialogData = {
      title: 'Confirmer la suppression',
      message: `Etes-vous sur de vouloir supprimer cette date bloquee ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true,
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.delete.emit(this.blockedDate._id!);
      }
    });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Aucune';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
