import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-price-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="cancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Confirmer la complétion</h3>
          <button class="close-btn" (click)="cancel()">✕</button>
        </div>

        <div class="modal-body">
          <div class="booking-info">
            <div class="info-row">
              <span class="label">Type:</span>
              <span class="value">
                {{ getVehicleTypeLabel(booking?.type || '') }}
                @if(booking?.type === 'salon' && booking?.salonsSeats){

                <span class="salon-seats">
                  ({{ booking?.salonsSeats }} sièges)
                </span>
                }
              </span>
            </div>
            <div class="info-row">
              <span class="label">Client:</span>
              <span class="value">{{
                booking?.userId?.name || booking?.userId?.email || 'N/A'
              }}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">{{ formatDate(booking?.date) }}</span>
            </div>
            <div class="info-row" *ngIf="isTeamObject(booking?.teamId)">
              <span class="label">Équipe:</span>
              <span class="value team-name">
                {{ getTeamName(booking?.teamId) }}
                <span class="team-chief" *ngIf="getTeamChief(booking?.teamId)">
                  (Chef: {{ getTeamChief(booking?.teamId) }})
                </span>
              </span>
            </div>
          </div>

          <div class="price-section">
            <label for="final-price">Prix final:</label>
            <div class="price-input-group">
              <input
                id="final-price"
                type="number"
                class="price-input"
                [(ngModel)]="finalPrice"
                min="0"
                step="10"
                (keyup.enter)="confirm()"
              />
              <span class="currency">DT</span>
            </div>
            <div
              class="original-price"
              *ngIf="booking && finalPrice !== booking.price"
            >
              Prix original: {{ booking.price }} DT
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" (click)="cancel()">Annuler</button>
          <button class="btn btn-confirm" (click)="confirm()">
            Marquer comme terminé
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: #1a1a1a;
      border-radius: 15px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(195, 255, 0, 0.2);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #2a2a2a;
    }

    .modal-header h3 {
      margin: 0;
      color: #e5e5e5;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      color: #999;
      font-size: 24px;
      cursor: pointer;
      transition: color 0.2s;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #e5e5e5;
    }

    .modal-body {
      padding: 20px;
    }

    .booking-info {
      background: #0a0a0a;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      color: #e5e5e5;
      font-size: 14px;
    }

    .info-row:not(:last-child) {
      border-bottom: 1px solid #2a2a2a;
    }

    .label {
      color: #999;
      font-weight: 500;
    }

    .value {
      color: #e5e5e5;
      text-align: right;
    }

    .value.team-name {
      color: #c3ff00;
    }

    .team-chief {
      color: #aaa;
      font-size: 12px;
      margin-left: 5px;
    }

    .price-section {
      margin-top: 20px;
    }

    .price-section label {
      display: block;
      color: #e5e5e5;
      margin-bottom: 10px;
      font-weight: 500;
      font-size: 16px;
    }

    .price-input-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .price-input {
      flex: 1;
      padding: 12px 15px;
      background: #0a0a0a;
      border: 2px solid #c3ff00;
      border-radius: 10px;
      color: #c3ff00;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      transition: all 0.3s;
    }

    .price-input:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(195, 255, 0, 0.2);
      transform: scale(1.02);
    }

    .currency {
      color: #c3ff00;
      font-size: 20px;
      font-weight: bold;
    }

    .original-price {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
      text-align: center;
    }

    .modal-footer {
      display: flex;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #2a2a2a;
    }

    .btn {
      flex: 1;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-cancel {
      background: #2a2a2a;
      color: #999;
    }

    .btn-cancel:hover {
      background: #333;
      color: #e5e5e5;
    }

    .btn-confirm {
      background: #c3ff00;
      color: #0a0a0a;
    }

    .btn-confirm:hover {
      background: #b3ee00;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(195, 255, 0, 0.3);
    }

    @media (max-width: 480px) {
      .modal-content {
        max-width: 100%;
      }

      .price-input {
        font-size: 20px;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `,
})
export class PriceConfirmModalComponent {
  @Input() booking: Booking | null = null;
  @Input() isOpen = false;
  @Output() confirmComplete = new EventEmitter<{ booking: Booking; price: number }>();
  @Output() close = new EventEmitter<void>();

  finalPrice = 0;

  ngOnChanges() {
    if (this.booking && this.isOpen) {
      this.finalPrice = this.booking.price;
    }
  }

  getVehicleTypeLabel(type: string): string {
    const labels: any = {
      small: 'Citadines / Petites Voitures',
      big: 'SUV / Grandes Voitures',
      salon: 'Salon',
    };
    return labels[type] || type;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  isTeamObject(teamId: any): boolean {
    return teamId && typeof teamId === 'object' && teamId.name;
  }

  getTeamName(teamId: any): string {
    if (this.isTeamObject(teamId)) {
      return teamId.name;
    }
    return '';
  }

  getTeamChief(teamId: any): string {
    if (this.isTeamObject(teamId) && teamId.chiefId?.name) {
      return teamId.chiefId.name;
    }
    return '';
  }

  confirm() {
    if (this.booking?._id && this.finalPrice > 0) {
      this.confirmComplete.emit({
        booking: this.booking,
        price: this.finalPrice,
      });
      this.close.emit();
    }
  }

  cancel() {
    this.close.emit();
  }
}
