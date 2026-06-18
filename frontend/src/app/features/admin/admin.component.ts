import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="padding-top:80px;padding-bottom:40px">
      <h1 class="page-h1">⚙️ Admin Panel</h1>
      <p class="page-sub">Logged in as: <strong>{{ auth.currentUser()?.role }}</strong></p>

      <div class="admin-tabs">
        <button class="admin-tab" [class.active]="tab()==='products'" (click)="tab.set('products');loadProducts()">Products</button>
        <button class="admin-tab" [class.active]="tab()==='categories'" (click)="tab.set('categories');loadCategories()">Categories</button>
        <button class="admin-tab" [class.active]="tab()==='orders'" (click)="tab.set('orders');loadOrders()">Orders</button>
        @if (auth.isAdmin()) {
          <button class="admin-tab" [class.active]="tab()==='users'" (click)="tab.set('users');loadUsers()">Users</button>
        }
      </div>

      <!-- PRODUCTS -->
      @if (tab() === 'products') {
        <div class="tab-header">
          <input class="form-control" style="max-width:280px" placeholder="Search..." [(ngModel)]="productSearch">
          @if (auth.isAdmin()) {
            <button class="btn btn-primary" (click)="openProductModal()">+ Add Product</button>
          }
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              @for (p of filteredProducts(); track p.id) {
                <tr>
                  <td><img [src]="p.thumbnailUrl || fallback" class="table-img" (error)="onErr($event)" [alt]="p.name"></td>
                  <td class="td-name">{{ p.name }}</td>
                  <td class="td-price">₾{{ p.price?.toFixed(2) }}</td>
                  <td><span class="badge" [class.badge-success]="p.stock>0" [class.badge-danger]="p.stock===0">{{ p.stock }}</span></td>
                  <td>
                    <div class="action-btns">
                      @if (auth.isAdmin()) {
                        <button class="action-btn edit" (click)="editProduct(p)">Edit</button>
                        <button class="action-btn delete" (click)="deleteProduct(p)">Delete</button>
                      }
                      <button class="action-btn spec" (click)="fetchSpecs(p)" [disabled]="fetchingSpec() === p.id">
                        {{ fetchingSpec() === p.id ? '⏳' : '🔍 Fetch Specs' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- CATEGORIES -->
      @if (tab() === 'categories') {
        <div class="tab-header">
          <span style="color:#888;font-size:14px">Manage categories</span>
          @if (auth.isAdmin()) {
            <button class="btn btn-primary" (click)="openCatModal()">+ Add Category</button>
          }
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Name</th><th>Parent</th><th>Actions</th></tr></thead>
            <tbody>
              @for (c of categories(); track c.id) {
                <tr>
                  <td style="font-family:monospace;color:#888">#{{ c.id }}</td>
                  <td><strong>{{ c.name }}</strong></td>
                  <td style="color:#888">{{ getParentName(c.parentCategoryId) }}</td>
                  <td>
                    @if (auth.isAdmin()) {
                      <div class="action-btns">
                        <button class="action-btn edit" (click)="editCat(c)">Edit</button>
                        <button class="action-btn delete" (click)="deleteCat(c)">Delete</button>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ORDERS -->
      @if (tab() === 'orders') {
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>User</th><th>Status</th><th>Total</th><th>Delivery</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              @for (o of orders(); track o.id) {
                <tr>
                  <td style="font-family:monospace">#{{ o.id }}</td>
                  <td style="font-size:12px;color:#888">{{ o.userEmail }}</td>
                  <td>
                    <select class="status-select" [ngModel]="o.status" (ngModelChange)="updateOrderStatus(o, $event)">
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                  <td class="td-price">₾{{ o.totalPrice?.toFixed(2) }}</td>
                  <td style="font-size:12px;color:#888">{{ o.deliveryMethodName || '—' }}</td>
                  <td style="font-size:12px;color:#888">{{ o.createdAt?.substring(0,10) }}</td>
                  <td>
                    <button class="action-btn edit" (click)="openTrackingModal(o)">📦 Track</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- USERS -->
      @if (tab() === 'users' && auth.isAdmin()) {
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th></tr></thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td style="font-family:monospace;color:#888">#{{ u.id }}</td>
                  <td>{{ u.email }}</td>
                  <td><span class="badge" [class.badge-danger]="u.role==='Admin'" [class.badge-primary]="u.role==='Manager'" [class.badge-success]="u.role==='Customer'">{{ u.role }}</span></td>
                  <td>{{ u.isVerified ? '✅' : '❌' }}</td>
                  <td style="font-size:12px;color:#888">{{ u.createdAt?.substring(0,10) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- PRODUCT MODAL -->
    @if (showProductModal()) {
      <div class="modal-overlay" (click)="showProductModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">{{ editingProduct() ? 'Edit Product' : 'Add Product' }}</h3>
          @if (modalError()) { <div class="alert alert-error">{{ modalError() }}</div> }
          <div class="form-group"><label>Name *</label><input class="form-control" [(ngModel)]="pForm.name"></div>
          <div class="form-group"><label>Description</label><textarea class="form-control" [(ngModel)]="pForm.description"></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group"><label>Price (₾) *</label><input class="form-control" type="number" [(ngModel)]="pForm.price"></div>
            <div class="form-group"><label>Stock *</label><input class="form-control" type="number" [(ngModel)]="pForm.stock"></div>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select class="form-control" [(ngModel)]="pForm.categoryId">
              <option value="">Select category...</option>
              @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="form-group"><label>Image URL</label><input class="form-control" [(ngModel)]="pForm.imageUrl"></div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showProductModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveProduct()">Save</button>
          </div>
        </div>
      </div>
    }

    <!-- CATEGORY MODAL -->
    @if (showCatModal()) {
      <div class="modal-overlay" (click)="showCatModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">{{ editingCat() ? 'Edit Category' : 'Add Category' }}</h3>
          @if (modalError()) { <div class="alert alert-error">{{ modalError() }}</div> }
          <div class="form-group"><label>Name *</label><input class="form-control" [(ngModel)]="cForm.name"></div>
          <div class="form-group">
            <label>Parent Category</label>
            <select class="form-control" [(ngModel)]="cForm.parentCategoryId">
              <option [value]="null">None (top-level)</option>
              @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showCatModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveCat()">Save</button>
          </div>
        </div>
      </div>
    }

    <!-- TRACKING MODAL -->
    @if (showTrackingModal()) {
      <div class="modal-overlay" (click)="showTrackingModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">📦 Update Tracking — Order #{{ trackingOrder()?.id }}</h3>
          @if (modalError()) { <div class="alert alert-error">{{ modalError() }}</div> }
          <div class="form-group">
            <label>Tracking Number</label>
            <input class="form-control" [(ngModel)]="trackingNumber" placeholder="e.g. GE123456789">
          </div>
          <div class="form-group">
            <label>Tracking Notes</label>
            <textarea class="form-control" [(ngModel)]="trackingNotes" placeholder="e.g. Package at sorting facility in Tbilisi"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showTrackingModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveTracking()">Save Tracking</button>
          </div>
        </div>
      </div>
    }

    <!-- SPEC RESULT TOAST -->
    @if (specToast()) {
      <div class="spec-toast">{{ specToast() }}</div>
    }
  `,
  styles: [`
    .page-h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: #888; margin-bottom: 24px; }
    .admin-tabs { display: flex; border-bottom: 1px solid #e0e0e0; margin-bottom: 24px; }
    .admin-tab { padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; color: #888; transition: all 0.2s; }
    .admin-tab.active { color: #d97706; border-bottom-color: #d97706; }
    .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
    .table-wrap { background: white; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { background: #f9f9f9; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #e0e0e0; }
    .admin-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: #fafafa; }
    .table-img { width: 44px; height: 44px; object-fit: contain; border-radius: 6px; background: #f5f5f5; }
    .td-name { font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-price { color: #d97706; font-weight: 700; }
    .action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .action-btn { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.15s; font-family: 'Inter', sans-serif; }
    .action-btn.edit   { background: #fff8e6; border-color: #fed7aa; color: #d97706; }
    .action-btn.delete { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
    .action-btn.spec   { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .status-select { padding: 4px 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif; cursor: pointer; background: white; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal-title { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .spec-toast { position: fixed; bottom: 24px; right: 24px; background: #1e2130; color: white; padding: 12px 20px; border-radius: 10px; font-size: 13px; z-index: 9999; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminComponent implements OnInit {
  tab = signal('products');
  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  orders = signal<any[]>([]);
  users = signal<any[]>([]);
  productSearch = '';
  showProductModal = signal(false);
  showCatModal = signal(false);
  showTrackingModal = signal(false);
  editingProduct = signal<any>(null);
  editingCat = signal<any>(null);
  trackingOrder = signal<any>(null);
  modalError = signal('');
  fetchingSpec = signal<number | null>(null);
  specToast = signal('');
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100';
  trackingNumber = ''; trackingNotes = '';
  pForm: any = { name: '', description: '', price: null, stock: 0, categoryId: '', imageUrl: '' };
  cForm: any = { name: '', parentCategoryId: null };

  filteredProducts() {
    const q = this.productSearch.toLowerCase();
    return q ? this.products().filter(p => p.name?.toLowerCase().includes(q)) : this.products();
  }

  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void { this.loadCategories(); this.loadProducts(); }

  loadProducts(): void {
    const allCats = this.categories().filter((c: any) => !c.parentCategoryId);
    const cats = allCats.length ? allCats.map((c: any) => c.id) : [1,2,3,4,5,6];
    const all: any[] = [];
    let done = 0;
    cats.forEach((id: number) => {
      this.http.get<any>(`${environment.apiUrl}/products/category/${id}?page=1`).subscribe(res => {
        const items = res?.value?.items || res?.data?.items || [];
        items.forEach((p: any) => { if (!all.find((e: any) => e.id === p.id)) all.push(p); });
        if (++done === cats.length) this.products.set(all);
      });
    });
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe(res => {
      this.categories.set(res?.value || res?.data || []);
    });
  }

  loadOrders(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/orders`).subscribe(res => {
      const data = res?.value || res?.data;
      this.orders.set(data?.orders || data || []);
    });
  }

  loadUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/users`).subscribe(res => {
      const data = res?.value || res?.data;
      this.users.set(data?.users || data || []);
    });
  }

  getParentName(parentId?: number | null): string {
    if (!parentId) return '—';
    return this.categories().find((c: any) => c.id === parentId)?.name || '—';
  }

  updateOrderStatus(order: any, status: string): void {
    this.http.put(`${environment.apiUrl}/admin/orders/${order.id}/status`, { status }).subscribe({
      next: () => { order.status = status; this.showSpecToast(`Order #${order.id} → ${status}`); },
      error: err => alert(err?.error?.message || 'Failed to update status')
    });
  }

  openTrackingModal(order: any): void {
    this.trackingOrder.set(order);
    this.trackingNumber = order.trackingNumber || '';
    this.trackingNotes  = order.trackingNotes  || '';
    this.modalError.set('');
    this.showTrackingModal.set(true);
  }

  saveTracking(): void {
    const order = this.trackingOrder()!;
    this.http.put(`${environment.apiUrl}/admin/orders/${order.id}/status`, {
      status: order.status,
      trackingNumber: this.trackingNumber,
      trackingNotes:  this.trackingNotes
    }).subscribe({
      next: () => { this.showTrackingModal.set(false); this.showSpecToast('Tracking updated!'); this.loadOrders(); },
      error: err => this.modalError.set(err?.error?.message || 'Failed')
    });
  }

  fetchSpecs(p: any): void {
    this.fetchingSpec.set(p.id);
    this.http.post(`${environment.apiUrl}/specs/${p.id}/fetch`, {}).subscribe({
      next: () => { this.fetchingSpec.set(null); this.showSpecToast(`✅ Specs fetched for ${p.name}`); },
      error: () => { this.fetchingSpec.set(null); this.showSpecToast(`⚠️ Could not fetch specs — auto-parsed from name`); }
    });
  }

  showSpecToast(msg: string): void {
    this.specToast.set(msg);
    setTimeout(() => this.specToast.set(''), 3000);
  }

  openProductModal(): void {
    this.editingProduct.set(null);
    this.pForm = { name: '', description: '', price: null, stock: 0, categoryId: '', imageUrl: '' };
    this.modalError.set('');
    this.showProductModal.set(true);
  }

  editProduct(p: any): void {
    this.editingProduct.set(p);
    this.pForm = { name: p.name, description: p.description || '', price: p.price, stock: p.stock, categoryId: p.categoryId, imageUrl: p.thumbnailUrl || '' };
    this.modalError.set('');
    this.showProductModal.set(true);
  }

  saveProduct(): void {
    if (!this.pForm.name || !this.pForm.price || !this.pForm.categoryId) { this.modalError.set('Name, price and category required.'); return; }
    const body = { name: this.pForm.name, description: this.pForm.description, price: +this.pForm.price, stock: +this.pForm.stock, categoryId: +this.pForm.categoryId };
    const ep = this.editingProduct();
    const req = ep ? this.http.put(`${environment.apiUrl}/admin/products/${ep.id}`, body) : this.http.post(`${environment.apiUrl}/admin/products`, body);
    req.subscribe({
      next: (res: any) => {
        if (this.pForm.imageUrl && !ep) {
          const newId = res?.value?.id || res?.id;
          if (newId) this.http.post(`${environment.apiUrl}/admin/product-images`, { imageUrl: this.pForm.imageUrl, isMain: true, sortOrder: 1, productId: newId }).subscribe();
        }
        this.showProductModal.set(false);
        this.loadProducts();
      },
      error: err => this.modalError.set(err?.error?.message || 'Failed')
    });
  }

  deleteProduct(p: any): void {
    if (!confirm(`Delete "${p.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/products/${p.id}`).subscribe({
      next: () => this.loadProducts(),
      error: err => alert(err?.error?.message || 'Cannot delete')
    });
  }

  openCatModal(): void {
    this.editingCat.set(null);
    this.cForm = { name: '', parentCategoryId: null };
    this.modalError.set('');
    this.showCatModal.set(true);
  }

  editCat(c: any): void {
    this.editingCat.set(c);
    this.cForm = { name: c.name, parentCategoryId: c.parentCategoryId || null };
    this.modalError.set('');
    this.showCatModal.set(true);
  }

  saveCat(): void {
    if (!this.cForm.name) { this.modalError.set('Name is required.'); return; }
    const body = { name: this.cForm.name, parentCategoryId: this.cForm.parentCategoryId ? +this.cForm.parentCategoryId : null };
    const ec = this.editingCat();
    const req = ec ? this.http.put(`${environment.apiUrl}/admin/categories/${ec.id}`, body) : this.http.post(`${environment.apiUrl}/admin/categories`, body);
    req.subscribe({
      next: () => { this.showCatModal.set(false); this.loadCategories(); this.loadProducts(); },
      error: err => this.modalError.set(err?.error?.message || 'Failed')
    });
  }

  deleteCat(c: any): void {
    if (!confirm(`Delete "${c.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/categories/${c.id}`).subscribe({
      next: () => this.loadCategories(),
      error: err => alert(err?.error?.message || 'Cannot delete')
    });
  }

  onErr(e: Event): void { (e.target as HTMLImageElement).src = this.fallback; }
}
