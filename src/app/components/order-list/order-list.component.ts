import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { OrderCardComponent } from '../order-card/order-card.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderCardComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './order-list.component.html',
  styles: `
    .order-list-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }

    .tabs {
      display: flex;
      background: #1a1a1a;
      padding: 10px;
      gap: 10px;
      overflow-x: auto;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
      width: 100%;
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
      overflow-y: auto;
      min-height: 0;
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
      .order-list-container {
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
        position: relative;
      }

      .tabs {
        padding: 8px;
        gap: 6px;
        flex-shrink: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .tab {
        min-width: 90px;
        padding: 8px 12px;
        font-size: 11px;
        flex-shrink: 0;
        white-space: nowrap;
      }

      .content {
        padding: 10px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
      }

      .section-title {
        font-size: 18px;
        margin-bottom: 15px;
      }

      .date-filter {
        padding: 10px;
        flex-shrink: 0;
      }

      .date-filter h3 {
        font-size: 14px;
        margin-bottom: 10px;
      }

      .preset-buttons {
        justify-content: flex-start;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        gap: 6px;
      }

      .preset-btn {
        flex-shrink: 0;
        min-width: fit-content;
        text-align: center;
        white-space: nowrap;
        padding: 6px 10px;
        font-size: 10px;
      }

      .custom-date-inputs {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
        margin-top: 10px;
      }

      .date-input-group {
        width: 100%;
      }

      .apply-btn {
        align-self: stretch;
        margin-top: 5px;
        padding: 10px;
      }
    }

    /* Date Filter Styles */
    .date-filter {
      background: #1a1a1a;
      padding: 15px;
      border-bottom: 1px solid #333;
      flex-shrink: 0;
      width: 100%;
    }

    .date-filter h3 {
      color: #c3ff00;
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .preset-buttons {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 2px 0;
      width: 100%;
      max-width: 100%;
      flex: 1;
      min-width: 0;
    }

    .preset-buttons::-webkit-scrollbar {
      display: none;
    }

    .preset-btn {
      padding: 8px 16px;
      background: #1a1a1a;
      color: #999;
      border: 1px solid #444;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 12px;
      font-weight: 500;
      flex-shrink: 0;
      white-space: nowrap;
      min-width: fit-content;
    }

    .preset-btn:hover {
      background: #333;
      color: #e5e5e5;
    }

    .preset-btn.active {
      background: #c3ff00;
      color: #0a0a0a;
      border-color: #c3ff00;
    }

    .custom-date-inputs {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #444;
    }

    .date-input-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1;
    }

    .date-input-group label {
      font-size: 12px;
      color: #888;
      font-weight: 500;
    }

    .date-input {
      padding: 8px 12px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 6px;
      color: #e5e5e5;
      font-size: 14px;
      transition: border-color 0.3s;
      width: 100%;
    }

    .date-input:focus {
      outline: none;
      border-color: #c3ff00;
      background: #333;
    }

    .apply-btn {
      background: #c3ff00;
      color: #0a0a0a;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s;
      height: fit-content;
      align-self: flex-end;
    }

    .apply-btn:hover {
      background: #a8d400;
      transform: translateY(-1px);
    }

    .apply-btn:active {
      transform: scale(0.95);
    }
  `,
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);

  activeTab = 'pending';
  loading = false;
  operationLoading: { [key: string]: boolean } = {};

  // Date filtering properties
  selectedPreset = signal<'all' | 'today' | '7days' | '30days' | 'custom'>(
    'all'
  );
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Order arrays as signals
  pendingOrders = signal<Order[]>([]);
  confirmedOrders = signal<Order[]>([]);
  shippedOrders = signal<Order[]>([]);
  deliveredOrders = signal<Order[]>([]);
  completedOrders = signal<Order[]>([]);
  cancelledOrders = signal<Order[]>([]);

  // Computed properties for filtered orders
  filteredPendingOrders = computed(() =>
    this.filterOrdersByDate(this.pendingOrders())
  );
  filteredConfirmedOrders = computed(() =>
    this.filterOrdersByDate(this.confirmedOrders())
  );
  filteredShippedOrders = computed(() =>
    this.filterOrdersByDate(this.shippedOrders())
  );
  filteredDeliveredOrders = computed(() =>
    this.filterOrdersByDate(this.deliveredOrders())
  );
  filteredCompletedOrders = computed(() =>
    this.filterOrdersByDate(this.completedOrders())
  );
  filteredCancelledOrders = computed(() =>
    this.filterOrdersByDate(this.cancelledOrders())
  );

  get currentOrders() {
    switch (this.activeTab) {
      case 'pending':
        return this.filteredPendingOrders();
      case 'confirmed':
        return this.filteredConfirmedOrders();
      case 'shipped':
        return this.filteredShippedOrders();
      case 'delivered':
        return this.filteredDeliveredOrders();
      case 'completed':
        return this.filteredCompletedOrders();
      case 'cancelled':
        return this.filteredCancelledOrders();
      default:
        return [];
    }
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.pendingOrders.set(orders.filter((o) => o.status === 'pending'));
        this.confirmedOrders.set(
          orders.filter((o) => o.status === 'confirmed')
        );
        this.shippedOrders.set(orders.filter((o) => o.status === 'shipped'));
        this.deliveredOrders.set(
          orders.filter((o) => o.status === 'delivered')
        );
        this.completedOrders.set(
          orders.filter((o) => o.status === 'completed')
        );
        this.cancelledOrders.set(
          orders.filter((o) => o.status === 'cancelled')
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;

        // Complete pull-to-refresh even on error
        setTimeout(() => {
          console.log(
            '❌ Orders load failed, refresh indicator should be hidden'
          );
        }, 100);
      },
    });
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

  onOrderStatusChange(event: { orderId: string; status: string }) {
    this.operationLoading[`order-status-${event.orderId}`] = true;
    this.orderService.updateOrderStatus(event.orderId, event.status).subscribe({
      next: () => {
        this.loadOrders();
        this.operationLoading[`order-status-${event.orderId}`] = false;
      },
      error: (err) => {
        console.error('Error updating order:', err);
        this.operationLoading[`order-status-${event.orderId}`] = false;
      },
    });
  }

  isOperationLoading(operation: string, id: string): boolean {
    return this.operationLoading[`${operation}-${id}`] || false;
  }

  applyDateFilter() {
    // Method for explicit filter application if needed
    // The filtering is already reactive through computed properties
  }

  isDateRangeValid(): boolean {
    if (this.selectedPreset() !== 'custom') return true;

    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) return false;

    return new Date(start) <= new Date(end);
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  setDatePreset(preset: 'all' | 'today' | '7days' | '30days' | 'custom') {
    this.selectedPreset.set(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (preset) {
      case 'all':
        this.startDate.set('');
        this.endDate.set('');
        break;
      case 'today':
        this.startDate.set(todayStr);
        this.endDate.set(todayStr);
        break;
      case '7days':
        const sevenDaysAgo = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(sevenDaysAgo.toISOString().split('T')[0]);
        this.endDate.set(todayStr);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(thirtyDaysAgo.toISOString().split('T')[0]);
        this.endDate.set(todayStr);
        break;
      case 'custom':
        // Keep existing dates or set to today if empty
        if (!this.startDate()) this.startDate.set(todayStr);
        if (!this.endDate()) this.endDate.set(todayStr);
        break;
    }
  }

  onStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.startDate.set(target.value);
    this.selectedPreset.set('custom');
  }

  onEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.endDate.set(target.value);
    this.selectedPreset.set('custom');
  }

  private filterOrdersByDate(orders: Order[]): Order[] {
    // Return empty array if orders haven't loaded yet
    if (!orders || orders.length === 0) {
      return [];
    }

    if (
      this.selectedPreset() === 'all' ||
      (!this.startDate() && !this.endDate())
    ) {
      return orders;
    }

    const start = this.startDate() ? new Date(this.startDate()) : null;
    const end = this.endDate() ? new Date(this.endDate()) : null;

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.updatedAt);

      if (start && orderDate < start) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (orderDate > endOfDay) return false;
      }

      return true;
    });
  }
}
