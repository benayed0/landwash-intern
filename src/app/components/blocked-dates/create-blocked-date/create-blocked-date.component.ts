import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BlockedDateService } from '../../../services/blocked-date.service';
import { CreateBlockedDateDto } from '../../../models/blocked-date.model';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-create-blocked-date',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-blocked-date.component.html',
  styleUrls: ['./create-blocked-date.component.css'],
})
export class CreateBlockedDateComponent implements OnInit {
  private blockedDateService = inject(BlockedDateService);
  private toast = inject(HotToastService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateBlockedDateComponent>);

  blockedDateForm!: FormGroup;
  isSubmitting = signal<boolean>(false);

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.blockedDateForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: [''],
    });
  }

  onSubmit() {
    if (this.blockedDateForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.blockedDateForm.value;
    const dto: CreateBlockedDateDto = {
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      reason: formValue.reason?.trim() || undefined,
    };

    this.blockedDateService.create(dto).subscribe({
      next: () => {
        this.toast.success('Date bloquee creee avec succes!');
        this.dialogRef.close(true);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error creating blocked date:', error);
        let errorMessage = 'Erreur lors de la creation de la date bloquee';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.toast.error(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched() {
    Object.keys(this.blockedDateForm.controls).forEach((key) => {
      const control = this.blockedDateForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.blockedDateForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.blockedDateForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est requis';
    }
    return '';
  }

}
