import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { CustomConfirmDialogComponent } from '../custom-confirm-dialog/custom-confirm-dialog.component';

import {
  Discount,
  DiscountType,
  ServiceType,
} from '../../models/discount.model';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-discount-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputSwitchModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    TagModule,
    MultiSelectModule,
    CustomConfirmDialogComponent,
  ],
  templateUrl: './discount-card.component.html',
  styleUrls: ['./discount-card.component.css'],
})
export class DiscountCardComponent implements OnChanges {
  @Input() discount!: Discount;
  @Output() update = new EventEmitter<{
    discountId: string;
    updateData: Partial<Discount>;
  }>();
  @Output() delete = new EventEmitter<string>();

  private productService = inject(ProductService);
  private toast = inject(HotToastService);

  isEditing = signal<boolean>(false);
  editForm = signal<Partial<Discount>>({});
  products = signal<Product[]>([]);
  isLoadingProducts = signal<boolean>(false);

  // Custom dialog state
  showDeleteDialog = signal<boolean>(false);

  // Type options
  discountTypeOptions = [
    { label: 'Pourcentage', value: DiscountType.Percentage },
    { label: 'Montant Fixe', value: DiscountType.Fixed },
  ];

  // Service type options
  serviceTypeOptions = [
    { label: 'Citadine', value: ServiceType.Small },
    { label: 'SUV', value: ServiceType.Big },
    { label: 'Salon', value: ServiceType.Salon },
    { label: 'Produits', value: 'products' },
  ];

  // Computed properties
  isExpired = computed(() => {
    return this.discount.expiresAt
      ? new Date(this.discount.expiresAt) < new Date()
      : false;
  });

  isExhausted = computed(() => {
    return this.discount.usedCount >= this.discount.maxUses;
  });

  usagePercentage = computed(() => {
    return Math.round((this.discount.usedCount / this.discount.maxUses) * 100);
  });

  statusColor = computed(() => {
    if (!this.discount.active) return 'danger';
    if (this.isExpired()) return 'warning';
    if (this.isExhausted()) return 'danger';
    return 'success';
  });

  statusText = computed(() => {
    if (!this.discount.active) return 'Inactif';
    if (this.isExpired()) return 'Expiré';
    if (this.isExhausted()) return 'Épuisé';
    return 'Actif';
  });

  ngOnInit() {
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['discount'] && changes['discount'].currentValue) {
      // Reset edit state when discount input changes
      this.isEditing.set(false);
      this.editForm.set({});
    }
  }

  private loadProducts() {
    this.isLoadingProducts.set(true);
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoadingProducts.set(false);
      },
    });
  }

  startEdit() {
    this.editForm.set({
      code: this.discount.code,
      type: this.discount.type,
      value: this.discount.value,
      expiresAt: this.discount.expiresAt
        ? new Date(this.discount.expiresAt)
        : undefined,
      maxUses: this.discount.maxUses,
      active: this.discount.active,
      firstOrderOnly: this.discount.firstOrderOnly,
      applicableProducts: Array.isArray(this.discount.applicableProducts)
        ? this.discount.applicableProducts.map((p) =>
            typeof p === 'string' ? p : p._id
          )
        : [],
      services: this.discount.services || [],
    });
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editForm.set({});
  }

  saveChanges() {
    const formData = this.editForm();
    if (!formData.code?.trim()) {
      this.toast.error('Le code de réduction est requis');
      return;
    }

    if (!formData.value || formData.value <= 0) {
      this.toast.error('La valeur doit être supérieure à 0');
      return;
    }

    if (!formData.maxUses || formData.maxUses <= 0) {
      this.toast.error(
        "Le nombre maximum d'utilisations doit être supérieur à 0"
      );
      return;
    }

    // Prepare update data
    const updateData: Partial<Discount> = {
      code: formData.code,
      type: formData.type,
      value: formData.value,
      expiresAt: formData.expiresAt,
      maxUses: formData.maxUses,
      active: formData.active,
      firstOrderOnly: formData.firstOrderOnly,
      applicableProducts: formData.applicableProducts,
      services: formData.services,
    };

    this.update.emit({
      discountId: this.discount._id!,
      updateData,
    });

    // Don't immediately set isEditing to false - let ngOnChanges handle it
    // when the parent component updates the discount input
  }

  confirmDelete() {
    this.showDeleteDialog.set(true);
  }

  onDeleteConfirm() {
    this.delete.emit(this.discount._id!);
    this.showDeleteDialog.set(false);
  }

  onDeleteReject() {
    this.showDeleteDialog.set(false);
  }

  toggleActive() {
    this.update.emit({
      discountId: this.discount._id!,
      updateData: { active: !this.discount.active },
    });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Aucune';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatValue(type: DiscountType, value: number): string {
    return type === DiscountType.Percentage ? `${value}%` : `${value} DT`;
  }

  getProductNames(productIds: (string | Product)[]): string {
    if (!productIds || productIds.length === 0) return 'Tous les produits';

    const names = productIds.map((p) => {
      if (typeof p === 'string') {
        const product = this.products().find((prod) => prod._id === p);
        return product?.name || 'Produit inconnu';
      }
      return p.name;
    });

    return (
      names.slice(0, 2).join(', ') +
      (names.length > 2 ? ` et ${names.length - 2} autres` : '')
    );
  }

  getServiceNames(services: ServiceType[]): string {
    if (!services || services.length === 0) return 'Tous les services';

    const serviceLabels = services.map((service) => {
      const option = this.serviceTypeOptions.find(
        (opt) => opt.value === service
      );
      return option?.label || service;
    });

    return serviceLabels.join(', ');
  }
}
