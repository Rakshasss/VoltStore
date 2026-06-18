import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container" style="padding-top:116px; padding-bottom:40px">
      <h1 class="page-h1">🛒 Shopping Cart</h1>

      @if (cart.items().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
          <a routerLink="/products" class="btn btn-primary">Browse Products</a>
        </div>
      } @else {
        <div class="cart-layout">
          <div class="cart-items">
            @for (item of cart.items(); track item.productId) {
              <div class="cart-item">
                <img [src]="item.imageUrl || fallback" [alt]="item.productName" class="item-img" (error)="onErr($event)">
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="item-price">₾{{ item.price.toFixed(2) }} each</div>
                </div>
                <div class="item-controls">
                  <div class="qty-controls">
                    <button (click)="cart.updateQty(item.productId, item.quantity - 1)">−</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="cart.updateQty(item.productId, item.quantity + 1)">+</button>
                  </div>
                  <div class="item-subtotal">₾{{ (item.price * item.quantity).toFixed(2) }}</div>
                  <button class="remove-btn" (click)="cart.remove(item.productId)">✕</button>
                </div>
              </div>
            }
          </div>

          <div class="cart-summary">
            <h3>Order Summary</h3>
            <div class="sum-row"><span>Subtotal</span><span>₾{{ cart.total().toFixed(2) }}</span></div>
            <div class="sum-row"><span>Delivery</span><span>₾5.00</span></div>
            <div class="sum-row total"><span>Total</span><span>₾{{ (cart.total() + 5).toFixed(2) }}</span></div>
            <button class="btn btn-primary" style="width:100%;padding:14px;margin-top:16px;font-size:15px" (click)="checkout()">
              Checkout →
            </button>
            <button class="btn btn-outline" style="width:100%;padding:10px;margin-top:8px" (click)="cart.clear()">
              Clear Cart
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-h1 { font-size: 26px; font-weight: 700; margin-bottom: 28px; }
    .cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
    .cart-item { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
    .item-img { width: 80px; height: 80px; object-fit: contain; border-radius: 8px; background: #f5f5f5; padding: 4px; flex-shrink: 0; }
    .item-info { flex: 1; min-width: 0; }
    .item-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .item-price { font-size: 13px; color: #888; }
    .item-controls { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .qty-controls { display: flex; align-items: center; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
    .qty-controls button { width: 30px; height: 30px; background: #f5f5f5; border: none; cursor: pointer; font-size: 16px; }
    .qty-controls button:hover { background: #e0e0e0; }
    .qty-controls span { width: 36px; text-align: center; font-weight: 600; font-size: 14px; }
    .item-subtotal { font-size: 16px; font-weight: 700; color: #e85d04; min-width: 80px; text-align: right; }
    .remove-btn { background: none; border: none; color: #bbb; cursor: pointer; font-size: 16px; transition: color 0.2s; }
    .remove-btn:hover { color: #dc2626; }
    .cart-summary { background: white; border: 1.5px solid #e85d04; border-radius: 10px; padding: 24px; position: sticky; top: 120px; }
    .cart-summary h3 { font-size: 16px; font-weight: 700; margin-bottom: 20px; }
    .sum-row { display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 10px; }
    .sum-row.total { font-size: 18px; font-weight: 700; color: #222; border-top: 1px solid #e0e0e0; padding-top: 12px; margin-top: 4px; }
    @media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
  `]
})
export class CartComponent {
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200';
  constructor(public cart: CartService, private router: Router) {}
  checkout(): void { this.router.navigate(['/checkout']); }
  onErr(e: Event): void { (e.target as HTMLImageElement).src = this.fallback; }
}
