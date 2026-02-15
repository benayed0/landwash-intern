import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mail-action',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="action-container">
      <div class="action-content">
        <div class="logo-section">
          <img src="assets/logo.png" class="logo" alt="Landwash Logo" />
          <h1>LandWash</h1>
        </div>

        <div class="status-section">
          @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Traitement en cours...</p>
          </div>
          } @else {
          <div class="result-state">
            <div class="result-icon" [class]="iconClass">{{ displayIcon }}</div>
            <h3>{{ heading }}</h3>
            <p>{{ message }}</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .action-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #0a0a0a 0%, #121212 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .action-content {
      background: rgba(26, 26, 26, 0.95);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 450px;
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

    .result-state {
      padding: 20px 0;
    }

    .result-icon {
      font-size: 56px;
      margin-bottom: 20px;
    }

    .result-icon.icon-success {
      filter: drop-shadow(0 0 12px rgba(195, 255, 0, 0.5));
    }

    .result-icon.icon-error {
      filter: drop-shadow(0 0 12px rgba(255, 71, 87, 0.5));
    }

    .result-icon.icon-info {
      filter: drop-shadow(0 0 12px rgba(100, 180, 255, 0.5));
    }

    .result-icon.icon-lock {
      filter: drop-shadow(0 0 12px rgba(255, 165, 0, 0.5));
    }

    h3 {
      color: #e5e5e5;
      font-size: 22px;
      margin: 0 0 16px 0;
    }

    p {
      color: #aaa;
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
    }

    @media (max-width: 480px) {
      .action-content {
        padding: 30px 20px;
      }

      .logo {
        width: 60px;
        height: 60px;
      }

      h1 {
        font-size: 24px;
      }

      h3 {
        font-size: 18px;
      }
    }
  `,
})
export class MailActionComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  isLoading = true;
  heading = '';
  message = '';
  displayIcon = '';
  iconClass = '';

  private readonly iconMap: Record<string, { emoji: string; css: string }> = {
    success: { emoji: '\u2705', css: 'icon-success' },
    error: { emoji: '\u274C', css: 'icon-error' },
    info: { emoji: '\u2139\uFE0F', css: 'icon-info' },
    lock: { emoji: '\uD83D\uDD12', css: 'icon-lock' },
    rejected: { emoji: '\u274C', css: 'icon-error' },
    cancelled: { emoji: '\u274C', css: 'icon-error' },
  };

  ngOnInit() {
    const entity = this.route.snapshot.data['entity'];
    const action = this.route.snapshot.data['action'];
    const id = this.route.snapshot.params['id'];
    const teamId = this.route.snapshot.params['teamId'];
    const token = this.route.snapshot.queryParams['token'];

    let url = `${environment.apiUrl}/mail/actions/${entity}/${id}/${action}`;
    if (teamId) url += `/${teamId}`;

    this.http.get<{ success: boolean; heading: string; message: string; icon: string }>(url, {
      params: { token },
    }).subscribe({
      next: (res) => {
        this.heading = res.heading;
        this.message = res.message;
        const mapped = this.iconMap[res.icon] || this.iconMap['info'];
        this.displayIcon = mapped.emoji;
        this.iconClass = mapped.css;
        this.isLoading = false;
      },
      error: () => {
        this.heading = 'Une Erreur est Survenue';
        this.message = 'Impossible de traiter cette action. Veuillez réessayer via l\'application.';
        this.displayIcon = '\u274C';
        this.iconClass = 'icon-error';
        this.isLoading = false;
      },
    });
  }
}
