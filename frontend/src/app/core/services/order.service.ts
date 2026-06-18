import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Order } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  placeOrder(shippingAddress: string): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.api}/orders`, { shippingAddress })
      .pipe(map(r => r.value));
  }

  getMyOrders(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.api}/orders`)
      .pipe(map(r => r.value));
  }

  getById(id: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.api}/orders/${id}`)
      .pipe(map(r => r.value));
  }
}
