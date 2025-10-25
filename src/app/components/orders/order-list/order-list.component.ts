import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order, OrderStatus } from '../../../models/order.model';
import { OrderCardComponent } from '../order-card/order-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { CreateOrderModalComponent } from '../create-order-modal/create-order-modal.component';
import { HotToastService } from '@ngneat/hot-toast';
import { MatDialog } from '@angular/material/dialog';
import { ViewOrderModalComponent } from '../view-order-modal/view-order-modal.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderCardComponent,
    LoadingSpinnerComponent,
    CreateOrderModalComponent,
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private toast = inject(HotToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  dialog = inject(MatDialog);

  activeTab = 'all';
  loading = false;
  operationLoading: { [key: string]: boolean } = {};
  sortBy: string = 'date-asc';

  // Modal state
  isCreateOrderModalOpen = signal(false);
  private currentOpenOrderId: string | null = null;

  // Date filtering properties
  selectedPreset = signal<'all' | 'today' | '7days' | '30days' | 'custom'>(
    'all'
  );
  startDate = signal<string>('');
  endDate = signal<string>('');
  isFilterCollapsed = signal<boolean>(true);

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
    let orders: Order[];

    switch (this.activeTab) {
      case 'all':
        orders = [
          ...this.filteredPendingOrders(),
          ...this.filteredConfirmedOrders(),
          ...this.filteredShippedOrders(),
          ...this.filteredDeliveredOrders(),
          ...this.filteredCompletedOrders(),
          ...this.filteredCancelledOrders(),
        ];
        break;
      case 'pending':
        orders = this.filteredPendingOrders();
        break;
      case 'confirmed':
        orders = this.filteredConfirmedOrders();
        break;
      case 'shipped':
        orders = this.filteredShippedOrders();
        break;
      case 'delivered':
        orders = this.filteredDeliveredOrders();
        break;
      case 'completed':
        orders = this.filteredCompletedOrders();
        break;
      case 'cancelled':
        orders = this.filteredCancelledOrders();
        break;
      default:
        orders = [];
    }

    return this.sortOrders(orders);
  }

  ngOnInit() {
    this.loadOrders();
    this.watchRouteParams();
  }

  /**
   * Watch for route parameters and open view order modal if orderId is present
   */
  private watchRouteParams() {
    this.route.paramMap.subscribe((params) => {
      const orderId = params.get('orderId');
      console.log('orderId', orderId);

      // Only open if there's an orderId and it's not already open
      if (orderId && orderId !== this.currentOpenOrderId) {
        this.openViewOrderModal(orderId);
      }
    });
  }

  /**
   * Open view order modal
   */
  openViewOrderModal(orderId: string) {
    // Set the currently open order ID to prevent duplicates
    this.currentOpenOrderId = orderId;
    console.log('opening', orderId);

    const dialogRef = this.dialog.open(ViewOrderModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { orderId },
    });

    // Handle dialog close
    dialogRef.afterClosed().subscribe(() => {
      // Clear the current order ID
      this.currentOpenOrderId = null;

      // Navigate back to clean URL without the orderId
      window.location.href = this.router
        .createUrlTree(['/dashboard/orders'])
        .toString();
    });
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
      case 'all':
        return 'Toutes les commandes';
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
  openNewOrderModal() {
    this.isCreateOrderModalOpen.set(true);
  }

  onCloseCreateOrderModal() {
    this.isCreateOrderModalOpen.set(false);
  }

  onOrderCreated(order: Order) {
    this.toast.success('Commande créée avec succès!');
    this.loadOrders(); // Refresh the orders list
    this.isCreateOrderModalOpen.set(false);
  }
  onOrderStatusChange(event: {
    orderId: string;
    status: string;
    estimatedDeliveryDate?: string;
  }) {
    this.operationLoading[`order-status-${event.orderId}`] = true;

    if (event.estimatedDeliveryDate) {
      // Update with estimated delivery date
      this.orderService
        .updateOrder(event.orderId, {
          status: event.status as OrderStatus,
          estimatedDeliveryDate: new Date(event.estimatedDeliveryDate),
        })
        .subscribe({
          next: () => {
            this.loadOrders();
            this.operationLoading[`order-status-${event.orderId}`] = false;
          },
          error: (err) => {
            console.error('Error updating order:', err);
            this.operationLoading[`order-status-${event.orderId}`] = false;
          },
        });
    } else {
      // Regular status update
      this.orderService
        .updateOrder(event.orderId, { status: event.status as OrderStatus })
        .subscribe({
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

  toggleFilterCollapse() {
    this.isFilterCollapsed.set(!this.isFilterCollapsed());
  }

  setDatePreset(preset: 'all' | 'today' | '7days' | '30days' | 'custom') {
    this.selectedPreset.set(preset);
    const today = new Date();
    const todayStr = this.formatDateToLocalString(today);

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
        this.startDate.set(this.formatDateToLocalString(sevenDaysAgo));
        this.endDate.set(todayStr);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        this.startDate.set(this.formatDateToLocalString(thirtyDaysAgo));
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

  // Helper function to format date to local YYYY-MM-DD string without timezone issues
  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  onSortChange() {
    // Trigger change detection by just changing the sort property
    // The currentOrders getter will automatically apply the new sort
  }

  onStatusChange() {
    // Trigger change detection when status filter changes
    // The currentOrders getter will automatically apply the new filter
  }

  getTotalOrders(): number {
    return (
      this.filteredPendingOrders().length +
      this.filteredConfirmedOrders().length +
      this.filteredShippedOrders().length +
      this.filteredDeliveredOrders().length +
      this.filteredCompletedOrders().length +
      this.filteredCancelledOrders().length
    );
  }

  private sortOrders(orders: Order[]): Order[] {
    if (!orders || orders.length === 0) return orders;

    const sorted = [...orders];

    switch (this.sortBy) {
      case 'date-desc':
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt).getTime() -
            new Date(a.createdAt || a.updatedAt).getTime()
        );
      case 'date-asc':
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt || a.updatedAt).getTime() -
            new Date(b.createdAt || b.updatedAt).getTime()
        );
      case 'total-desc':
        return sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
      case 'total-asc':
        return sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
      case 'client-name':
        return sorted.sort((a, b) => {
          const nameA = a.userId?.name || '';
          const nameB = b.userId?.name || '';
          return nameA.localeCompare(nameB, 'fr');
        });
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }
}
