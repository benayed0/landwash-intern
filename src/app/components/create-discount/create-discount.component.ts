import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';

import { DiscountService } from '../../services/discount.service';
import { ProductService } from '../../services/product.service';
import {
  DiscountDto,
  DiscountType,
  ServiceType,
} from '../../models/discount.model';
import { Product } from '../../models/product.model';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-create-discount',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    InputSwitchModule,
    MultiSelectModule,
  ],
  templateUrl: './create-discount.component.html',
  styleUrls: ['./create-discount.component.css'],
})
export class CreateDiscountComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() discountCreated = new EventEmitter<void>();
  minDate = new Date();
  private discountService = inject(DiscountService);
  private productService = inject(ProductService);
  private toast = inject(HotToastService);
  private fb = inject(FormBuilder);

  discountForm!: FormGroup;
  isSubmitting = signal<boolean>(false);
  products = signal<Product[]>([]);
  isLoadingProducts = signal<boolean>(false);

  // Discount type options
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

  ngOnInit() {
    this.initializeForm();
    this.loadProducts();
  }

  private initializeForm() {
    this.discountForm = this.fb.group({
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
        ],
      ],
      type: [DiscountType.Percentage, Validators.required],
      value: [null, [Validators.required, Validators.min(0.01)]],
      expiresAt: [null],
      maxUses: [1, [Validators.required, Validators.min(1)]],
      active: [true],
      firstOrderOnly: [false],
      applicableProducts: [[]],
      services: [[]],
    });

    // Add conditional validators based on discount type
    this.discountForm.get('type')?.valueChanges.subscribe((type) => {
      const valueControl = this.discountForm.get('value');
      if (type === DiscountType.Percentage) {
        valueControl?.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(100),
        ]);
      } else {
        valueControl?.setValidators([
          Validators.required,
          Validators.min(0.01),
        ]);
      }
      valueControl?.updateValueAndValidity();
    });
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
        this.toast.error('Erreur lors du chargement des produits');
        this.isLoadingProducts.set(false);
      },
    });
  }

  onSubmit() {
    if (this.discountForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.discountForm.value;
    const discountData: DiscountDto = {
      code: formValue.code.toUpperCase().trim(),
      type: formValue.type,
      value: formValue.value,
      expiresAt: formValue.expiresAt,
      maxUses: formValue.maxUses,
      active: formValue.active,
      firstOrderOnly: formValue.firstOrderOnly,
      applicableProducts:
        formValue.applicableProducts?.length > 0
          ? formValue.applicableProducts
          : undefined,
      services: formValue.services?.length > 0 ? formValue.services : undefined,
    };

    this.discountService.createDiscount(discountData).subscribe({
      next: () => {
        this.toast.success('Code de réduction créé avec succès!');
        this.discountCreated.emit();
        this.resetForm();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error creating discount:', error);
        let errorMessage = 'Erreur lors de la création du code de réduction';

        if (error.status === 409) {
          errorMessage = 'Ce code de réduction existe déjà';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.toast.error(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }

  onCancel() {
    this.resetForm();
    this.close.emit();
  }

  private resetForm() {
    this.discountForm.reset({
      code: '',
      type: DiscountType.Percentage,
      value: null,
      expiresAt: null,
      maxUses: 1,
      active: true,
      firstOrderOnly: false,
      applicableProducts: [],
      services: [],
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.discountForm.controls).forEach((key) => {
      const control = this.discountForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.discountForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.discountForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength'])
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength'])
        return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      if (field.errors['min'])
        return `Valeur minimum: ${field.errors['min'].min}`;
      if (field.errors['max'])
        return `Valeur maximum: ${field.errors['max'].max}`;
    }
    return '';
  }

  generateRandomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    this.discountForm.patchValue({ code: result });
  }

  setQuickExpiry(days: number) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    this.discountForm.patchValue({ expiresAt: expiryDate });
  }

  clearExpiry() {
    this.discountForm.patchValue({ expiresAt: null });
  }
}
