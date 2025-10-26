import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '../../../models/order.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { DeliveryDateDialogComponent } from '../delivery-date-dialog/delivery-date-dialog.component';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css'],
})
export class OrderCardComponent {
  private dialog = inject(MatDialog);

  private _order = signal<Order | undefined>(undefined);

  @Input()
  set order(value: Order) {
    this._order.set(value);
  }
  get order(): Order {
    return this._order()!;
  }

  @Input() userRole: string = 'admin';
  @Output() statusChange = new EventEmitter<{
    orderId: string;
    status: string;
    estimatedDeliveryDate?: string;
  }>();

  // Computed signal for available actions - only recalculates when order changes
  availableActions = computed(() => {
    const order = this._order();
    if (!order) return [];

    const actions = [];

    switch (order.status) {
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
  });

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

  onActionClick(action: {
    label: string;
    status: string;
    class: string;
  }): void {
    console.log(action);

    // If the action is to ship, show delivery date dialog
    if (action.status === 'shipped') {
      this.openDeliveryDateDialog(action);
    } else {
      this.openConfirmDialog(action);
    }
  }

  private openConfirmDialog(action: {
    label: string;
    status: string;
    class: string;
  }): void {
    // Generate context-aware message based on current status and target status
    let message = '';
    console.log(action);

    if (action.class === 'btn-revert') {
      // For revert actions, use specific messages
      if (action.status === 'pending') {
        message =
          'Êtes-vous sûr de vouloir remettre cette commande en attente ?';
      } else if (action.status === 'confirmed') {
        message =
          "Êtes-vous sûr de vouloir remettre cette commande à l'état confirmé ?";
      } else if (action.status === 'shipped') {
        message =
          "Êtes-vous sûr de vouloir remettre cette commande à l'état expédié ?";
      }
    } else {
      // For forward progression actions
      const statusMessages: { [key: string]: string } = {
        confirmed: 'Êtes-vous sûr de vouloir confirmer cette commande ?',
        cancelled:
          '⚠️ Êtes-vous sûr de vouloir annuler cette commande ? Cette action peut être inversée.',
        shipped:
          'Êtes-vous sûr de vouloir marquer cette commande comme expédiée ?',
        delivered:
          'Êtes-vous sûr de vouloir marquer cette commande comme livrée ?',
        completed: 'Êtes-vous sûr de vouloir terminer cette commande ?',
      };

      message =
        statusMessages[action.status] ||
        'Êtes-vous sûr de vouloir effectuer cette action ?';
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: {
        title: "Confirmer l'action",
        message: message,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        isDanger: action.status === 'cancelled',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.statusChange.emit({
          orderId: this.order._id!,
          status: action.status,
        });
      }
    });
  }

  private openDeliveryDateDialog(action: {
    label: string;
    status: string;
    class: string;
  }): void {
    const dialogRef = this.dialog.open(DeliveryDateDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {},
    });

    dialogRef.afterClosed().subscribe((deliveryDate) => {
      if (deliveryDate) {
        this.statusChange.emit({
          orderId: this.order._id!,
          status: action.status,
          estimatedDeliveryDate: deliveryDate,
        });
      }
    });
  }
}
