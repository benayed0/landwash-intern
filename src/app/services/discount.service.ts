import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { DiscountDto, Discount } from '../models/discount.model';

@Injectable({
  providedIn: 'root',
})
export class DiscountService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/discounts';

  getAllDiscounts(): Observable<Discount[]> {
    return this.http.get<Discount[]>(this.apiUrl);
  }
  createDiscount(creationData: DiscountDto): Observable<Discount> {
    return this.http.post<Discount>(`${this.apiUrl}`, creationData);
  }
  updateDiscount(
    id: string,
    updateData: Partial<DiscountDto>
  ): Observable<Discount> {
    return this.http.patch<Discount>(`${this.apiUrl}/${id}`, updateData);
  }

  deleteDiscount(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
