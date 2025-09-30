import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styles: `
    .login-container {
      min-height: 100vh;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .login-card {
      background: #1a1a1a;
      border-radius: 20px;
      padding: 40px 30px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(195, 255, 0, 0.1);
    }

    .logo-container {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      width: 120px;
      height: 120px;
      margin: 0 auto;
      background: #c3ff00;
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 20px;
    }

    h2 {
      color: #e5e5e5;
      font-size: 28px;
      margin: 0;
      text-align: center;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #b3b3b3;
      font-weight: 500;
      font-size: 14px;
    }

    input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #2a2a2a;
      border-radius: 10px;
      font-size: 16px;
      transition: all 0.3s;
      box-sizing: border-box;
      background: #0a0a0a;
      color: #e5e5e5;
    }

    input:focus {
      outline: none;
      border-color: #c3ff00;
      box-shadow: 0 0 0 3px rgba(195, 255, 0, 0.1);
    }

    input.error {
      border-color: #f44336;
    }

    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 5px;
    }

    button {
      width: 100%;
      padding: 14px;
      background: #c3ff00;
      color: #0a0a0a;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(195, 255, 0, 0.3);
      background: #b3ee00;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-error {
      background: rgba(244, 67, 54, 0.1);
      color: #ff6b6b;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 14px;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 30px 20px;
      }
    }
  `
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
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
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
      }
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