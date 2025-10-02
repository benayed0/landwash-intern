import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { OrderCardComponent } from '../order-card/order-card.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    OrderCardComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './order-list.component.html',
  styles: `
    .order-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .tabs {
      display: flex;
      background: #1a1a1a;
      padding: 10px;
      gap: 10px;
      overflow-x: auto;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    }

    .tab {
      flex: 1;
      min-width: 120px;
      padding: 12px 20px;
      background: #2a2a2a;
      color: #999;
      border: 1px solid #333;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    }

    .tab.active {
      background: #c3ff00;
      color: #0a0a0a;
      border-color: #c3ff00;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(195, 255, 0, 0.3);
    }

    .tab:hover:not(.active) {
      background: #333;
      color: #e5e5e5;
      transform: translateY(-1px);
    }

    .content {
      flex: 1;
      padding: 20px;
    }

    .section-title {
      font-size: 24px;
      color: #e5e5e5;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .tabs {
        padding: 8px;
        gap: 8px;
      }

      .tab {
        min-width: 100px;
        padding: 10px 16px;
        font-size: 12px;
      }

      .content {
        padding: 15px;
      }

      .section-title {
        font-size: 20px;
      }
    }
  `
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);

  activeTab = 'pending';
  loading = false;
  operationLoading: { [key: string]: boolean } = {};

  // Order arrays
  pendingOrders: Order[] = [];
  confirmedOrders: Order[] = [];
  shippedOrders: Order[] = [];
  deliveredOrders: Order[] = [];
  completedOrders: Order[] = [];
  cancelledOrders: Order[] = [];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.pendingOrders = orders.filter(o => o.status === 'pending');
        this.confirmedOrders = orders.filter(o => o.status === 'confirmed');
        this.shippedOrders = orders.filter(o => o.status === 'shipped');
        this.deliveredOrders = orders.filter(o => o.status === 'delivered');
        this.completedOrders = orders.filter(o => o.status === 'completed');
        this.cancelledOrders = orders.filter(o => o.status === 'cancelled');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
      }
    });
  }

  get currentOrders() {
    switch (this.activeTab) {
      case 'pending':
        return this.pendingOrders;
      case 'confirmed':
        return this.confirmedOrders;
      case 'shipped':
        return this.shippedOrders;
      case 'delivered':
        return this.deliveredOrders;
      case 'completed':
        return this.completedOrders;
      case 'cancelled':
        return this.cancelledOrders;
      default:
        return [];
    }
  }

  get sectionTitle() {
    switch (this.activeTab) {
      case 'pending':
        return 'Commandes en attente';
      case 'confirmed':
        return 'Commandes confirmées';
      case 'shipped':
        return 'Commandes expédiées';
      case 'delivered':
        return 'Commandes livrées';
      case 'completed':
        return 'Commandes terminées';
      case 'cancelled':
        return 'Commandes annulées';
      default:
        return '';
    }
  }

  onOrderStatusChange(event: { orderId: string, status: string }) {
    this.operationLoading[`order-status-${event.orderId}`] = true;
    this.orderService.updateOrderStatus(event.orderId, event.status).subscribe({
      next: () => {
        this.loadOrders();
        this.operationLoading[`order-status-${event.orderId}`] = false;
      },
      error: (err) => {
        console.error('Error updating order:', err);
        this.operationLoading[`order-status-${event.orderId}`] = false;
      }
    });
  }

  isOperationLoading(operation: string, id: string): boolean {
    return this.operationLoading[`${operation}-${id}`] || false;
  }
}