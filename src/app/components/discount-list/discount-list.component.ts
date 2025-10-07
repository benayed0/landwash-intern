import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountService } from '../../services/discount.service';
import { Discount, DiscountDto } from '../../models/discount.model';
import { DiscountCardComponent } from '../discount-card/discount-card.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { CreateDiscountComponent } from '../create-discount/create-discount.component';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-discount-list',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    DiscountCardComponent,
    CreateDiscountComponent,
  ],
  templateUrl: './discount-list.component.html',
  styleUrls: ['./discount-list.component.css'],
})
export class DiscountListComponent implements OnInit {
  private discountService = inject(DiscountService);
  private toast = inject(HotToastService);

  discounts = signal<Discount[]>([]);
  loading = signal<boolean>(false);
  activeTab = signal<string>('active');
  showCreateModal = signal<boolean>(false);

  // Computed properties for filtered discounts
  activeDiscounts = computed(() =>
    this.discounts().filter((discount) => discount.active)
  );

  inactiveDiscounts = computed(() =>
    this.discounts().filter((discount) => !discount.active)
  );

  expiredDiscounts = computed(() => {
    const now = new Date();
    return this.discounts().filter(
      (discount) => discount.expiresAt && new Date(discount.expiresAt) < now
    );
  });

  usageLimitReachedDiscounts = computed(() =>
    this.discounts().filter(
      (discount) => discount.usedCount >= discount.maxUses
    )
  );

  currentDiscounts = computed(() => {
    switch (this.activeTab()) {
      case 'active':
        return this.activeDiscounts();
      case 'inactive':
        return this.inactiveDiscounts();
      case 'expired':
        return this.expiredDiscounts();
      case 'exhausted':
        return this.usageLimitReachedDiscounts();
      default:
        return this.discounts();
    }
  });

  sectionTitle = computed(() => {
    switch (this.activeTab()) {
      case 'active':
        return 'Codes de Réduction Actifs';
      case 'inactive':
        return 'Codes de Réduction Inactifs';
      case 'expired':
        return 'Codes de Réduction Expirés';
      case 'exhausted':
        return 'Codes de Réduction Épuisés';
      default:
        return 'Tous les Codes de Réduction';
    }
  });

  ngOnInit() {
    this.loadDiscounts();
  }

  private loadDiscounts() {
    this.loading.set(true);
    this.discountService.getAllDiscounts().subscribe({
      next: (discounts) => {
        this.discounts.set(discounts);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading discounts:', error);
        this.toast.error('Erreur lors du chargement des codes de réduction');
        this.loading.set(false);
      },
    });
  }

  onDiscountUpdate(event: {
    discountId: string;
    updateData: Partial<Discount>;
  }) {
    this.loading.set(true);

    // Convert Discount type to DiscountDto type for API
    const updateDto: Partial<DiscountDto> = {
      code: event.updateData.code,
      type: event.updateData.type,
      value: event.updateData.value,
      expiresAt: event.updateData.expiresAt,
      maxUses: event.updateData.maxUses,
      active: event.updateData.active,
      firstOrderOnly: event.updateData.firstOrderOnly,
      services: event.updateData.services,
      applicableProducts: Array.isArray(event.updateData.applicableProducts)
        ? event.updateData.applicableProducts.map(p => typeof p === 'string' ? p : p._id)
        : event.updateData.applicableProducts,
    };

    this.discountService
      .updateDiscount(event.discountId, updateDto)
      .subscribe({
        next: (updatedDiscount) => {
          // Simply reload the entire list to ensure UI updates
          this.loadDiscounts();
          this.toast.success('Code de réduction mis à jour');
        },
        error: (error) => {
          console.error('Error updating discount:', error);
          this.toast.error('Erreur lors de la mise à jour');
          this.loading.set(false);
        },
      });
  }

  onDiscountDelete(discountId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce code de réduction ?')) {
      this.loading.set(true);
      this.discountService.deleteDiscount(discountId).subscribe({
        next: () => {
          const currentDiscounts = this.discounts();
          const updated = currentDiscounts.filter(
            (discount) => discount._id !== discountId
          );
          this.discounts.set(updated);
          this.toast.success('Code de réduction supprimé');
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error deleting discount:', error);
          this.toast.error('Erreur lors de la suppression');
          this.loading.set(false);
        },
      });
    }
  }

  showCreateDiscountModal() {
    this.showCreateModal.set(true);
  }

  hideCreateDiscountModal() {
    this.showCreateModal.set(false);
  }

  onDiscountCreated() {
    this.hideCreateDiscountModal();
    this.loadDiscounts(); // Refresh the list
    this.toast.success('Code de réduction créé avec succès!');
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}