import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { BottomBarComponent } from '../shared/bottom-bar/bottom-bar.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    BottomBarComponent,
    ProductModalComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  loading = false;
  deleteLoading = false;
  showAddModal = false;
  showEditModal = false;
  selectedProduct: Product | null = null;
  showDeleteConfirm = false;
  productToDelete: Product | null = null;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  onAddProduct() {
    this.showAddModal = true;
  }

  onEditProduct(product: Product) {
    this.selectedProduct = product;
    this.showEditModal = true;
  }

  onDeleteProduct(product: Product) {
    this.productToDelete = product;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (this.productToDelete?._id) {
      this.deleteLoading = true;
      this.productService.deleteProduct(this.productToDelete._id).subscribe({
        next: () => {
          this.loadProducts();
          this.closeDeleteConfirm();
          this.deleteLoading = false;
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          this.deleteLoading = false;
          alert('Erreur lors de la suppression du produit');
        }
      });
    }
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.productToDelete = null;
  }

  onProductSaved() {
    this.loadProducts();
    this.closeModals();
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.selectedProduct = null;
  }

  getProductImageUrl(product: Product): string {
    return product.pictures && product.pictures.length > 0
      ? product.pictures[0]
      : '/assets/images/no-image.png';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(price);
  }

  isProductPack(product: Product): boolean {
    return !!(product.nested_products && product.nested_products.length > 0);
  }
}