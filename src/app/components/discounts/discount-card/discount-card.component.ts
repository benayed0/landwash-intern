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
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

import {
  Discount,
  DiscountType,
  ServiceType,
} from '../../../models/discount.model';
import { ProductService } from '../../../services/product.service';
import { BookingLabelService } from '../../../services/booking-label.service';
import { Product } from '../../../models/product.model';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-discount-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIcon,
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
  private bookingLabelService = inject(BookingLabelService);
  private toast = inject(HotToastService);
  private dialog = inject(MatDialog);

  isEditing = signal<boolean>(false);
  editForm = signal<Partial<Discount>>({});
  products = signal<Product[]>([]);
  isLoadingProducts = signal<boolean>(false);

  // Type options
  discountTypeOptions = [
    { label: 'Pourcentage', value: DiscountType.Percentage },
    { label: 'Montant Fixe', value: DiscountType.Fixed },
  ];

  // Service type options - using shared BookingLabelService
  serviceTypeOptions = this.bookingLabelService.getAllBookingTypes().map(type => ({
    label: type.label,
    value: type.value
  }));

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
    const dialogData: ConfirmDialogData = {
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le code ${
        this.discount?.code || 'inconnu'
      } ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true,
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.delete.emit(this.discount._id!);
      }
    });
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
      return this.bookingLabelService.getBookingTypeLabel(service);
    });

    return serviceLabels.join(', ');
  }

  formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Format as YYYY-MM-DD for HTML5 date input (use local timezone)
    return this.formatDateToLocalString(dateObj);
  }

  // Helper function to format date to local YYYY-MM-DD string without timezone issues
  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const dateValue = input.value;
    if (dateValue) {
      // Convert from YYYY-MM-DD to Date object
      this.editForm.update((form) => ({
        ...form,
        expiresAt: new Date(dateValue),
      }));
    } else {
      // Clear the date
      this.editForm.update((form) => ({
        ...form,
        expiresAt: undefined,
      }));
    }
  }
}
