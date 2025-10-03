import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; // Update with your NestJS API URL

  constructor() {}

  // Get all products
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  // Add a new product with file uploads
  addProduct(
    productData: Partial<Product>,
    pictures?: File[]
  ): Observable<Product> {
    const formData = new FormData();

    // Append product fields
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'pictures') {
        formData.append(key, value as any);
      }
    });

    // Append pictures if provided
    if (pictures && pictures.length) {
      pictures.forEach((file) => formData.append('pictures', file));
    }

    return this.http.post<Product>(`${this.apiUrl}/products`, formData);
  }

  // Update a product (for editing, we'll use JSON since files might not change)
  updateProduct(
    id: string,
    productData: Partial<Product>,
    newPictures?: File[]
  ): Observable<Product> {
    if (newPictures && newPictures.length > 0) {
      // If new pictures are provided, use FormData
      const formData = new FormData();

      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'pictures') {
          formData.append(key, value as any);
        }
      });

      newPictures.forEach((file) => formData.append('pictures', file));

      return this.http.patch<Product>(
        `${this.apiUrl}/products/${id}`,
        formData
      );
    } else {
      // If no new pictures, use JSON
      return this.http.patch<Product>(
        `${this.apiUrl}/products/${id}`,
        productData
      );
    }
  }

  // Delete a product
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  // Get product by ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }
}
