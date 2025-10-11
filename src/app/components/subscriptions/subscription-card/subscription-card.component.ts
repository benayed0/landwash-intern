import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from '../../../models/subscription.model';

@Component({
  selector: 'app-subscription-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-card.component.html',
  styleUrls: ['./subscription-card.component.css'],
})
export class SubscriptionCardComponent {
  @Input() subscription!: Subscription;
  @Input() userRole: string = 'admin';
  @Output() statusChange = new EventEmitter<{
    subscriptionId: string;
    status: string;
  }>();
  @Output() subscriptionUpdate = new EventEmitter<{
    subscriptionId: string;
    updateData: Partial<Subscription>;
  }>();

  isEditing = false;
  editForm = {
    price: 0,
    allowedBookingsPerMonth: 0,
    renewalType: 'auto' as 'auto' | 'manual',
    status: 'pending' as
      | 'pending'
      | 'active'
      | 'inactive'
      | 'canceled'
      | 'expired',
  };

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getUsagePercentage(): number {
    if (this.subscription.allowedBookingsPerMonth === 0) return 0;
    return Math.round(
      (this.subscription.used / this.subscription.allowedBookingsPerMonth) * 100
    );
  }

  getUsageClass(): string {
    const percentage = this.getUsagePercentage();
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return '';
  }

  getRemainingBookings(): number {
    return Math.max(
      0,
      this.subscription.allowedBookingsPerMonth - this.subscription.used
    );
  }

  isExpiringSoon(): boolean {
    const renewalDate = new Date(this.subscription.renewalDate);
    const now = new Date();
    const daysDiff = Math.ceil(
      (renewalDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );
    return daysDiff <= 7 && daysDiff >= 0;
  }

  isExpired(): boolean {
    const renewalDate = new Date(this.subscription.renewalDate);
    const now = new Date();
    return renewalDate < now;
  }

  getAvailableActions(): { label: string; status: string; class: string }[] {
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
        status: this.subscription.status,
      };
    }
  }

  isFormValid(): boolean {
    return this.editForm.price > 0 && this.editForm.allowedBookingsPerMonth > 0;
  }

  saveChanges(): void {
    if (this.isFormValid()) {
      const updateData: Partial<Subscription> = {
        price: this.editForm.price,
        allowedBookingsPerMonth: this.editForm.allowedBookingsPerMonth,
        renewalType: this.editForm.renewalType,
        status: this.editForm.status,
      };

      this.subscriptionUpdate.emit({
        subscriptionId: this.subscription._id!,
        updateData: updateData,
      });

      this.isEditing = false;
    }
  }

  onActionClick(status: string): void {
    this.statusChange.emit({ subscriptionId: this.subscription._id!, status });
  }
}
