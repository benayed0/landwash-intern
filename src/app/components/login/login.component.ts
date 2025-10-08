import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  loginMode: 'email' | 'phone' = 'email';

  constructor() {
    this.loginForm = this.fb.group({
      email: [''],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.setLoginMode('email');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  switchLoginMode(mode: 'email' | 'phone') {
    if (this.loginMode === mode) {
      return;
    }
    this.setLoginMode(mode);
    this.error = '';
  }

  private setLoginMode(mode: 'email' | 'phone') {
    this.loginMode = mode;
    const emailControl = this.loginForm.get('email');
    const phoneControl = this.loginForm.get('phone');

    if (mode === 'email') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.clearValidators();
      phoneControl?.setValue('', { emitEvent: false });
      phoneControl?.setErrors(null);
    } else {
      phoneControl?.setValidators([Validators.required, this.phoneValidator]);
      emailControl?.clearValidators();
      emailControl?.setValue('', { emitEvent: false });
      emailControl?.setErrors(null);
    }

    emailControl?.markAsPristine();
    emailControl?.markAsUntouched();
    emailControl?.updateValueAndValidity();
    phoneControl?.markAsPristine();
    phoneControl?.markAsUntouched();
    phoneControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control && control.errors) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading = true;
    this.error = '';
    const { email, phone, password } = this.loginForm.value;

    let loginField = '';
    if (this.loginMode === 'email') {
      loginField = email;
    } else {
      const phoneDigits = (phone || '').replace(/\D/g, '');
      loginField = `+216${phoneDigits}`;
    }

    this.authService.login(loginField, this.loginMode, password).subscribe({
      next: (response) => {
        // Wait for user data to be loaded, then navigate
        setTimeout(() => {
          this.loading = false;
          const user = this.authService.getCurrentUser();
          if (user?.role === 'admin') {
            this.router.navigate(['/dashboard']);
          } else if (user?.role === 'worker') {
            this.router.navigate(['/worker-dashboard']);
          } else {
            // Default fallback
            this.router.navigate(['/dashboard']);
          }
        }, 500); // Small delay to ensure user data is loaded
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Email ou mot de passe incorrect';
      },
    });
  }

  get emailError() {
    const control = this.loginForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Email requis';
      if (control.errors['email']) return 'Email invalide';
    }
    return '';
  }

  get phoneError() {
    const control = this.loginForm.get('phone');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Numéro de téléphone requis';
      if (control.errors['invalidPhone'])
        return 'Numéro invalide (8 chiffres requis)';
    }
    return '';
  }

  get passwordError() {
    const control = this.loginForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Mot de passe requis';
      if (control.errors['minlength']) return 'Minimum 6 caractères';
    }
    return '';
  }

  formatPhoneNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value || '';
    let digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length > 8) {
      digitsOnly = digitsOnly.substring(0, 8);
    }

    let formatted = '';
    if (digitsOnly.length > 0) {
      formatted = digitsOnly.substring(0, 2);
      if (digitsOnly.length > 2) {
        formatted += ' ' + digitsOnly.substring(2, 5);
      }
      if (digitsOnly.length > 5) {
        formatted += ' ' + digitsOnly.substring(5, 8);
      }
    }

    this.loginForm.get('phone')?.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  private phoneValidator(control: any) {
    const value = (control.value || '').replace(/\D/g, '');
    if (!value) {
      return { invalidPhone: true };
    }
    return value.length === 8 ? null : { invalidPhone: true };
  }
}
