import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TeamService } from '../../../services/team.service';
import { Personal } from '../../../models/personal.model';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-edit-personal-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './edit-personal-modal.component.html',
  styleUrl: './edit-personal-modal.component.css',
})
export class EditPersonalModalComponent implements OnInit {
  private teamService = inject(TeamService);
  private toast = inject(HotToastService);
  private dialogRef = inject(MatDialogRef<EditPersonalModalComponent>);

  @Input() personal!: Personal;
  @Output() personalUpdated = new EventEmitter<Personal>();

  editedPersonal: Partial<Personal> = {};
  isSubmitting = false;
  nameError = '';
  emailError = '';
  phoneError = '';

  // Password reset functionality
  resetPassword = false;
  newPassword = '';
  passwordVisible = true;

  ngOnInit() {
    if (!this.personal) {
      console.error('No personal data provided');
      this.dialogRef.close();
      return;
    }

    // Initialize edited personal with current values
    this.editedPersonal = {
      name: this.personal.name,
      email: this.personal.email,
      phone: this.personal.phone,
      role: this.personal.role,
    };
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // Build update payload
    const updateData: Partial<Personal> = {
      ...this.editedPersonal,
    };

    // Add password if reset is enabled
    if (this.resetPassword && this.newPassword) {
      updateData.password = this.newPassword;
    }

    this.teamService.updatePersonal(this.personal._id, updateData).subscribe({
      next: (updatedPersonal) => {
        this.toast.success('Personnel mis à jour avec succès!');
        this.personalUpdated.emit(updatedPersonal);
        this.dialogRef.close();
      },
      error: (err) => {
        console.error('Error updating personal:', err);
        this.toast.error('Erreur lors de la mise à jour du personnel');
        this.isSubmitting = false;
      },
    });
  }

  validateForm(): boolean {
    this.nameError = '';
    this.emailError = '';
    this.phoneError = '';

    let isValid = true;

    // Validate name
    if (!this.editedPersonal.name || this.editedPersonal.name.trim() === '') {
      this.nameError = 'Le nom est requis';
      isValid = false;
    }

    // Validate email
    if (!this.editedPersonal.email || this.editedPersonal.email.trim() === '') {
      this.emailError = "L'email est requis";
      isValid = false;
    } else if (!this.isValidEmail(this.editedPersonal.email)) {
      this.emailError = 'Format email invalide';
      isValid = false;
    }

    // Validate phone (if provided)
    if (
      this.editedPersonal.phone &&
      this.editedPersonal.phone.trim() !== '' &&
      !this.isValidPhone(this.editedPersonal.phone)
    ) {
      this.phoneError = 'Format de téléphone invalide';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    // Basic phone validation - adjust as needed
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
  }

  togglePasswordReset() {
    // The resetPassword value is already toggled by ngModel
    if (this.resetPassword) {
      this.generatePassword();
    } else {
      this.newPassword = '';
      this.passwordVisible = false;
    }
  }

  generatePassword() {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    this.newPassword = password;
  }

  regeneratePassword() {
    this.generatePassword();
    this.toast.success('Nouveau mot de passe généré!');
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  copyPassword() {
    if (navigator.clipboard && this.newPassword) {
      navigator.clipboard.writeText(this.newPassword).then(() => {
        this.toast.success('Mot de passe copié dans le presse-papiers!');
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
