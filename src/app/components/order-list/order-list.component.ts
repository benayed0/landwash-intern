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
  styleUrls: ['./order-list.component.css'],
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
