import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { CompareService } from '../../core/services/compare.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home" style="padding-top:64px">

      <!-- HERO SLIDER -->
      <div class="slider">
        @for (slide of slides; track slide.id; let i = $index) {
          <div class="slide" [class.active]="currentSlide() === i" [style.background]="slide.bg">
            <div class="slide-content">
              <div class="slide-tag">{{ slide.tag }}</div>
              <h1 class="slide-title">{{ slide.title }}</h1>
              <p class="slide-sub">{{ slide.sub }}</p>
              <a [routerLink]="['/products']" [queryParams]="{cat: slide.cat}" class="slide-btn">{{ slide.btn }}</a>
            </div>
            <div class="slide-img-wrap">
              <img [src]="slide.img" [alt]="slide.title" class="slide-img" (error)="onImgError($event)">
            </div>
          </div>
        }
        <!-- DOTS -->
        <div class="slider-dots">
          @for (slide of slides; track slide.id; let i = $index) {
            <button class="dot" [class.active]="currentSlide() === i" (click)="goSlide(i)"></button>
          }
        </div>
        <!-- ARROWS -->
        <button class="slider-arrow left" (click)="prevSlide()">‹</button>
        <button class="slider-arrow right" (click)="nextSlide()">›</button>
      </div>

      <!-- CATEGORY GRID (like beon.ge) -->
      <div class="container section">
        <div class="cat-grid">
          @for (cat of catCards; track cat.id) {
            <div class="cat-card" [routerLink]="['/products']" [queryParams]="{cat: cat.catId}">
              <img [src]="cat.img" [alt]="cat.name" class="cat-card-img" (error)="onImgError($event)">
              <div class="cat-card-name">{{ cat.name }}</div>
            </div>
          }
        </div>
      </div>

      <!-- FEATURED PRODUCTS -->
      <div class="container section">
        <div class="section-header">
          <div class="section-title">📱 Smartphones</div>
          <a routerLink="/products" [queryParams]="{cat:1}" class="view-all">View all →</a>
        </div>
        @if (loadingPhones()) {
          <div class="loading-wrap"><div class="spinner"></div></div>
        } @else {
          <div class="products-grid">
            @for (p of phones(); track p.id) {
              <div class="product-card" [routerLink]="['/products', p.id]">
                <img class="product-card-img" [src]="p.thumbnailUrl || fallback" [alt]="p.name" (error)="onImgError($event)">
                <div class="product-card-body">
                  <div class="product-card-name">{{ p.name }}</div>
                  <div class="product-card-price">₾{{ p.price.toFixed(2) }}</div>
                  <div class="product-card-actions">
                    <button class="product-card-btn" (click)="addToCart($event, p)">Add to Cart</button>
                    <button class="compare-btn" [class.active]="compare.has(p.id)" (click)="toggleCompare($event, p)" title="Compare">⚖️</button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- BANNER -->
      <div class="container section">
        <div class="mid-banner" [routerLink]="['/products']" [queryParams]="{cat:2}">
          <div>
            <div class="mid-banner-tag">🔥 Best Sellers</div>
            <h2>Gaming Laptops & PCs</h2>
            <p>RTX 4070, RTX 4080, M3 Pro — all in stock</p>
            <span class="mid-banner-btn">Shop Now →</span>
          </div>
          <span class="mid-banner-icon">💻</span>
        </div>
      </div>

      <!-- LAPTOPS -->
      <div class="container section">
        <div class="section-header">
          <div class="section-title">💻 Laptops</div>
          <a routerLink="/products" [queryParams]="{cat:2}" class="view-all">View all →</a>
        </div>
        @if (loadingLaptops()) {
          <div class="loading-wrap"><div class="spinner"></div></div>
        } @else {
          <div class="products-grid">
            @for (p of laptops(); track p.id) {
              <div class="product-card" [routerLink]="['/products', p.id]">
                <img class="product-card-img" [src]="p.thumbnailUrl || fallback" [alt]="p.name" (error)="onImgError($event)">
                <div class="product-card-body">
                  <div class="product-card-name">{{ p.name }}</div>
                  <div class="product-card-price">₾{{ p.price.toFixed(2) }}</div>
                  <div class="product-card-actions">
                    <button class="product-card-btn" (click)="addToCart($event, p)">Add to Cart</button>
                    <button class="compare-btn" [class.active]="compare.has(p.id)" (click)="toggleCompare($event, p)" title="Compare">⚖️</button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- WHY US -->
      <div class="why-strip">
        <div class="container">
          <div class="why-grid">
            <div class="why-item"><span>🚚</span><div><strong>Fast Delivery</strong><p>Next day in Tbilisi</p></div></div>
            <div class="why-item"><span>✅</span><div><strong>Genuine Products</strong><p>100% authentic</p></div></div>
            <div class="why-item"><span>🔄</span><div><strong>Easy Returns</strong><p>14-day policy</p></div></div>
            <div class="why-item"><span>🛡️</span><div><strong>Warranty</strong><p>Official warranty</p></div></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* SLIDER */
    .slider { position: relative; height: 420px; overflow: hidden; background: #1e2130; }
    .slide { position: absolute; inset: 0; display: flex; align-items: center; opacity: 0; transition: opacity 0.6s ease; padding: 0 60px; }
    .slide.active { opacity: 1; }
    .slide-content { flex: 1; z-index: 1; }
    .slide-tag { display: inline-block; background: var(--primary); color: #1e2130; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
    .slide-title { font-size: 42px; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 12px; }
    .slide-sub { color: #aaa; font-size: 15px; margin-bottom: 28px; max-width: 400px; line-height: 1.6; }
    .slide-btn { display: inline-block; background: var(--primary); color: #1e2130; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; transition: background 0.2s; }
    .slide-btn:hover { background: var(--primary-hover); }
    .slide-img-wrap { width: 420px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .slide-img { max-width: 380px; max-height: 360px; object-fit: contain; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4)); }
    .slider-dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); border: none; cursor: pointer; transition: all 0.2s; }
    .dot.active { background: var(--primary); width: 24px; border-radius: 4px; }
    .slider-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); border: none; color: white; font-size: 28px; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
    .slider-arrow:hover { background: var(--primary); color: #1e2130; }
    .slider-arrow.left { left: 16px; }
    .slider-arrow.right { right: 16px; }

    /* CATEGORY GRID */
    .section { margin-top: 32px; }
    .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .cat-card { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px 16px; text-align: center; cursor: pointer; transition: all 0.2s; }
    .cat-card:hover { border-color: var(--primary); box-shadow: 0 4px 16px rgba(245,166,35,0.15); transform: translateY(-2px); }
    .cat-card-img { width: 100%; height: 100px; object-fit: contain; margin-bottom: 10px; }
    .cat-card-name { font-size: 13px; font-weight: 600; color: #333; }

    /* SECTION HEADER */
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-header .section-title { margin-bottom: 0; }
    .view-all { color: var(--primary); font-size: 13px; font-weight: 600; }
    .view-all:hover { text-decoration: underline; }

    /* MID BANNER */
    .mid-banner { background: linear-gradient(135deg, #1e2130 0%, #2d3250 100%); border-radius: 12px; padding: 36px 40px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.2s; border: 1px solid rgba(245,166,35,0.2); }
    .mid-banner:hover { transform: translateY(-2px); }
    .mid-banner-tag { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--primary); margin-bottom: 8px; }
    .mid-banner h2 { font-size: 26px; font-weight: 800; color: white; margin-bottom: 6px; }
    .mid-banner p { color: #aaa; font-size: 14px; margin-bottom: 16px; }
    .mid-banner-btn { background: var(--primary); color: #1e2130; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; }
    .mid-banner-icon { font-size: 72px; }

    /* WHY STRIP */
    .why-strip { background: white; border-top: 1px solid #e0e0e0; margin-top: 48px; padding: 24px 0; }
    .why-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .why-item { display: flex; align-items: center; gap: 14px; }
    .why-item span { font-size: 28px; }
    .why-item strong { display: block; font-size: 14px; font-weight: 700; }
    .why-item p { font-size: 12px; color: #888; margin: 0; }

    @media (max-width: 768px) {
      .slider { height: auto; min-height: 300px; }
      .slide { flex-direction: column; padding: 32px 20px; text-align: center; }
      .slide-img-wrap { width: 100%; margin-top: 20px; }
      .slide-title { font-size: 28px; }
      .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .why-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  phones = signal<any[]>([]);
  laptops = signal<any[]>([]);
  loadingPhones = signal(true);
  loadingLaptops = signal(true);
  currentSlide = signal(0);
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400';
  private slideInterval: any;

  slides = [
    {
      id: 1, tag: '🇬🇪 Georgia\'s #1 Tech Store',
      title: 'Best Electronics\nat Best Prices',
      sub: 'Phones, laptops, components and accessories. Fast nationwide delivery.',
      btn: 'Shop Phones →', cat: 1,
      bg: 'linear-gradient(135deg, #1e2130 0%, #16213e 100%)',
      img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'
    },
    {
      id: 2, tag: '🔥 New Arrivals',
      title: 'Gaming Laptops\nRTX 4080 Series',
      sub: 'The most powerful gaming laptops. MSI, ASUS ROG, Lenovo Legion.',
      btn: 'Shop Laptops →', cat: 2,
      bg: 'linear-gradient(135deg, #0f1a35 0%, #1a0535 100%)',
      img: 'assets/icons/laptop-slider.png'
    },
    {
      id: 3, tag: '⚡ PC Components',
      title: 'Build Your\nDream PC',
      sub: 'RTX 4090, Intel i9, AMD Ryzen 9 — everything you need.',
      btn: 'Shop Components →', cat: 5,
      bg: 'linear-gradient(135deg, #0a1628 0%, #1e1a0a 100%)',
      img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500'
    }
  ];

  catCards = [
    { id: 1, name: 'Monitors', catId: 6, img: 'https://beon.ge/images/abt__ut2/banners/all/123/Monitorebi_5kb0-id.png' },
    { id: 2, name: 'Laptops', catId: 2, img: 'https://beon.ge/images/abt__ut2/banners/all/123/Laptop_5ysr-mu.png' },
    { id: 3, name: 'PC Components', catId: 5, img: 'https://beon.ge/images/abt__ut2/banners/all/123/Accessorice_2.png' },
    { id: 4, name: 'Audio', catId: 4, img: 'https://beon.ge/images/abt__ut2/banners/all/123/AUDIO.png' },
    { id: 5, name: 'Smartphones', catId: 1, img: 'assets/icons/Smartphones-icon.png' },
    { id: 6, name: 'Tablets', catId: 3, img: 'assets/icons/Tableti-icon.png' }, 
    { id: 7, name: 'Accessories', catId: 4, img: 'https://beon.ge/images/abt__ut2/banners/all/123/Perfiferia.png'},
    { id: 8, name: 'Gaming', catId: 9, img: 'https://beon.ge/images/abt__ut2/banners/all/123/Game_PC_zimp-sd.png' },
  ];

  constructor(
    private http: HttpClient,
    private cart: CartService,
    public compare: CompareService
  ) {}

  ngOnInit(): void {
    this.slideInterval = setInterval(() => this.nextSlide(), 5000);

    this.http.get<any>(`${environment.apiUrl}/products/category/1?page=1`).subscribe(res => {
      this.phones.set((res?.value?.items || res?.data?.items || []).slice(0, 8));
      this.loadingPhones.set(false);
    });

    this.http.get<any>(`${environment.apiUrl}/products/category/2?page=1`).subscribe(res => {
      this.laptops.set((res?.value?.items || res?.data?.items || []).slice(0, 8));
      this.loadingLaptops.set(false);
    });
  }

  ngOnDestroy(): void { clearInterval(this.slideInterval); }

  nextSlide(): void { this.currentSlide.set((this.currentSlide() + 1) % this.slides.length); }
  prevSlide(): void { this.currentSlide.set((this.currentSlide() - 1 + this.slides.length) % this.slides.length); }
  goSlide(i: number): void { this.currentSlide.set(i); }

  addToCart(e: Event, p: any): void {
    e.stopPropagation();
    this.cart.add({ id: p.id, name: p.name, price: p.price, imageUrl: p.thumbnailUrl });
  }

  toggleCompare(e: Event, p: any): void {
    e.stopPropagation();
    this.compare.toggle({ id: p.id, name: p.name, price: p.price, imageUrl: p.thumbnailUrl, description: p.description, stock: p.stock });
  }

  onImgError(e: Event): void { (e.target as HTMLImageElement).src = this.fallback; }
}
