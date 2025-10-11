import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css'],
})
export class OrderCardComponent {
  @Input() order!: Order;
  @Input() userRole: string = 'admin';
  @Output() statusChange = new EventEmitter<{
    orderId: string;
    status: string;
    estimatedDeliveryDate?: string;
  }>();

  showDeliveryDateModal = false;
  estimatedDeliveryDate = '';
  showConfirmDialog = false;
  pendingAction: { label: string; status: string; class: string } | null = null;

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getAvailableActions(): { label: string; status: string; class: string }[] {
    const actions = [];

    switch (this.order.status) {
      case 'pending':
        actions.push(
          { label: '✓ Confirmer', status: 'confirmed', class: 'btn-confirm' },
          { label: '✗ Annuler', status: 'cancelled', class: 'btn-cancel' }
        );
        break;
      case 'confirmed':
        actions.push(
          { label: '📦 Expédier', status: 'shipped', class: 'btn-ship' },
          {
            label: '↩️ Retour en attente',
            status: 'pending',
            class: 'btn-revert',
          },
          { label: '✗ Annuler', status: 'cancelled', class: 'btn-cancel' }
        );
        break;
      case 'shipped':
        actions.push(
          { label: '🚚 Livrer', status: 'delivered', class: 'btn-deliver' },
          {
            label: '↩️ Retour confirmé',
            status: 'confirmed',
            class: 'btn-revert',
          }
        );
        break;
      case 'delivered':
        actions.push(
          { label: '✓ Terminer', status: 'completed', class: 'btn-complete' },
          { label: '↩️ Retour expédié', status: 'shipped', class: 'btn-revert' }
        );
        break;
      case 'cancelled':
        actions.push({
          label: '↩️ Retour en attente',
          status: 'pending',
          class: 'btn-revert',
        });
        break;
    }

    return actions;
  }

  onActionClick(action: {
    label: string;
    status: string;
    class: string;
  }): void {
    // Store the pending action and show confirm dialog
    this.pendingAction = action;

    // If the action is to ship, show delivery date modal instead of confirm dialog
    if (action.status === 'shipped') {
      this.showDeliveryDateModal = true;
    } else {
      this.showConfirmDialog = true;
    }
  }

  onConfirmAction(): void {
    if (this.pendingAction) {
      this.statusChange.emit({
        orderId: this.order._id!,
        status: this.pendingAction.status,
      });
      this.closeConfirmDialog();
    }
  }

  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.pendingAction = null;
  }

  getConfirmMessage(): string {
    if (!this.pendingAction) return '';

    const statusMessages: { [key: string]: string } = {
      confirmed: 'Êtes-vous sûr de vouloir confirmer cette commande ?',
      cancelled:
        '⚠️ Êtes-vous sûr de vouloir annuler cette commande ? Cette action peut être inversée.',
      shipped:
        'Êtes-vous sûr de vouloir marquer cette commande comme expédiée ?',
      delivered:
        'Êtes-vous sûr de vouloir marquer cette commande comme livrée ?',
      completed: 'Êtes-vous sûr de vouloir terminer cette commande ?',
      pending: 'Êtes-vous sûr de vouloir remettre cette commande en attente ?',
    };

    return (
      statusMessages[this.pendingAction.status] ||
      'Êtes-vous sûr de vouloir effectuer cette action ?'
    );
  }

  onConfirmWithDeliveryDate(): void {
    if (this.estimatedDeliveryDate) {
      this.statusChange.emit({
        orderId: this.order._id!,
        status: 'shipped',
        estimatedDeliveryDate: this.estimatedDeliveryDate,
      });
      this.closeDeliveryDateModal();
    }
  }

  closeDeliveryDateModal(): void {
    this.showDeliveryDateModal = false;
    this.estimatedDeliveryDate = '';
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
