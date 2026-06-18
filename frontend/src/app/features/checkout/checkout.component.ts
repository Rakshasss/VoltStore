import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

interface DeliveryMethod { id: number; name: string; description: string; price: number; estimatedDays: number; }

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container" style="padding-top:80px;padding-bottom:40px">
      <h1 class="page-h1">Checkout</h1>

      @if (success()) {
        <div class="success-box">
          <div style="font-size:56px;margin-bottom:16px">🎉</div>
          <h2>Order Placed!</h2>
          <p>Order <strong>#{{ orderId() }}</strong> received!</p>
          <p style="margin-top:8px;font-size:13px;color:#888">
            Estimated delivery: <strong>{{ estimatedDate() }}</strong>
          </p>
          <div style="display:flex;gap:12px;justify-content:center;margin-top:24px">
            <a routerLink="/profile" class="btn btn-primary">Track Order</a>
            <a routerLink="/products" class="btn btn-outline">Continue Shopping</a>
          </div>
        </div>
      } @else {
        <div class="checkout-layout">
          <div class="checkout-left">
            @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

            <!-- DELIVERY ADDRESS -->
            <div class="checkout-section">
              <h2>Delivery Details</h2>
              <div class="form-group">
                <label>Full Name *</label>
                <input class="form-control" [(ngModel)]="fullName" placeholder="John Doe">
              </div>
              <div class="form-group">
                <label>Phone Number *</label>
                <input class="form-control" [(ngModel)]="phone" placeholder="+995 555 123 456">
              </div>
              <div class="form-group">
                <label>Delivery Address *</label>
                <input class="form-control" [(ngModel)]="address" placeholder="Street, building, apartment, city">
              </div>
              <div class="form-group">
                <label>Notes (optional)</label>
                <textarea class="form-control" [(ngModel)]="notes" placeholder="Gate code, instructions..."></textarea>
              </div>
            </div>

            <!-- DELIVERY METHOD -->
            <div class="checkout-section">
              <h2>Delivery Method</h2>
              <div class="delivery-options">
                @for (d of deliveryMethods(); track d.id) {
                  <div class="delivery-opt" [class.selected]="selectedDelivery()?.id === d.id"
                       (click)="selectedDelivery.set(d)">
                    <div class="delivery-opt-left">
                      <div class="delivery-opt-name">{{ d.name }}</div>
                      <div class="delivery-opt-desc">{{ d.description }}</div>
                    </div>
                    <div class="delivery-opt-price">
                      {{ d.price === 0 ? 'FREE' : '₾' + d.price.toFixed(2) }}
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- PAYMENT -->
            <div class="checkout-section">
              <h2>Payment Method</h2>
              <div class="payment-tabs">
                <button class="pay-tab" [class.active]="payMethod === 'Card'" (click)="payMethod = 'Card'">
                  💳 Credit/Debit Card
                </button>
                <button class="pay-tab" [class.active]="payMethod === 'Cash'" (click)="payMethod = 'Cash'">
                  💵 Cash on Delivery
                </button>
              </div>

              @if (payMethod === 'Card') {
                <div class="card-form">
                  <div class="card-preview">
                    <div class="card-preview-inner">
                      <div class="card-chip">💳</div>
                      <div class="card-number-display">{{ formatDisplayCard() }}</div>
                      <div class="card-bottom">
                        <div>
                          <div class="card-label">Card Holder</div>
                          <div class="card-val">{{ cardHolder || 'YOUR NAME' }}</div>
                        </div>
                        <div>
                          <div class="card-label">Expires</div>
                          <div class="card-val">{{ cardExpiry || 'MM/YY' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="form-group" style="margin-top:16px">
                    <label>Card Number *</label>
                    <input class="form-control" [(ngModel)]="cardNumber" placeholder="1234 5678 9012 3456"
                           maxlength="19" (input)="formatCard()">
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
                    <div class="form-group">
                      <label>Expiry Date *</label>
                      <input class="form-control" [(ngModel)]="cardExpiry" placeholder="MM/YY"
                             maxlength="5" (input)="formatExpiry()">
                    </div>
                    <div class="form-group">
                      <label>CVV *</label>
                      <input class="form-control" [(ngModel)]="cardCvv" placeholder="123" maxlength="4" type="password">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Name on Card *</label>
                    <input class="form-control" [(ngModel)]="cardHolder" placeholder="John Doe">
                  </div>
                  <div class="sim-notice">🔒 This is a simulated payment — no real charge will be made</div>
                </div>
              } @else {
                <div class="cash-notice">
                  <span>💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives. Please have exact change ready.</p>
                  </div>
                </div>
              }
            </div>

            <button class="btn btn-primary" style="width:100%;padding:16px;font-size:16px"
                    [disabled]="loading()" (click)="placeOrder()">
              @if (loading()) { <div class="spinner"></div> } @else { Place Order ₾{{ grandTotal().toFixed(2) }} → }
            </button>
          </div>

          <!-- ORDER SUMMARY -->
          <div class="order-summary">
            <h3>Order Summary</h3>
            @for (item of cart.items(); track item.productId) {
              <div class="sum-item">
                <span class="sum-name">{{ item.productName }} × {{ item.quantity }}</span>
                <span>₾{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            }
            <div class="sum-divider"></div>
            <div class="sum-row"><span>Subtotal</span><span>₾{{ cart.total().toFixed(2) }}</span></div>
            <div class="sum-row">
              <span>Delivery</span>
              <span>{{ selectedDelivery() ? (selectedDelivery()!.price === 0 ? 'FREE' : '₾' + selectedDelivery()!.price.toFixed(2)) : '—' }}</span>
            </div>
            <div class="sum-row total"><span>Total</span><span>₾{{ grandTotal().toFixed(2) }}</span></div>
            @if (selectedDelivery()) {
              <div class="delivery-info">
                🚚 {{ selectedDelivery()!.name }}<br>
                <small>{{ selectedDelivery()!.description }}</small>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-h1 { font-size: 26px; font-weight: 700; margin-bottom: 28px; }
    .checkout-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
    .checkout-left { display: flex; flex-direction: column; gap: 20px; }
    .checkout-section { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 24px; }
    .checkout-section h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #d97706; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0; }

    .delivery-options { display: flex; flex-direction: column; gap: 10px; }
    .delivery-opt { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border: 1.5px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .delivery-opt:hover { border-color: #d97706; }
    .delivery-opt.selected { border-color: #d97706; background: #fffbf0; }
    .delivery-opt-name { font-weight: 600; font-size: 14px; }
    .delivery-opt-desc { font-size: 12px; color: #888; margin-top: 2px; }
    .delivery-opt-price { font-weight: 700; color: #d97706; white-space: nowrap; }

    .payment-tabs { display: flex; gap: 10px; margin-bottom: 16px; }
    .pay-tab { flex: 1; padding: 10px; border: 1.5px solid #e0e0e0; border-radius: 8px; background: white; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; transition: all 0.2s; }
    .pay-tab.active { border-color: #d97706; background: #fffbf0; color: #d97706; }

    .card-preview { background: linear-gradient(135deg, #1e2130 0%, #2d3250 100%); border-radius: 12px; padding: 20px 24px; color: white; margin-bottom: 4px; }
    .card-preview-inner { }
    .card-chip { font-size: 24px; margin-bottom: 16px; }
    .card-number-display { font-size: 18px; font-weight: 700; letter-spacing: 3px; margin-bottom: 16px; font-family: monospace; }
    .card-bottom { display: flex; gap: 32px; }
    .card-label { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
    .card-val { font-size: 13px; font-weight: 600; margin-top: 2px; }
    .sim-notice { background: #e6f9f0; border: 1px solid #86efac; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #15803d; margin-top: 8px; }

    .cash-notice { display: flex; align-items: flex-start; gap: 14px; background: #fffbf0; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; }
    .cash-notice span { font-size: 28px; }
    .cash-notice strong { display: block; font-size: 14px; margin-bottom: 4px; }
    .cash-notice p { font-size: 13px; color: #888; margin: 0; }

    .order-summary { background: white; border: 1.5px solid #d97706; border-radius: 10px; padding: 24px; position: sticky; top: 80px; }
    .order-summary h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .sum-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f5f5f5; color: #555; }
    .sum-name { flex: 1; padding-right: 12px; }
    .sum-divider { height: 1px; background: #e0e0e0; margin: 8px 0; }
    .sum-row { display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 8px; }
    .sum-row.total { font-size: 18px; font-weight: 700; color: #1e2130; border-top: 1px solid #e0e0e0; padding-top: 12px; margin-top: 4px; }
    .delivery-info { margin-top: 12px; background: #f0fdf4; border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #15803d; line-height: 1.5; }

    .success-box { max-width: 480px; margin: 40px auto; text-align: center; background: white; border-radius: 16px; padding: 48px; border: 1px solid #e0e0e0; }
    .success-box h2 { font-size: 26px; font-weight: 800; color: #d97706; margin-bottom: 12px; }
    .success-box p { color: #555; font-size: 15px; }

    @media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutComponent implements OnInit {
  address = ''; fullName = ''; phone = ''; notes = '';
  payMethod = 'Card';
  cardNumber = ''; cardExpiry = ''; cardCvv = ''; cardHolder = '';
  loading = signal(false);
  error = signal('');
  success = signal(false);
  orderId = signal<number | null>(null);
  estimatedDate = signal('');
  deliveryMethods = signal<DeliveryMethod[]>([]);
  selectedDelivery = signal<DeliveryMethod | null>(null);

  grandTotal = () => this.cart.total() + (this.selectedDelivery()?.price || 0);

  constructor(public cart: CartService, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) { this.router.navigate(['/auth']); return; }
    if (!this.cart.count()) { this.router.navigate(['/cart']); return; }

    this.http.get<any>(`${environment.apiUrl}/delivery-methods`).subscribe(res => {
      const methods = res?.value || res?.data || [];
      this.deliveryMethods.set(methods);
      if (methods.length) this.selectedDelivery.set(methods[1] || methods[0]); // default to Standard
    });
  }

  formatCard(): void {
    this.cardNumber = this.cardNumber.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
  }

  formatExpiry(): void {
    let v = this.cardExpiry.replace(/\D/g, '');
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
    this.cardExpiry = v;
  }

  formatDisplayCard(): string {
    const clean = this.cardNumber.replace(/\s/g, '');
    const padded = clean.padEnd(16, '•');
    return padded.replace(/(.{4})/g, '$1 ').trim();
  }

  placeOrder(): void {
    if (!this.address.trim()) { this.error.set('Please enter delivery address.'); return; }
    if (!this.fullName.trim()) { this.error.set('Please enter your full name.'); return; }
    if (!this.phone.trim())   { this.error.set('Please enter phone number.'); return; }
    if (!this.selectedDelivery()) { this.error.set('Please select delivery method.'); return; }
    if (this.payMethod === 'Card') {
      if (!this.cardNumber || !this.cardExpiry || !this.cardCvv || !this.cardHolder) {
        this.error.set('Please fill in all card details.'); return;
      }
    }

    this.loading.set(true);
    this.error.set('');

    const fullAddress = `${this.fullName}, ${this.phone}, ${this.address}${this.notes ? ' (' + this.notes + ')' : ''}`;

    this.http.post<any>(`${environment.apiUrl}/orders`, {
      shippingAddress: fullAddress,
      paymentMethod: this.payMethod,
      deliveryMethodId: this.selectedDelivery()!.id,
      cardNumber: this.payMethod === 'Card' ? this.cardNumber : null,
      cardExpiry: this.payMethod === 'Card' ? this.cardExpiry : null,
      cardCvv:    this.payMethod === 'Card' ? this.cardCvv : null,
      cardHolder: this.payMethod === 'Card' ? this.cardHolder : null,
    }).subscribe({
      next: res => {
        const order = res?.value || res?.data;
        this.cart.clear();
        this.orderId.set(order?.id || null);
        const days = this.selectedDelivery()!.estimatedDays;
        const date = new Date();
        date.setDate(date.getDate() + (days || 1));
        this.estimatedDate.set(days === 0 ? 'Today (Store Pickup)' : date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
        this.success.set(true);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Failed to place order. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
