import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from '../../models/subscription.model';

@Component({
  selector: 'app-subscription-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-card.component.html',
  styles: `
    .subscription-card {
      background: #1a1a1a;
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 15px;
      color: #e5e5e5;
      position: relative;
      border: 1px solid #2a2a2a;
    }

    .subscription-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }

    .subscription-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
    }

    .subscription-icon {
      width: 30px;
      height: 30px;
      background: #c3ff00;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #000;
    }

    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-pending {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
      border: 1px solid #ffc107;
    }

    .status-active {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
      border: 1px solid #4caf50;
    }

    .status-inactive {
      background: rgba(158, 158, 158, 0.2);
      color: #9e9e9e;
      border: 1px solid #9e9e9e;
    }

    .status-canceled {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
      border: 1px solid #f44336;
    }

    .status-expired {
      background: rgba(255, 87, 34, 0.2);
      color: #ff5722;
      border: 1px solid #ff5722;
    }

    .subscription-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .detail-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      font-weight: 600;
    }

    .detail-value {
      font-size: 14px;
      color: #e5e5e5;
    }

    .usage-section {
      margin-bottom: 15px;
    }

    .usage-bar {
      width: 100%;
      height: 8px;
      background: #2a2a2a;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }

    .usage-progress {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #c3ff00);
      transition: width 0.3s ease;
    }

    .usage-progress.warning {
      background: linear-gradient(90deg, #ff9800, #ff5722);
    }

    .usage-progress.danger {
      background: linear-gradient(90deg, #f44336, #d32f2f);
    }

    .usage-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 5px;
      font-size: 12px;
    }

    .usage-text {
      color: #888;
    }

    .usage-percentage {
      color: #c3ff00;
      font-weight: 600;
    }

    .subscription-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-activate {
      background: #4caf50;
      color: white;
    }

    .btn-deactivate {
      background: #ff9800;
      color: white;
    }

    .btn-cancel {
      background: transparent;
      color: #f44336;
      border: 1px solid #f44336;
    }

    .btn-renew {
      background: #2196f3;
      color: white;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .renewal-info {
      background: #0d1117;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #21262d;
    }

    .renewal-label {
      font-size: 12px;
      color: #c3ff00;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .renewal-date {
      font-size: 14px;
      color: #e5e5e5;
    }

    .edit-btn {
      background: #2196f3;
      color: white;
      margin-right: 10px;
    }

    .edit-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .edit-modal {
      background: #1a1a1a;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid #2a2a2a;
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
      color: #c3ff00;
      font-size: 18px;
    }

    .close-btn {
      background: none;
      border: none;
      color: #999;
      font-size: 20px;
      cursor: pointer;
      padding: 5px;
    }

    .close-btn:hover {
      color: #e5e5e5;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #c3ff00;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .form-input {
      width: 100%;
      padding: 12px;
      background: #0a0a0a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #e5e5e5;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #c3ff00;
      box-shadow: 0 0 0 2px rgba(195, 255, 0, 0.2);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #2a2a2a;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .cancel-btn {
      background: transparent;
      color: #999;
      border: 1px solid #2a2a2a;
    }

    .cancel-btn:hover {
      background: #2a2a2a;
      color: #e5e5e5;
    }

    .save-btn {
      background: #c3ff00;
      color: #0a0a0a;
    }

    .save-btn:hover:not(:disabled) {
      background: #a8d100;
    }

    .save-btn:disabled {
      background: #666;
      color: #999;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .subscription-details {
        grid-template-columns: 1fr;
      }

      .edit-modal {
        width: 95%;
        margin: 10px;
      }

      .subscription-actions {
        flex-direction: column;
        gap: 10px;
      }

      .action-btn {
        width: 100%;
      }
    }
  `
})
export class SubscriptionCardComponent {
  @Input() subscription!: Subscription;
  @Input() userRole: string = 'admin';
  @Output() statusChange = new EventEmitter<{subscriptionId: string, status: string}>();
  @Output() subscriptionUpdate = new EventEmitter<{subscriptionId: string, updateData: Partial<Subscription>}>();

  isEditing = false;
  editForm = {
    price: 0,
    allowedBookingsPerMonth: 0,
    renewalType: 'auto' as 'auto' | 'manual',
    status: 'pending' as 'pending' | 'active' | 'inactive' | 'canceled' | 'expired'
  };

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getUsagePercentage(): number {
    if (this.subscription.allowedBookingsPerMonth === 0) return 0;
    return Math.round((this.subscription.used / this.subscription.allowedBookingsPerMonth) * 100);
  }

  getUsageClass(): string {
    const percentage = this.getUsagePercentage();
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return '';
  }

  getRemainingBookings(): number {
    return Math.max(0, this.subscription.allowedBookingsPerMonth - this.subscription.used);
  }

  isExpiringSoon(): boolean {
    const renewalDate = new Date(this.subscription.renewalDate);
    const now = new Date();
    const daysDiff = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return daysDiff <= 7 && daysDiff >= 0;
  }

  isExpired(): boolean {
    const renewalDate = new Date(this.subscription.renewalDate);
    const now = new Date();
    return renewalDate < now;
  }

  getAvailableActions(): {label: string, status: string, class: string}[] {
    const actions = [];

    switch (this.subscription.status) {
      case 'pending':
        actions.push(
          { label: 'Activer', status: 'active', class: 'btn-activate' },
          { label: 'Annuler', status: 'canceled', class: 'btn-cancel' }
        );
        break;
      case 'active':
        actions.push(
          { label: 'Désactiver', status: 'inactive', class: 'btn-deactivate' },
          { label: 'Annuler', status: 'canceled', class: 'btn-cancel' }
        );
        break;
      case 'inactive':
        actions.push(
          { label: 'Activer', status: 'active', class: 'btn-activate' },
          { label: 'Annuler', status: 'canceled', class: 'btn-cancel' }
        );
        break;
      case 'expired':
        actions.push(
          { label: 'Renouveler', status: 'active', class: 'btn-renew' },
          { label: 'Annuler', status: 'canceled', class: 'btn-cancel' }
        );
        break;
    }

    return actions;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      // Initialize form with current values
      this.editForm = {
        price: this.subscription.price,
        allowedBookingsPerMonth: this.subscription.allowedBookingsPerMonth,
        renewalType: this.subscription.renewalType,
        status: this.subscription.status
      };
    }
  }

  isFormValid(): boolean {
    return this.editForm.price > 0 &&
           this.editForm.allowedBookingsPerMonth > 0;
  }

  saveChanges(): void {
    if (this.isFormValid()) {
      const updateData: Partial<Subscription> = {
        price: this.editForm.price,
        allowedBookingsPerMonth: this.editForm.allowedBookingsPerMonth,
        renewalType: this.editForm.renewalType,
        status: this.editForm.status
      };

      this.subscriptionUpdate.emit({
        subscriptionId: this.subscription._id!,
        updateData: updateData
      });

      this.isEditing = false;
    }
  }

  onActionClick(status: string): void {
    this.statusChange.emit({ subscriptionId: this.subscription._id!, status });
  }
}