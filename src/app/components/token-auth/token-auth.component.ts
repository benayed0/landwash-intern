import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-token-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="token-auth-container">
      <div class="auth-content">
        <div class="logo-section">
          <img src="assets/logo.png" class="logo" alt="Landwash Logo" />
          <h1>Landwash Admin</h1>
        </div>

        <div class="status-section">
          @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Authentification en cours...</p>
          </div>
          } @if (errorMessage) {
          <div class="error-state">
            <div class="error-icon">❌</div>
            <h3>Erreur d'authentification</h3>
            <p>{{ errorMessage }}</p>
            <button class="retry-btn" (click)="goToLogin()">
              Retour à la connexion
            </button>
          </div>
          } @if (successMessage) {
          <div class="success-state">
            <div class="success-icon">✅</div>
            <h3>Authentification réussie</h3>
            <p>{{ successMessage }}</p>
            <p class="redirect-text">Redirection en cours...</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .token-auth-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #0a0a0a 0%, #121212 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .auth-content {
      background: rgba(26, 26, 26, 0.95);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      width: 100%;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }

    .logo-section {
      margin-bottom: 40px;
    }

    .logo {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    h1 {
      color: #c3ff00;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }

    .status-section {
      color: #e5e5e5;
    }

    .loading-state {
      padding: 30px 0;
    }

    .spinner {
      border: 3px solid rgba(195, 255, 0, 0.3);
      border-radius: 50%;
      border-top: 3px solid #c3ff00;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-state,
    .success-state {
      padding: 20px 0;
    }

    .error-icon,
    .success-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h3 {
      color: #e5e5e5;
      font-size: 20px;
      margin: 0 0 12px 0;
    }

    p {
      color: #aaa;
      font-size: 16px;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }

    .redirect-text {
      color: #c3ff00;
      font-weight: 600;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .retry-btn {
      background: #c3ff00;
      color: #0a0a0a;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 10px;
    }

    .retry-btn:hover {
      background: #a8d400;
      transform: translateY(-2px);
    }

    .retry-btn:active {
      transform: scale(0.95);
    }

    @media (max-width: 480px) {
      .auth-content {
        padding: 30px 20px;
      }

      .logo {
        width: 60px;
        height: 60px;
      }

      h1 {
        font-size: 24px;
      }
    }
  `,
})
export class TokenAuthComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = true;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    // Set WebView mode using AuthService
    this.authService.setWebViewMode(true);

    // Get token from query parameters
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.authenticateWithToken(token);
      } else {
        this.handleError('Aucun token fourni');
      }
    });
  }

  private authenticateWithToken(token: string) {
    if (!this.isValidTokenFormat(token)) {
      this.handleError('Format de token invalide');
      return;
    }

    // Use AuthService to authenticate with token
    this.authService.authenticateWithToken(token).subscribe({
      next: (user) => {
        if (user) {
          this.isLoading = false;
          this.successMessage = `Bienvenue ${
            user.name || user.email
          }! Redirection...`;
          // AuthService will handle the redirect automatically
        } else {
          this.handleError("Échec de l'authentification");
        }
      },
      error: (error) => {
        console.error('Authentication error:', error);
        this.handleError("Erreur lors de l'authentification");
      },
    });
  }

  private isValidTokenFormat(token: string): boolean {
    // Basic token validation - you can enhance this based on your token format
    return (
      token !== undefined && token.length > 10 && typeof token === 'string'
    );
  }

  private handleError(message: string) {
    this.isLoading = false;
    this.errorMessage = message;
    console.error('Token authentication error:', message);
  }

  goToLogin() {
    // Clear WebView mode and redirect to normal login
    this.authService.setWebViewMode(false);
    this.router.navigate(['/login']);
  }
}
