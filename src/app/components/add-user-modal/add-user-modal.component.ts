import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotToastService } from '@ngneat/hot-toast';
import { UserService } from '../../services/user.service';

interface NewUser {
  phoneNumber: string;
  name: string;
  email?: string;
}

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user-modal.component.html',
  styleUrl: './add-user-modal.component.css',
})
export class AddUserModalComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  toast = inject(HotToastService);
  @Input() isOpen = false;
  @Output() confirmAdd = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  el = inject(ElementRef);
  newUser: NewUser = {
    phoneNumber: '',
    name: '',
    email: '',
  };

  phoneDigits = '';
  isSubmitting = false;
  phoneError = '';
  nameError = '';
  emailError = '';

  ngOnInit() {
    document.body.appendChild(this.el.nativeElement);
    this.resetForm();
  }
  ngOnDestroy() {
    // Clean up when component destroyed
    if (document.body.contains(this.el.nativeElement)) {
      document.body.removeChild(this.el.nativeElement);
    }
  }

  validateForm(): boolean {
    this.phoneError = '';
    this.nameError = '';
    this.emailError = '';
    let isValid = true;

    // Validate phone number
    if (!this.newUser.phoneNumber) {
      this.phoneError = 'Le numéro de téléphone est requis';
      isValid = false;
    } else if (!this.isValidPhoneNumber(this.newUser.phoneNumber)) {
      this.phoneError = 'Le numéro doit contenir exactement 8 chiffres';
      isValid = false;
    }

    // Validate name
    if (!this.newUser.name) {
      this.nameError = 'Le nom est requis';
      isValid = false;
    }

    // Validate email (optional but if provided, must be valid)
    if (this.newUser.email && !this.isValidEmail(this.newUser.email)) {
      this.emailError = 'Email invalide';
      isValid = false;
    }

    return isValid;
  }

  isValidPhoneNumber(phone: string): boolean {
    // Tunisia phone number format: +216 followed by exactly 8 digits
    const phoneRegex = /^\+216[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onPhoneInput(event: any): void {
    const input = event.target.value;

    // Remove all non-numeric characters
    const digitsOnly = input.replace(/\D/g, '');

    // Limit to 8 digits
    const truncated = digitsOnly.substring(0, 8);

    // Update the display
    this.phoneDigits = this.formatPhoneInput(truncated);

    // Update the actual phone number for the user object
    this.newUser.phoneNumber = truncated ? `+216${truncated}` : '';

    // Clear phone error when user starts typing
    if (this.phoneError && truncated.length > 0) {
      this.phoneError = '';
    }
  }

  onPhoneKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    const currentDigits = target.value.replace(/\D/g, '');

    // Allow: backspace, delete, tab, escape, enter, arrow keys, home, end
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow navigation keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Only allow numbers 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevent input if already at 8 digits (unless deleting)
    if (currentDigits.length >= 8) {
      event.preventDefault();
    }
  }

  formatPhoneInput(digits: string): string {
    if (!digits) return '';

    // Format as XX XXX XXX
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return digits.substring(0, 2) + ' ' + digits.substring(2);
    } else {
      return (
        digits.substring(0, 2) +
        ' ' +
        digits.substring(2, 5) +
        ' ' +
        digits.substring(5, 8)
      );
    }
  }

  formatPhoneDisplay(digits: string): string {
    const cleanDigits = digits.replace(/\D/g, '');
    if (!cleanDigits) return '';

    return `+216 ${this.formatPhoneInput(cleanDigits)}`;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.userService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.toast.success('Utilisateur créé avec succès !');
        this.confirmAdd.emit(user);
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating user:', error);

        if (error.error?.message === 'Phone number already exists') {
          this.phoneError = 'Ce numéro de téléphone est déjà utilisé';
          this.toast.error('Ce numéro de téléphone est déjà utilisé.');
        } else if (error.error?.message === 'Email already exists') {
          this.emailError = 'Cette adresse e-mail est déjà utilisée';
          this.toast.error('Cette adresse e-mail est déjà utilisée.');
        } else {
          this.toast.error("Erreur lors de la création de l'utilisateur");
        }
      },
    });
  }

  onCancel() {
    this.close.emit();
    this.resetForm();
  }

  resetForm() {
    this.newUser = {
      phoneNumber: '',
      name: '',
      email: '',
    };
    this.phoneDigits = '';
    this.isSubmitting = false;
    this.phoneError = '';
    this.nameError = '';
    this.emailError = '';
  }

  onModalOpen() {
    if (this.isOpen) {
      this.resetForm();
    }
  }
}
