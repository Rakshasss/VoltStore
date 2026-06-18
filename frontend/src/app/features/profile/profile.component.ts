import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container" style="padding-top:80px;padding-bottom:40px">
      <div class="profile-layout">
        <aside class="profile-sidebar">
          <div class="profile-avatar">{{ initials() }}</div>
          <div class="profile-email">{{ auth.currentUser()?.email }}</div>
          <div class="profile-role">
            <span class="badge badge-primary">{{ auth.currentUser()?.role }}</span>
          </div>
          <nav class="profile-nav">
            <div class="profile-nav-item" [class.active]="section()==='orders'" (click)="section.set('orders')">📦 My Orders</div>
            <div class="profile-nav-item" [class.active]="section()==='password'" (click)="section.set('password')">🔑 Change Password</div>
            <div class="profile-nav-item" (click)="auth.logout()">🚪 Log Out</div>
          </nav>
        </aside>

        <main class="profile-main">
          <!-- ORDERS -->
          @if (section() === 'orders') {
            <h2 class="section-h2">My Orders</h2>
            @if (loadingOrders()) {
              <div class="loading-wrap"><div class="spinner"></div></div>
            } @else if (orders().length === 0) {
              <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No orders yet</h3>
                <a routerLink="/products" class="btn btn-primary">Start Shopping</a>
              </div>
            } @else {
              @for (order of orders(); track order.id) {
                <div class="order-card" [class.expanded]="expandedOrder() === order.id">
                  <div class="order-header" (click)="toggleOrder(order.id)">
                    <div class="order-header-left">
                      <span class="order-id">#{{ order.id }}</span>
                      <span class="order-date">{{ order.createdAt?.substring(0,10) }}</span>
                    </div>
                    <div class="order-header-right">
                      <span class="status-badge status-{{ order.status?.toLowerCase() }}">{{ order.status }}</span>
                      <span class="order-total">₾{{ order.totalPrice?.toFixed(2) }}</span>
                      <span class="expand-icon">{{ expandedOrder() === order.id ? '▲' : '▼' }}</span>
                    </div>
                  </div>

                  @if (expandedOrder() === order.id) {
                    <div class="order-detail">
                      <!-- TRACKING -->
                      <div class="tracking-bar">
                        @for (step of trackingSteps; track step.status) {
                          <div class="tracking-step" [class.done]="isStatusDone(order.status, step.status)" [class.current]="order.status === step.status">
                            <div class="tracking-dot">{{ isStatusDone(order.status, step.status) ? '✅' : step.icon }}</div>
                            <div class="tracking-label">{{ step.label }}</div>
                          </div>
                          @if (!$last) { <div class="tracking-line" [class.done]="isStatusDone(order.status, step.status)"></div> }
                        }
                      </div>

                      @if (order.trackingNumber) {
                        <div class="tracking-info">
                          📦 Tracking: <strong>{{ order.trackingNumber }}</strong>
                          @if (order.trackingNotes) { <span> — {{ order.trackingNotes }}</span> }
                        </div>
                      }

                      @if (order.estimatedDeliveryDate) {
                        <div class="tracking-info">
                          🚚 Estimated delivery: <strong>{{ order.estimatedDeliveryDate?.substring(0,10) }}</strong>
                        </div>
                      }

                      <!-- ITEMS -->
                      <div class="order-items">
                        @for (item of order.items; track item.id) {
                          <div class="order-item">
                            <span class="order-item-name">{{ item.productName }}</span>
                            <span class="order-item-qty">× {{ item.quantity }}</span>
                            <span class="order-item-price">₾{{ item.subTotal?.toFixed(2) }}</span>
                          </div>
                        }
                      </div>

                      <div class="order-footer">
                        <div class="order-address">📍 {{ order.shippingAddress }}</div>
                        <div class="order-grand">
                          <span>Delivery: ₾{{ order.deliveryPrice?.toFixed(2) || '0.00' }}</span>
                          <strong>Grand Total: ₾{{ (order.totalPrice + (order.deliveryPrice || 0)).toFixed(2) }}</strong>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          }

          <!-- PASSWORD -->
          @if (section() === 'password') {
            <h2 class="section-h2">Change Password</h2>
            @if (pwAlert()) {
              <div class="alert" [class.alert-error]="pwAlertType()==='error'" [class.alert-success]="pwAlertType()==='success'">{{ pwAlert() }}</div>
            }
            <div style="max-width:400px">
              <div class="form-group"><label>Current Password</label><input class="form-control" type="password" [(ngModel)]="oldPw"></div>
              <div class="form-group"><label>New Password</label><input class="form-control" type="password" [(ngModel)]="newPw"></div>
              <div class="form-group"><label>Confirm New Password</label><input class="form-control" type="password" [(ngModel)]="confirmPw"></div>
              <button class="btn btn-primary" (click)="changePw()">Update Password</button>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .profile-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
    .profile-sidebar { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 24px; align-self: start; position: sticky; top: 80px; }
    .profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--primary); color: #1e2130; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .profile-email { font-size: 13px; color: #888; margin-bottom: 8px; word-break: break-all; }
    .profile-role { margin-bottom: 16px; }
    .profile-nav { display: flex; flex-direction: column; gap: 4px; }
    .profile-nav-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.15s; color: #555; }
    .profile-nav-item:hover, .profile-nav-item.active { background: #fff8e6; color: #d97706; }
    .profile-main { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 28px; }
    .section-h2 { font-size: 20px; font-weight: 700; margin-bottom: 24px; }

    /* ORDER CARD */
    .order-card { border: 1px solid #e0e0e0; border-radius: 10px; margin-bottom: 12px; overflow: hidden; transition: all 0.2s; }
    .order-card:hover { border-color: #d97706; }
    .order-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; }
    .order-header-left { display: flex; align-items: center; gap: 12px; }
    .order-id { font-weight: 700; font-family: monospace; font-size: 14px; }
    .order-date { font-size: 12px; color: #888; }
    .order-header-right { display: flex; align-items: center; gap: 12px; }
    .order-total { font-weight: 700; color: #d97706; }
    .expand-icon { color: #888; font-size: 12px; }

    /* STATUS BADGES */
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .status-pending    { background: #fff7e6; color: #d97706; }
    .status-paid       { background: #e6f9f0; color: #15803d; }
    .status-processing { background: #eff6ff; color: #1d4ed8; }
    .status-shipped    { background: #f0f9ff; color: #0284c7; }
    .status-delivered  { background: #e6f9f0; color: #15803d; }
    .status-cancelled  { background: #fee2e2; color: #dc2626; }

    /* ORDER DETAIL */
    .order-detail { border-top: 1px solid #e0e0e0; padding: 20px; }

    /* TRACKING BAR */
    .tracking-bar { display: flex; align-items: center; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px; }
    .tracking-step { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 70px; }
    .tracking-dot { font-size: 20px; width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .tracking-step.done .tracking-dot { background: #e6f9f0; }
    .tracking-step.current .tracking-dot { background: #fff8e6; border: 2px solid #d97706; }
    .tracking-label { font-size: 11px; color: #888; text-align: center; font-weight: 500; }
    .tracking-step.done .tracking-label { color: #15803d; }
    .tracking-step.current .tracking-label { color: #d97706; font-weight: 700; }
    .tracking-line { flex: 1; height: 2px; background: #e0e0e0; min-width: 20px; }
    .tracking-line.done { background: #15803d; }

    .tracking-info { font-size: 13px; color: #555; margin-bottom: 8px; padding: 8px 12px; background: #f9f9f9; border-radius: 6px; }

    .order-items { margin: 12px 0; }
    .order-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .order-item-name { flex: 1; }
    .order-item-qty { color: #888; }
    .order-item-price { font-weight: 600; color: #d97706; }

    .order-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; flex-wrap: wrap; gap: 8px; }
    .order-address { font-size: 12px; color: #888; }
    .order-grand { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; font-size: 13px; color: #555; }
    .order-grand strong { font-size: 16px; color: #1e2130; }

    @media (max-width: 768px) { .profile-layout { grid-template-columns: 1fr; } .profile-sidebar { position: static; } }
  `]
})
export class ProfileComponent implements OnInit {
  section = signal('orders');
  orders = signal<any[]>([]);
  loadingOrders = signal(true);
  expandedOrder = signal<number | null>(null);
  oldPw = ''; newPw = ''; confirmPw = '';
  pwAlert = signal('');
  pwAlertType = signal<'error'|'success'>('error');

  trackingSteps = [
    { status: 'Pending',    icon: '🕐', label: 'Ordered' },
    { status: 'Paid',       icon: '💳', label: 'Paid' },
    { status: 'Processing', icon: '📦', label: 'Processing' },
    { status: 'Shipped',    icon: '🚚', label: 'Shipped' },
    { status: 'Delivered',  icon: '✅', label: 'Delivered' },
  ];

  statusOrder = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered'];

  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/orders`).subscribe({
      next: res => {
        const data = res?.value || res?.data;
        this.orders.set(data?.orders || data || []);
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false)
    });
  }

  initials(): string {
    return (this.auth.currentUser()?.email || '?').charAt(0).toUpperCase();
  }

  toggleOrder(id: number): void {
    this.expandedOrder.set(this.expandedOrder() === id ? null : id);
  }

  isStatusDone(currentStatus: string, checkStatus: string): boolean {
    const current = this.statusOrder.indexOf(currentStatus);
    const check   = this.statusOrder.indexOf(checkStatus);
    return current >= check && current !== -1;
  }

  changePw(): void {
    if (!this.oldPw || !this.newPw || !this.confirmPw) {
      this.pwAlert.set('Fill all fields.'); this.pwAlertType.set('error'); return;
    }
    if (this.newPw !== this.confirmPw) {
      this.pwAlert.set('Passwords do not match.'); this.pwAlertType.set('error'); return;
    }
    this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword: this.oldPw, newPassword: this.newPw, confirmPassword: this.confirmPw
    }).subscribe({
      next: () => { this.pwAlert.set('Password changed!'); this.pwAlertType.set('success'); },
      error: err => { this.pwAlert.set(err?.error?.message || 'Failed.'); this.pwAlertType.set('error'); }
    });
  }
}
