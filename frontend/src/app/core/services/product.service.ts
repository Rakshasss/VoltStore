import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Category, PagedResult, Product } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByCategory(categoryId: number, page = 1): Observable<PagedResult<Product>> {
    return this.http.get<ApiResponse<PagedResult<Product>>>(
      `${this.api}/products/category/${categoryId}?page=${page}`
    ).pipe(map(r => r.value));
  }

  getById(id: number): Observable<Product> {
    return this.http.get<ApiResponse<Product>>(`${this.api}/products/${id}`)
      .pipe(map(r => r.value));
  }

  search(q: string, page = 1): Observable<PagedResult<Product>> {
    return this.http.get<ApiResponse<PagedResult<Product>>>(
      `${this.api}/products/search?q=${encodeURIComponent(q)}&page=${page}`
    ).pipe(map(r => r.value));
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.api}/products/categories`)
      .pipe(map(r => r.value));
  }

  getCategoryTree(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.api}/products/categories/tree`)
      .pipe(map(r => r.value));
  }

  getSuggestions(q: string): Observable<Product[]> {
    return this.http.get<ApiResponse<Product[]>>(
      `${this.api}/products/search/suggestions?q=${encodeURIComponent(q)}`
    ).pipe(map(r => r.value || []));
  }
}
