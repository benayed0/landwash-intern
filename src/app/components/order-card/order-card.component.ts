import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../models/order.model';

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
  }>();

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
          { label: 'Confirmer', status: 'confirmed', class: 'btn-confirm' },
          { label: 'Annuler', status: 'cancelled', class: 'btn-cancel' }
        );
        break;
      case 'confirmed':
        actions.push(
          { label: 'Expédier', status: 'shipped', class: 'btn-ship' },
          { label: 'Annuler', status: 'cancelled', class: 'btn-cancel' }
        );
        break;
      case 'shipped':
        actions.push({
          label: 'Livrer',
          status: 'delivered',
          class: 'btn-deliver',
        });
        break;
      case 'delivered':
        actions.push({
          label: 'Terminer',
          status: 'completed',
          class: 'btn-complete',
        });
        break;
    }

    return actions;
  }

  onActionClick(status: string): void {
    this.statusChange.emit({ orderId: this.order._id!, status });
  }
}
