import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SubscriptionService } from '../../../services/subscription.service';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionCardComponent } from '../subscription-card/subscription-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { CreateSubscriptionComponent } from '../create-subscription/create-subscription.component';
import { UserFilterSelectComponent } from '../../shared/user-filter-select/user-filter-select.component';
import {
  FilterSelectComponent,
  FilterOption,
} from '../../shared/filter-select/filter-select.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    SubscriptionCardComponent,
    MatDialogModule,
    UserFilterSelectComponent,
    FilterSelectComponent,
  ],
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.css'],
})
export class SubscriptionListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private subscriptionService = inject(SubscriptionService);

  subscriptions = signal<Subscription[]>([]);
  loading = signal<boolean>(false);
  activeTab = signal<string>('all');

  // User filtering properties
  clients = signal<any[]>([]);
  selectedClient = signal<string>('all');

  pendingSubscriptions = computed(() =>
    this.filterSubscriptions(
      this.subscriptions().filter((sub) => sub.status === 'pending')
    )
  );

  activeSubscriptions = computed(() =>
    this.filterSubscriptions(
      this.subscriptions().filter((sub) => sub.status === 'active')
    )
  );

  inactiveSubscriptions = computed(() =>
    this.filterSubscriptions(
      this.subscriptions().filter((sub) => sub.status === 'inactive')
    )
  );

  canceledSubscriptions = computed(() =>
    this.filterSubscriptions(
      this.subscriptions().filter((sub) => sub.status === 'canceled')
    )
  );

  expiredSubscriptions = computed(() =>
    this.filterSubscriptions(
      this.subscriptions().filter((sub) => sub.status === 'expired')
    )
  );

  statusFilterOptions = computed<FilterOption[]>(() => [
    {
      value: 'all',
      label: 'Tous',
      count:
        this.pendingSubscriptions().length +
        this.activeSubscriptions().length +
        this.inactiveSubscriptions().length +
        this.canceledSubscriptions().length +
        this.expiredSubscriptions().length,
    },
    {
      value: 'pending',
      label: '📋 En attente',
      count: this.pendingSubscriptions().length,
    },
    {
      value: 'active',
      label: '✅ Actives',
      count: this.activeSubscriptions().length,
    },
    {
      value: 'inactive',
      label: '⏸️ Inactives',
      count: this.inactiveSubscriptions().length,
    },
    {
      value: 'canceled',
      label: '❌ Annulées',
      count: this.canceledSubscriptions().length,
    },
    {
      value: 'expired',
      label: '⏰ Expirées',
      count: this.expiredSubscriptions().length,
    },
  ]);

  currentSubscriptions = computed(() => {
    switch (this.activeTab()) {
      case 'all':
        return [
          ...this.pendingSubscriptions(),
          ...this.activeSubscriptions(),
          ...this.inactiveSubscriptions(),
          ...this.canceledSubscriptions(),
          ...this.expiredSubscriptions(),
        ];
      case 'pending':
        return this.pendingSubscriptions();
      case 'active':
        return this.activeSubscriptions();
      case 'inactive':
        return this.inactiveSubscriptions();
      case 'canceled':
        return this.canceledSubscriptions();
      case 'expired':
        return this.expiredSubscriptions();
      default:
        return [];
    }
  });

  sectionTitle = computed(() => {
    switch (this.activeTab()) {
      case 'all':
        return 'Tous les abonnements';
      case 'pending':
        return 'Abonnements en attente';
      case 'active':
        return 'Abonnements actifs';
      case 'inactive':
        return 'Abonnements inactifs';
      case 'canceled':
        return 'Abonnements annulés';
      case 'expired':
        return 'Abonnements expirés';
      default:
        return 'Abonnements';
    }
  });

  onStatusFilterChange() {
    // Trigger change detection when status filter changes
    // The currentSubscriptions computed will automatically apply the new filter
  }

  ngOnInit() {
    this.loadSubscriptions();
    this.loadClients();
  }

  private loadSubscriptions() {
    this.loading.set(true);
    this.subscriptionService.getAllSubscriptions().subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading subscriptions:', error);
        this.loading.set(false);
      },
    });
  }

  private loadClients() {
    // Extract unique clients from subscriptions
    this.subscriptionService.getAllSubscriptions().subscribe({
      next: (subscriptions) => {
        const uniqueClients = subscriptions
          .map((subscription) => subscription.userId)
          .filter((user) => user && user._id) // Filter out null/undefined users
          .filter(
            (user, index, self) =>
              index === self.findIndex((u) => u._id === user._id)
          );
        this.clients.set(uniqueClients);
      },
      error: (err) => {
        console.error('Error loading clients:', err);
      },
    });
  }

  private filterSubscriptions(subscriptions: Subscription[]): Subscription[] {
    if (!subscriptions || subscriptions.length === 0) {
      return [];
    }

    // Apply user filtering
    if (this.selectedClient() !== 'all') {
      return subscriptions.filter((subscription) => {
        return (
          subscription.userId &&
          subscription.userId._id === this.selectedClient()
        );
      });
    }

    return subscriptions;
  }

  onSubscriptionStatusChange(event: {
    subscriptionId: string;
    status: string;
  }) {
    this.loading.set(true);
    this.subscriptionService
      .updateSubscriptionStatus(event.subscriptionId, event.status)
      .subscribe({
        next: (updatedSubscription) => {
          const currentSubscriptions = this.subscriptions();
          const index = currentSubscriptions.findIndex(
            (sub) => sub._id === event.subscriptionId
          );
          if (index !== -1) {
            const updated = [...currentSubscriptions];
            updated[index] = updatedSubscription;
            this.subscriptions.set(updated);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating subscription status:', error);
          this.loading.set(false);
        },
      });
  }

  onSubscriptionUpdate(event: {
    subscriptionId: string;
    updateData: Partial<Subscription>;
  }) {
    this.loading.set(true);
    this.subscriptionService
      .updateSubscription(event.subscriptionId, event.updateData)
      .subscribe({
        next: (updatedSubscription) => {
          const currentSubscriptions = this.subscriptions();
          const index = currentSubscriptions.findIndex(
            (sub) => sub._id === event.subscriptionId
          );
          if (index !== -1) {
            const updated = [...currentSubscriptions];
            updated[index] = updatedSubscription;
            this.subscriptions.set(updated);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating subscription:', error);
          this.loading.set(false);
        },
      });
  }

  showCreateModal() {
    const dialogRef = this.dialog.open(CreateSubscriptionComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      disableClose: false,
    });

    dialogRef.componentInstance.subscriptionCreated.subscribe(() => {
      this.loadSubscriptions();
      dialogRef.close();
    });

    dialogRef.componentInstance.cancelled.subscribe(() => {
      dialogRef.close();
    });
  }
}
