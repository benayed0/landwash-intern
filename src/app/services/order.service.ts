import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/orders';

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/personal`);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/one/${id}`);
  }

  updateOrder(id: string, orderData: Partial<Order>): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}`, orderData);
  }

  deleteOrder(id: string): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${id}`);
  }
}
