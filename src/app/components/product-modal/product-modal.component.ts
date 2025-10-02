import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css'
})
export class ProductModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() product: Product | null = null; // For editing
  @Output() productSaved = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private productService = inject(ProductService);

  formData: Partial<Product> = {
    name: '',
    type: '',
    price: 0,
    details: '',
    instructions_of_use: '',
    nested_products: []
  };

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isSubmitting = false;
  errors: { [key: string]: string } = {};

  // Pack functionality
  isPackMode = false;
  availableProducts: Product[] = [];
  selectedProductIds: string[] = [];

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.resetForm();
    }
  }

  resetForm() {
    if (this.product) {
      // Edit mode
      this.formData = {
        name: this.product.name,
        type: this.product.type,
        price: this.product.price,
        details: this.product.details,
        instructions_of_use: this.product.instructions_of_use || '',
        nested_products: this.product.nested_products || []
      };
      // For editing, show existing images as previews
      this.previewUrls = [...(this.product.pictures || [])];
      // Set pack mode if editing a pack
      this.isPackMode = !!(this.product.nested_products && this.product.nested_products.length > 0);
      this.selectedProductIds = this.product.nested_products?.map(p => p._id) || [];
    } else {
      // Add mode
      this.formData = {
        name: '',
        type: '',
        price: 0,
        details: '',
        instructions_of_use: '',
        nested_products: []
      };
      this.previewUrls = [];
      this.isPackMode = false;
      this.selectedProductIds = [];
    }
    this.selectedFiles = [];
    this.errors = {};
    this.isSubmitting = false;
    this.loadAvailableProducts();
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);

      // Add new files to selected files
      this.selectedFiles.push(...files);

      // Create preview URLs for new files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeFile(index: number) {
    // Remove from selected files if it's a new file
    const existingImagesCount = this.product?.pictures?.length || 0;

    if (index >= existingImagesCount) {
      // It's a new file, remove from selectedFiles
      const fileIndex = index - existingImagesCount;
      this.selectedFiles.splice(fileIndex, 1);
    }

    // Remove from preview URLs
    this.previewUrls.splice(index, 1);
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.formData.name?.trim()) {
      this.errors['name'] = 'Le nom est requis';
      isValid = false;
    }

    if (!this.formData.type?.trim()) {
      this.errors['type'] = 'Le type est requis';
      isValid = false;
    }

    if (!this.formData.price || this.formData.price <= 0) {
      this.errors['price'] = 'Le prix doit être supérieur à 0';
      isValid = false;
    }

    if (!this.formData.details?.trim()) {
      this.errors['details'] = 'La description est requise';
      isValid = false;
    }

    return isValid;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    const operation = this.product
      ? this.productService.updateProduct(this.product._id, this.formData, this.selectedFiles)
      : this.productService.addProduct(this.formData, this.selectedFiles);

    operation.subscribe({
      next: () => {
        this.productSaved.emit();
        this.onCancel();
      },
      error: (err) => {
        console.error('Error saving product:', err);
        this.isSubmitting = false;
        // Handle specific errors if needed
        if (err.error?.message) {
          alert(`Erreur: ${err.error.message}`);
        } else {
          alert('Erreur lors de la sauvegarde du produit');
        }
      }
    });
  }

  onCancel() {
    this.close.emit();
    this.resetForm();
  }

  // Pack functionality methods
  loadAvailableProducts() {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Filter out the current product (if editing) and products that are already packs
        this.availableProducts = products.filter(p =>
          p._id !== this.product?._id &&
          (!p.nested_products || p.nested_products.length === 0)
        );
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  togglePackMode() {
    this.isPackMode = !this.isPackMode;
    if (!this.isPackMode) {
      this.selectedProductIds = [];
      this.formData.nested_products = [];
      this.updatePackPrice();
    }
  }

  handleProductSelectionChange(productId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    this.onProductSelectionChange(productId, target.checked);
  }

  onProductSelectionChange(productId: string, selected: boolean) {
    if (selected) {
      this.selectedProductIds.push(productId);
    } else {
      this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    }
    this.updatePackData();
  }

  updatePackData() {
    if (this.isPackMode) {
      this.formData.nested_products = this.availableProducts.filter(p =>
        this.selectedProductIds.includes(p._id)
      );
      this.updatePackPrice();
    }
  }

  updatePackPrice() {
    if (this.isPackMode && this.formData.nested_products) {
      const totalPrice = this.formData.nested_products.reduce((sum, product) => sum + product.price, 0);
      this.formData.price = totalPrice;
    }
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds.includes(productId);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(price);
  }

  get modalTitle(): string {
    return this.product ? 'Modifier le produit' : 'Ajouter un produit';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.product ? '⏳ Modification...' : '⏳ Création...';
    }
    return this.product ? '✓ Modifier' : '✓ Créer';
  }
}