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

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
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
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
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

  get passwordError() {
    const control = this.loginForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Mot de passe requis';
      if (control.errors['minlength']) return 'Minimum 6 caractères';
    }
    return '';
  }
}
