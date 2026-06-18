import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { CompareService } from '../../core/services/compare.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container" style="padding-top:80px; padding-bottom:40px">
      @if (loading()) {
        <div class="loading-wrap"><div class="spinner"></div> Loading...</div>
      } @else if (!product()) {
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Product not found</h3>
          <a routerLink="/products" class="btn btn-primary">Back to Products</a>
        </div>
      } @else {
        <div class="breadcrumb">
          <a routerLink="/">Home</a> /
          <a routerLink="/products">Products</a> /
          <span>{{ product()!.name }}</span>
        </div>

        <div class="detail-grid">
          <!-- IMAGES -->
          <div class="images-col">
            <div class="main-img-wrap">
              <img [src]="selectedImg() || fallback" [alt]="product()!.name" class="main-img" (error)="onImgError($event)">
            </div>
            @if (product()!.images && product()!.images.length > 1) {
              <div class="thumbs">
                @for (img of product()!.images; track img.id) {
                  <img [src]="img.imageUrl" [alt]="product()!.name" class="thumb"
                       [class.active]="selectedImg() === img.imageUrl"
                       (click)="selectedImg.set(img.imageUrl)" (error)="onImgError($event)">
                }
              </div>
            }
          </div>

          <!-- INFO -->
          <div class="info-col">
            <div class="product-category">{{ product()!.category?.name || 'Electronics' }}</div>
            <h1 class="product-title">{{ product()!.name }}</h1>
            <div class="product-price">₾{{ product()!.price.toFixed(2) }}</div>

            <div class="stock-badge" [class.in]="product()!.stock > 0" [class.out]="product()!.stock === 0">
              {{ product()!.stock > 0 ? '✅ In Stock (' + product()!.stock + ' available)' : '❌ Out of Stock' }}
            </div>

            @if (product()!.description) {
              <div class="product-desc">{{ product()!.description }}</div>
            }

            @if (product()!.stock > 0) {
              <div class="qty-row">
                <span class="qty-label">Quantity:</span>
                <div class="qty-controls">
                  <button class="qty-btn" (click)="changeQty(-1)">−</button>
                  <span class="qty-num">{{ qty() }}</span>
                  <button class="qty-btn" (click)="changeQty(1)">+</button>
                </div>
              </div>

              <div class="action-btns">
                <button class="btn btn-primary" style="flex:1;padding:14px;font-size:15px" (click)="addToCart()">
                  🛒 Add to Cart
                </button>
                <button class="btn btn-outline" style="padding:14px 20px" (click)="buyNow()">
                  Buy Now →
                </button>
              </div>

              <!-- COMPARE BUTTON -->
              <button class="compare-full-btn" [class.active]="compare.has(product()!.id)" (click)="toggleCompare()">
                ⚖️ {{ compare.has(product()!.id) ? 'Remove from Compare' : 'Add to Compare' }}
                @if (compare.count() > 0) {
                  <span class="compare-count-badge">{{ compare.count() }} selected</span>
                }
              </button>

              @if (compare.count() >= 2) {
                <a routerLink="/compare" class="view-compare-btn">View Comparison →</a>
              }
            } @else {
              <button class="btn btn-outline" disabled>Out of Stock</button>
              <button class="compare-full-btn" [class.active]="compare.has(product()!.id)" (click)="toggleCompare()">
                ⚖️ {{ compare.has(product()!.id) ? 'Remove from Compare' : 'Add to Compare' }}
              </button>
            }

            <div class="meta-list">
              <div class="meta-row"><span>🚚</span><div><strong>Delivery</strong><p>Next day Tbilisi, 1-3 days nationwide</p></div></div>
              <div class="meta-row"><span>🔄</span><div><strong>Returns</strong><p>14-day return policy</p></div></div>
              <div class="meta-row"><span>🛡️</span><div><strong>Warranty</strong><p>Official manufacturer warranty</p></div></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .breadcrumb { font-size: 13px; color: #888; margin-bottom: 24px; }
    .breadcrumb a { color: #888; transition: color 0.2s; }
    .breadcrumb a:hover { color: #d97706; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
    .main-img-wrap { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; }
    .main-img { width: 100%; max-height: 400px; object-fit: contain; }
    .thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
    .thumb { width: 64px; height: 64px; object-fit: contain; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: border-color 0.2s; padding: 4px; background: white; }
    .thumb.active, .thumb:hover { border-color: #d97706; }
    .product-category { font-size: 12px; font-weight: 600; color: #d97706; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .product-title { font-size: 24px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
    .product-price { font-size: 36px; font-weight: 800; color: #1e2130; margin-bottom: 12px; }
    .stock-badge { font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .stock-badge.in { color: #15803d; }
    .stock-badge.out { color: #dc2626; }
    .product-desc { background: #f9f9f9; border-radius: 8px; padding: 16px; font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 20px; }
    .qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .qty-label { font-size: 14px; font-weight: 600; }
    .qty-controls { display: flex; align-items: center; border: 1.5px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .qty-btn { width: 36px; height: 36px; background: #f5f5f5; border: none; font-size: 18px; cursor: pointer; transition: background 0.2s; }
    .qty-btn:hover { background: #e0e0e0; }
    .qty-num { width: 48px; text-align: center; font-size: 15px; font-weight: 600; }
    .action-btns { display: flex; gap: 12px; margin-bottom: 16px; }

    /* COMPARE BUTTON */
    .compare-full-btn {
      width: 100%; padding: 12px; background: #f8f8f8; border: 1.5px solid #e0e0e0;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; font-family: 'Inter', sans-serif;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      margin-bottom: 10px;
    }
    .compare-full-btn:hover { border-color: #d97706; color: #d97706; background: #fffbf0; }
    .compare-full-btn.active { background: #e8f4e8; border-color: #4caf50; color: #15803d; }
    .compare-count-badge { background: #d97706; color: white; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
    .view-compare-btn { display: block; text-align: center; padding: 10px; background: #d97706; color: white; border-radius: 8px; font-weight: 600; font-size: 13px; margin-bottom: 16px; transition: background 0.2s; }
    .view-compare-btn:hover { background: #b45309; }

    .meta-list { border-top: 1px solid #e0e0e0; padding-top: 20px; display: flex; flex-direction: column; gap: 14px; }
    .meta-row { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; }
    .meta-row span { font-size: 20px; flex-shrink: 0; }
    .meta-row strong { display: block; font-weight: 600; }
    .meta-row p { color: #888; font-size: 13px; margin: 0; }

    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProductDetailComponent implements OnInit {
  product = signal<any>(null);
  loading = signal(true);
  qty = signal(1);
  selectedImg = signal('');
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600';

  constructor(
    private http: HttpClient,
    private cart: CartService,
    public compare: CompareService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: res => {
        const p = res?.value || res?.data;
        this.product.set(p);
        const main = p?.images?.find((i: any) => i.isMain) || p?.images?.[0];
        this.selectedImg.set(main?.imageUrl || p?.thumbnailUrl || this.fallback);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  changeQty(delta: number): void {
    const max = this.product()?.stock || 99;
    this.qty.set(Math.max(1, Math.min(max, this.qty() + delta)));
  }

  addToCart(): void {
    const p = this.product()!;
    for (let i = 0; i < this.qty(); i++) {
      this.cart.add({ id: p.id, name: p.name, price: p.price, imageUrl: this.selectedImg() });
    }
  }

  buyNow(): void { this.addToCart(); this.router.navigate(['/cart']); }

  toggleCompare(): void {
    const p = this.product()!;
    this.compare.toggle({
      id: p.id, name: p.name, price: p.price,
      imageUrl: this.selectedImg(), description: p.description,
      category: p.category?.name, stock: p.stock
    });
  }

  onImgError(e: Event): void { (e.target as HTMLImageElement).src = this.fallback; }
}
