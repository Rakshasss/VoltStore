import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly KEY = 'voltstore_cart';
  private api = environment.apiUrl;

  items = signal<CartItem[]>(this.load());
  count  = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  total  = computed(() => this.items().reduce((s, i) => s + i.price * i.quantity, 0));

  constructor(private http: HttpClient) {}

  async syncAfterLogin(): Promise<void> {
    const local = this.load();
    for (const item of local) {
      try { await this.http.post(`${this.api}/cart`, { productId: item.productId, quantity: item.quantity }).toPromise(); } catch {}
    }
    await this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    if (!localStorage.getItem('token')) return;
    try {
      const res: any = await this.http.get(`${this.api}/cart`).toPromise();
      const data = res?.value || res?.data;
      if (data?.items) {
        const items: CartItem[] = data.items.map((i: any) => ({
          id: i.id, productId: i.productId, productName: i.productName,
          price: i.productPrice, quantity: i.quantity, imageUrl: i.productThumbnailUrl
        }));
        this.items.set(items);
        this.save();
      }
    } catch {}
  }

  add(product: { id: number; name: string; price: number; imageUrl?: string }): void {
    const current = this.items();
    const existing = current.find(i => i.productId === product.id);
    if (existing) {
      this.items.set(current.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      this.items.set([...current, { id: Date.now(), productId: product.id, productName: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl }]);
    }
    this.save();
    if (localStorage.getItem('token')) {
      this.http.post(`${this.api}/cart`, { productId: product.id, quantity: 1 }).subscribe({ error: () => {} });
    }
  }

  remove(productId: number): void {
    const item = this.items().find(i => i.productId === productId);
    this.items.set(this.items().filter(i => i.productId !== productId));
    this.save();
    if (localStorage.getItem('token') && item) {
      this.http.delete(`${this.api}/cart/${item.id}`).subscribe({ error: () => {} });
    }
  }

  updateQty(productId: number, qty: number): void {
    if (qty < 1) { this.remove(productId); return; }
    const item = this.items().find(i => i.productId === productId);
    this.items.set(this.items().map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    this.save();
    if (localStorage.getItem('token') && item) {
      this.http.put(`${this.api}/cart/${item.id}`, { quantity: qty }).subscribe({ error: () => {} });
    }
  }

  clear(): void {
    this.items.set([]);
    this.save();
    if (localStorage.getItem('token')) {
      this.http.delete(`${this.api}/cart`).subscribe({ error: () => {} });
    }
  }

  private save(): void { localStorage.setItem(this.KEY, JSON.stringify(this.items())); }
  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; }
  }
}
