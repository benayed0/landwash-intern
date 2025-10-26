import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';

import { ProductService } from '../../../services/product.service';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';
import { LocationPickerComponent } from '../../location-picker/location-picker.component';
import { Product } from '../../../models/product.model';
import { CreateOrderDto, Order } from '../../../models/order.model';
import { SelectedLocation } from '../../../services/location.service';
import { HotToastService } from '@ngneat/hot-toast';
import { User } from '../../users/users.component';

interface SelectedProduct {
  product: Product;
  quantity: number;
  totalPrice: number;
}

@Component({
  selector: 'app-create-order-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatBadgeModule,
    LocationPickerComponent,
  ],
  templateUrl: './create-order-modal.component.html',
  styleUrl: './create-order-modal.component.css',
})
export class CreateOrderModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() orderCreated = new EventEmitter<Order>();

  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private toast = inject(HotToastService);

  // Data signals
  products = signal<Product[]>([]);
  users = signal<User[]>([]);
  isLoadingProducts = signal(false);
  isLoadingUsers = signal(false);
  isSubmitting = signal(false);

  // Search and filtering
  productSearchQuery = signal('');
  filteredProducts = computed(() => {
    const query = this.productSearchQuery().toLowerCase();
    return this.products().filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.type.toLowerCase().includes(query) ||
        product.details.toLowerCase().includes(query)
    );
  });

  // Selected products
  selectedProducts = signal<SelectedProduct[]>([]);

  // Form data
  selectedUser = signal<User | null>(null);
  selectedLocation = signal<SelectedLocation | null>(null);
  paymentMethod = signal<'cash' | 'card'>('cash');
  notes = signal('');
  manualTotalPrice = signal<number | null>(null);

  // Computed total price
  calculatedTotalPrice = computed(() => {
    return this.selectedProducts().reduce(
      (total, item) => total + item.totalPrice,
      0
    );
  });

  finalTotalPrice = computed(() => {
    return this.manualTotalPrice() ?? this.calculatedTotalPrice();
  });

  ngOnInit() {
    this.loadProducts();
    this.loadUsers();
  }

  loadProducts() {
    this.isLoadingProducts.set(true);
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.toast.error('Erreur lors du chargement des produits');
        this.isLoadingProducts.set(false);
      },
    });
  }

  loadUsers() {
    this.isLoadingUsers.set(true);
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoadingUsers.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toast.error('Erreur lors du chargement des utilisateurs');
        this.isLoadingUsers.set(false);
      },
    });
  }

  onProductSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.productSearchQuery.set(target.value);
  }

  addProduct(product: Product) {
    const existing = this.selectedProducts().find(
      (item) => item.product._id === product._id
    );

    if (existing) {
      this.updateProductQuantity(product._id, existing.quantity + 1);
    } else {
      const newSelectedProduct: SelectedProduct = {
        product,
        quantity: 1,
        totalPrice: product.price,
      };
      this.selectedProducts.update((products) => [
        ...products,
        newSelectedProduct,
      ]);
    }
  }

  updateProductQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeProduct(productId);
      return;
    }

    this.selectedProducts.update((products) =>
      products.map((item) =>
        item.product._id === productId
          ? {
              ...item,
              quantity,
              totalPrice: item.product.price * quantity,
            }
          : item
      )
    );
  }

  removeProduct(productId: string) {
    this.selectedProducts.update((products) =>
      products.filter((item) => item.product._id !== productId)
    );
  }

  onLocationSelected(location: SelectedLocation) {
    this.selectedLocation.set(location);
  }

  resetManualPrice() {
    this.manualTotalPrice.set(null);
  }

  validateForm(): boolean {
    if (this.selectedProducts().length === 0) {
      this.toast.error('Veuillez sélectionner au moins un produit');
      return false;
    }

    if (!this.selectedUser()) {
      this.toast.error('Veuillez sélectionner un utilisateur');
      return false;
    }

    if (!this.selectedLocation()) {
      this.toast.error('Veuillez sélectionner une adresse de livraison');
      return false;
    }

    if (this.finalTotalPrice() <= 0) {
      this.toast.error('Le prix total doit être supérieur à 0');
      return false;
    }

    return true;
  }

  onSubmit() {
    if (!this.validateForm()) return;

    this.isSubmitting.set(true);

    const location = this.selectedLocation()!;
    const user = this.selectedUser()!;

    const orderData: Partial<CreateOrderDto> = {
      coordinates: [location.lng, location.lat],
      shippingAddress: location.address,
      paymentMethod: this.paymentMethod(),
      notes: this.notes() || undefined,
      products: this.selectedProducts().map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalPrice: this.finalTotalPrice(),
    };

    this.orderService.createOrder(user._id, orderData).subscribe({
      next: (order) => {
        this.toast.success('Commande créée avec succès!');
        this.orderCreated.emit(order);
        this.onCancel();
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.toast.error('Erreur lors de la création de la commande');
        this.isSubmitting.set(false);
      },
    });
  }

  onCancel() {
    this.resetForm();
    this.close.emit();
  }

  resetForm() {
    this.selectedProducts.set([]);
    this.selectedUser.set(null);
    this.selectedLocation.set(null);
    this.paymentMethod.set('cash');
    this.notes.set('');
    this.manualTotalPrice.set(null);
    this.productSearchQuery.set('');
    this.isSubmitting.set(false);
  }

  getUserDisplayName(user: User): string {
    return `${user.name} (${user.phoneNumber})`;
  }
}
