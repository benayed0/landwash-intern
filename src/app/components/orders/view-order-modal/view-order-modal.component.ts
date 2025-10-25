import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order.model';
import { AuthService } from '../../../services/auth.service';

export interface ViewOrderDialogData {
  orderId: string;
}

@Component({
  selector: 'app-view-order-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-order-modal.component.html',
  styleUrls: ['./view-order-modal.component.css'],
})
export class ViewOrderModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ViewOrderModalComponent>);
  private data = inject<ViewOrderDialogData>(MAT_DIALOG_DATA);
  private orderService = inject(OrderService);
  auth = inject(AuthService);
  order = signal<Order | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  actionLoading = signal<boolean>(false);

  // Computed properties for display
  statusLabel = computed(() => {
    const status = this.order()?.status;
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'shipped':
        return 'Expédié';
      case 'delivered':
        return 'Livré';
      case 'paid':
        return 'Payé';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      default:
        return status || '';
    }
  });

  statusColor = computed(() => {
    const status = this.order()?.status;
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipped':
        return 'shipped';
      case 'delivered':
        return 'success';
      case 'paid':
        return 'primary';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'completed';
      default:
        return 'secondary';
    }
  });

  ngOnInit() {
    this.loadOrder();
  }

  private loadOrder() {
    this.loading.set(true);
    this.orderService.getOrderById(this.data.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.error.set('Erreur lors du chargement de la commande');
        this.loading.set(false);
      },
    });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'N/A';
    return `${price.toFixed(2)} DT`;
  }

  getClientName(): string {
    const order = this.order();
    if (!order?.userId) return 'Client inconnu';
    if (typeof order.userId === 'string') return order.userId;
    return order.userId.name || 'Client inconnu';
  }

  getClientPhone(): string {
    const order = this.order();
    if (!order?.userId) return 'N/A';
    if (typeof order.userId === 'string') return 'N/A';
    return order.userId.phoneNumber || 'N/A';
  }

  getGoogleMapsUrl(): string {
    const order = this.order();
    if (!order?.coordinates || order.coordinates.length < 2) {
      return '#';
    }
    const lat = order.coordinates[1];
    const lng = order.coordinates[0];
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  onClose() {
    // Close dialog without any data
    this.dialogRef.close();
  }

  // Check available actions based on status
  canConfirm(): boolean {
    return this.order()?.status === 'pending';
  }

  canCancel(): boolean {
    const status = this.order()?.status;
    return status === 'pending' || status === 'confirmed';
  }

  canShip(): boolean {
    return this.order()?.status === 'confirmed';
  }

  canDeliver(): boolean {
    return this.order()?.status === 'shipped';
  }

  canComplete(): boolean {
    return this.order()?.status === 'delivered';
  }

  // Status update actions
  onConfirmOrder() {
    const order = this.order();
    if (!order?._id) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir confirmer cette commande ?'
    );
    if (!confirmed) return;

    this.updateOrderStatus(order._id, 'confirmed');
  }

  onCancelOrder() {
    const order = this.order();
    if (!order?._id) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir annuler cette commande ?'
    );
    if (!confirmed) return;

    this.updateOrderStatus(order._id, 'cancelled');
  }

  onShipOrder() {
    const order = this.order();
    if (!order?._id) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir marquer cette commande comme expédiée ?'
    );
    if (!confirmed) return;

    this.updateOrderStatus(order._id, 'shipped');
  }

  onDeliverOrder() {
    const order = this.order();
    if (!order?._id) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir marquer cette commande comme livrée ?'
    );
    if (!confirmed) return;

    this.updateOrderStatus(order._id, 'delivered');
  }

  onCompleteOrder() {
    const order = this.order();
    if (!order?._id) return;

    const confirmed = confirm(
      'Êtes-vous sûr de vouloir terminer cette commande ?'
    );
    if (!confirmed) return;

    this.updateOrderStatus(order._id, 'completed');
  }

  private updateOrderStatus(orderId: string, status: string) {
    this.actionLoading.set(true);
    this.orderService.updateOrder(orderId, { status } as any).subscribe({
      next: (updatedOrder: Order) => {
        console.log('Order status updated:', updatedOrder);
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error updating order status:', err);
        this.actionLoading.set(false);
        alert('Erreur lors de la mise à jour du statut de la commande');
      },
    });
  }
}
