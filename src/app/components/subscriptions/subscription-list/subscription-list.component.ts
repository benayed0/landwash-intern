import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SubscriptionService } from '../../../services/subscription.service';
import { Subscription } from '../../../models/subscription.model';
import { SubscriptionCardComponent } from '../subscription-card/subscription-card.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { CreateSubscriptionComponent } from '../create-subscription/create-subscription.component';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    SubscriptionCardComponent,
    MatDialogModule,
  ],
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.css'],
})
export class SubscriptionListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private subscriptionService = inject(SubscriptionService);

  subscriptions = signal<Subscription[]>([]);
  loading = signal<boolean>(false);
  activeTab = signal<string>('pending');

  pendingSubscriptions = computed(() =>
    this.subscriptions().filter((sub) => sub.status === 'pending')
  );

  activeSubscriptions = computed(() =>
    this.subscriptions().filter((sub) => sub.status === 'active')
  );

  inactiveSubscriptions = computed(() =>
    this.subscriptions().filter((sub) => sub.status === 'inactive')
  );

  canceledSubscriptions = computed(() =>
    this.subscriptions().filter((sub) => sub.status === 'canceled')
  );

  expiredSubscriptions = computed(() =>
    this.subscriptions().filter((sub) => sub.status === 'expired')
  );

  currentSubscriptions = computed(() => {
    switch (this.activeTab()) {
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

  ngOnInit() {
    this.loadSubscriptions();
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
