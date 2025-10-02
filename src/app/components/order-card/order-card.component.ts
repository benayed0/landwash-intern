import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-card.component.html',
  styles: `
    .order-card {
      background: #1a1a1a;
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 15px;
      color: #e5e5e5;
      position: relative;
      border: 1px solid #2a2a2a;
    }

    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }

    .order-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
    }

    .order-icon {
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

    .status-confirmed {
      background: rgba(0, 123, 255, 0.2);
      color: #007bff;
      border: 1px solid #007bff;
    }

    .status-shipped {
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
      border: 1px solid #ff9800;
    }

    .status-delivered {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
      border: 1px solid #4caf50;
    }

    .status-completed {
      background: rgba(195, 255, 0, 0.2);
      color: #c3ff00;
      border: 1px solid #c3ff00;
    }

    .status-cancelled {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
      border: 1px solid #f44336;
    }

    .order-details {
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

    .products-list {
      margin-bottom: 15px;
    }

    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #2a2a2a;
    }

    .product-item:last-child {
      border-bottom: none;
    }

    .product-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .product-image {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #2a2a2a;
    }

    .product-details {
      flex: 1;
    }

    .product-name {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .product-type {
      color: #c3ff00;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .product-quantity {
      color: #888;
      font-size: 14px;
    }

    .product-price {
      color: #c3ff00;
      font-weight: 600;
      margin-left: 10px;
    }

    .total-price {
      text-align: right;
      font-size: 18px;
      font-weight: 600;
      color: #c3ff00;
      margin-bottom: 15px;
    }

    .order-actions {
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

    .btn-confirm {
      background: #007bff;
      color: white;
    }

    .btn-ship {
      background: #ff9800;
      color: white;
    }

    .btn-deliver {
      background: #4caf50;
      color: white;
    }

    .btn-complete {
      background: #c3ff00;
      color: #000;
    }

    .btn-cancel {
      background: transparent;
      color: #f44336;
      border: 1px solid #f44336;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    @media (max-width: 768px) {
      .order-details {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class OrderCardComponent {
  @Input() order!: Order;
  @Input() userRole: string = 'admin';
  @Output() statusChange = new EventEmitter<{orderId: string, status: string}>();

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAvailableActions(): {label: string, status: string, class: string}[] {
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
        actions.push(
          { label: 'Livrer', status: 'delivered', class: 'btn-deliver' }
        );
        break;
      case 'delivered':
        actions.push(
          { label: 'Terminer', status: 'completed', class: 'btn-complete' }
        );
        break;
    }

    return actions;
  }

  onActionClick(status: string): void {
    this.statusChange.emit({ orderId: this.order._id!, status });
  }
}