import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompareService } from '../../../core/services/compare.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- HAMBURGER SLIDE-OUT PANEL -->
    @if (menuOpen()) {
      <div class="menu-overlay" (click)="menuOpen.set(false)"></div>
      <div class="slide-menu">
        <div class="slide-menu-header">
          <div class="slide-logo"><span class="ada">Volt</span><span class="shop">Store</span></div>
          <button class="close-btn" (click)="menuOpen.set(false)">✕</button>
        </div>
        <div class="slide-auth">
          @if (isLoggedIn()) {
            <a routerLink="/profile" (click)="menuOpen.set(false)">👤 My Account</a>
            @if (isAdmin()) { <a routerLink="/admin" (click)="menuOpen.set(false)">⚙️ Admin Panel</a> }
            <a (click)="logout()">🚪 Log Out</a>
          } @else {
            <a routerLink="/auth" (click)="menuOpen.set(false)">Sign In</a>
            <span>|</span>
            <a routerLink="/auth" [queryParams]="{tab:'register'}" (click)="menuOpen.set(false)">Register</a>
          }
        </div>

        <button class="slide-cats-btn" (click)="menuOpen.set(false)" [routerLink]="['/products']">
          ⊞ Categories
        </button>

        <div class="slide-section">
          <div class="slide-section-title">Shop</div>
          <a class="slide-link" routerLink="/" (click)="menuOpen.set(false)">Home</a>
          <a class="slide-link" routerLink="/products" (click)="menuOpen.set(false)">All Products</a>
          <a class="slide-link" routerLink="/cart" (click)="menuOpen.set(false)">Cart</a>
          <a class="slide-link" routerLink="/compare" (click)="menuOpen.set(false)">Compare</a>
        </div>

        <div class="slide-section">
          <div class="slide-section-title">Info</div>
          <a class="slide-link" href="#">Delivery</a>
          <a class="slide-link" href="#">Warranty</a>
          <a class="slide-link" href="#">Returns</a>
          <a class="slide-link" href="#">Payment</a>
        </div>

        <div class="slide-social">
          <div class="slide-section-title">Get Social</div>
          <p class="social-text">Join us and be the first to know all promotions!</p>
          <div class="social-icons">
            <a href="#" class="social-icon">f</a>
            <a href="#" class="social-icon">in</a>
            <a href="#" class="social-icon">▶</a>
          </div>
          <div class="slide-contact">
            <p>📍 Tbilisi, Georgia</p>
            <p>☎ (032) 2420264</p>
            <p>🕐 Mon-Sun 9:00–18:00</p>
          </div>
        </div>
      </div>
    }

    <!-- MAIN NAVBAR -->
    <nav class="navbar">
      <div class="navbar-inner">
        <!-- HAMBURGER -->
        <button class="hamburger" (click)="menuOpen.set(true)">
          <span></span><span></span><span></span>
        </button>

        <!-- LOGO -->
        <a routerLink="/" class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text"><span class="ada">Volt</span><span class="shop">Store</span></span>
        </a>

        <!-- CATEGORIES BTN -->
        <button class="cats-btn" (mouseenter)="showMega = true" (click)="showMega = !showMega">
          ⊞ Categories
        </button>

        <!-- SEARCH -->
        <div class="search-wrap" (clickOutside)="suggestions.set([])">
          <div class="search-box">
            <input type="text" [(ngModel)]="searchQuery"
                   (ngModelChange)="onSearch($event)"
                   (keydown.enter)="goSearch()"
                   placeholder="Find your product..."
                   class="search-input">
            <button class="search-btn" (click)="goSearch()">🔍</button>
          </div>
          @if (suggestions().length > 0 && searchQuery.length > 1) {
            <div class="suggestions">
              @for (p of suggestions(); track p['id']) {
                <div class="suggestion-item" (click)="goProduct(p['id'])">
                  <img [src]="p['thumbnailUrl'] || fallback" [alt]="p['name']" (error)="onImgError($event)">
                  <span class="sug-name">{{ p['name'] }}</span>
                  <span class="sug-price">₾{{ p['price']?.toFixed(2) }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- RIGHT ACTIONS -->
        <div class="nav-right">
          <div class="nav-info">
            <span class="nav-phone">☎ (032) 2420264</span>
          </div>
          <!-- COMPARE -->
          <a routerLink="/compare" class="nav-icon-btn" title="Compare">
            ⚖️
            @if (compare.count() > 0) {
              <span class="icon-badge">{{ compare.count() }}</span>
            }
          </a>
          <!-- ACCOUNT -->
          @if (isLoggedIn()) {
            <a routerLink="/profile" class="nav-icon-btn" title="Account">👤</a>
          } @else {
            <a routerLink="/auth" class="nav-icon-btn" title="Sign In">👤</a>
          }
          <!-- CART -->
          <a routerLink="/cart" class="nav-icon-btn" title="Cart">
            🛒
            @if (cartCount() > 0) {
              <span class="icon-badge">{{ cartCount() }}</span>
            }
          </a>
        </div>
      </div>

      <!-- MEGA MENU -->
      @if (showMega) {
        <div class="mega-backdrop" (click)="showMega = false"></div>
        <div class="mega-menu" (mouseleave)="showMega = false">
          <!-- LEVEL 1: parent categories -->
          <div class="mega-col1">
            @for (cat of parentCats(); track cat['id']) {
              <div class="mega-l1"
                   [class.active]="hoveredL1 === cat['id']"
                   (mouseenter)="hoveredL1 = cat['id']; hoveredL2 = null"
                   (click)="goCategory(cat['id'])">
                <span class="mega-l1-icon">{{ getCatIcon(cat['name']) }}</span>
                <span>{{ cat['name'] }}</span>
                @if (getChildren(cat['id']).length > 0) { <span class="mega-arrow">›</span> }
              </div>
            }
          </div>

          <!-- LEVEL 2: subcategories -->
          @if (hoveredL1 && getChildren(hoveredL1).length > 0) {
            <div class="mega-col2">
              <div class="mega-col2-title" (click)="goCategory(hoveredL1)">
                All {{ getCatName(hoveredL1) }} ›
              </div>
              @for (child of getChildren(hoveredL1); track child['id']) {
                <div class="mega-l2"
                     [class.active]="hoveredL2 === child['id']"
                     (mouseenter)="hoveredL2 = child['id']"
                     (click)="goCategory(child['id'])">
                  {{ child['name'] }}
                  @if (getChildren(child['id']).length > 0) { <span class="mega-arrow">›</span> }
                </div>
              }
            </div>
          }

          <!-- LEVEL 3: sub-subcategories -->
          @if (hoveredL2 && getChildren(hoveredL2).length > 0) {
            <div class="mega-col3">
              @for (sub of getChildren(hoveredL2); track sub['id']) {
                <div class="mega-l3" (click)="goCategory(sub['id'])">{{ sub['name'] }}</div>
              }
            </div>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    /* SLIDE MENU */
    .menu-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; }
    .slide-menu { position: fixed; top: 0; left: 0; bottom: 0; width: 300px; background: var(--dark); z-index: 2001; overflow-y: auto; display: flex; flex-direction: column; animation: slideIn 0.25s ease; }
    @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    .slide-menu-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .slide-logo { font-size: 22px; font-weight: 800; }
    .ada { color: var(--primary); }
    .shop { color: white; }
    .close-btn { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
    .slide-auth { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .slide-auth a { color: white; font-size: 13px; font-weight: 600; cursor: pointer; }
    .slide-auth a:hover { color: var(--primary); }
    .slide-auth span { color: #555; }
    .slide-cats-btn { margin: 16px 20px; padding: 12px 20px; background: var(--primary); color: #1e2130; font-weight: 700; font-size: 14px; border: none; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; text-align: left; }
    .slide-section { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .slide-section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #666; margin-bottom: 12px; }
    .slide-link { display: block; color: #ccc; font-size: 14px; font-weight: 500; padding: 6px 0; transition: color 0.2s; }
    .slide-link:hover { color: var(--primary); }
    .slide-social { padding: 16px 20px; }
    .social-text { color: #888; font-size: 12px; margin-bottom: 12px; line-height: 1.5; }
    .social-icons { display: flex; gap: 10px; margin-bottom: 16px; }
    .social-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.1); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; transition: background 0.2s; }
    .social-icon:hover { background: var(--primary); color: #1e2130; }
    .slide-contact p { color: #888; font-size: 12px; margin-bottom: 4px; }

    /* MAIN NAVBAR */
    .navbar { background: var(--dark); position: fixed; top: 0; left: 0; right: 0; z-index: 1000; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
    .navbar-inner { display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 20px; max-width: 1280px; margin: 0 auto; }

    .hamburger { background: none; border: none; cursor: pointer; padding: 8px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
    .hamburger span { display: block; width: 22px; height: 2px; background: white; border-radius: 2px; transition: all 0.2s; }
    .hamburger:hover span { background: var(--primary); }

    .logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .logo-icon { background: var(--primary); color: #1e2130; font-weight: 800; font-size: 13px; padding: 4px 7px; border-radius: 6px; }
    .logo-text { font-size: 20px; font-weight: 800; }
    .logo-text .ada { color: var(--primary); }
    .logo-text .shop { color: white; }

    .cats-btn { padding: 8px 16px; background: var(--primary); color: #1e2130; font-weight: 700; font-size: 13px; border: none; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; flex-shrink: 0; transition: background 0.2s; }
    .cats-btn:hover { background: var(--primary-hover); }

    .search-wrap { flex: 1; position: relative; }
    .search-box { display: flex; border: 2px solid rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.08); transition: border-color 0.2s; }
    .search-box:focus-within { border-color: var(--primary); }
    .search-input { flex: 1; padding: 10px 14px; border: none; outline: none; font-size: 14px; font-family: 'Inter', sans-serif; background: transparent; color: white; }
    .search-input::placeholder { color: #888; }
    .search-btn { padding: 0 16px; background: var(--primary); border: none; cursor: pointer; font-size: 16px; transition: background 0.2s; }
    .search-btn:hover { background: var(--primary-hover); }

    .suggestions { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 100; overflow: hidden; }
    .suggestion-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.2s; }
    .suggestion-item:hover { background: #f5f5f5; }
    .suggestion-item img { width: 36px; height: 36px; object-fit: contain; border-radius: 4px; background: #f5f5f5; }
    .sug-name { flex: 1; font-size: 13px; color: #222; }
    .sug-price { color: #d97706; font-weight: 700; font-size: 13px; }

    .nav-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .nav-info { display: flex; flex-direction: column; align-items: flex-end; margin-right: 8px; }
    .nav-phone { font-size: 12px; color: #aaa; }
    .nav-icon-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px; font-size: 18px; color: white; transition: all 0.2s; cursor: pointer; }
    .nav-icon-btn:hover { background: rgba(255,255,255,0.1); }
    .icon-badge { position: absolute; top: 2px; right: 2px; background: var(--primary); color: #1e2130; font-size: 10px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    /* MEGA MENU */
    .mega-backdrop { position: fixed; inset: 0; top: 64px; z-index: 998; }
    .mega-menu { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 850px; background: white; border-top: 2px solid var(--primary); box-shadow: 0 12px 40px rgba(0,0,0,0.15); display: flex; z-index: 999; max-height: 400px; overflow: hidden; border-radius: 0 0 12px 12px; }
    .mega-col1 { width: 200px; border-right: 1px solid #e0e0e0; overflow-y: auto; flex-shrink: 0; padding: 8px 0; background: #fafafa; }
    .mega-l1 { display: flex; align-items: center; gap: 10px; padding: 11px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: #333; }
    .mega-l1:hover, .mega-l1.active { background: white; color: #d97706; }
    .mega-l1-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
    .mega-arrow { margin-left: auto; color: #bbb; font-size: 16px; }
    .mega-col2 { width: 220px; border-right: 1px solid #e0e0e0; overflow-y: auto; flex-shrink: 0; padding: 8px 0; }
    .mega-col2-title { padding: 10px 16px; font-size: 13px; font-weight: 700; color: #d97706; cursor: pointer; }
    .mega-col2-title:hover { text-decoration: underline; }
    .mega-l2 { display: flex; justify-content: space-between; align-items: center; padding: 9px 16px; font-size: 13px; cursor: pointer; transition: all 0.15s; color: #444; }
    .mega-l2:hover, .mega-l2.active { background: #fff8e6; color: #d97706; }
    .mega-col3 { flex: 1; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; align-content: start; gap: 4px; }
    .mega-l3 { padding: 8px 10px; font-size: 13px; cursor: pointer; border-radius: 6px; transition: all 0.15s; color: #555; }
    .mega-l3:hover { background: #fff8e6; color: #d97706; }

    @media (max-width: 768px) {
      .cats-btn, .nav-info, .logo-text { display: none; }
      .search-wrap { max-width: none; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  searchQuery = '';
  showMega = false;
  menuOpen = signal(false);
  suggestions = signal<any[]>([]);
  allCategories = signal<any[]>([]);
  parentCats = signal<any[]>([]);
  hoveredL1: number | null = null;
  hoveredL2: number | null = null;
  cartCount = signal(0);
  isLoggedIn = signal(false);
  isAdmin = signal(false);
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=60';

  catIcons: Record<string, string> = {
    'Phones': '📱', 'Laptops': '💻', 'Tablets': '📟', 'Accessories': '🎧',
    'PC Components': '🔧', 'TVs & Monitors': '🖥️', 'Smartphones': '📱',
    'Gaming Laptops': '🎮', 'Office Laptops': '💼', 'Headphones': '🎧',
    'Graphics Cards': '🎮', 'Processors': '⚡', 'RAM': '🧠', 'Monitors': '🖥️',
  };

  private searchSubject = new Subject<string>();

  constructor(
    private http: HttpClient,
    private router: Router,
    public compare: CompareService
  ) {}

  ngOnInit(): void {
    this.updateAuth();
    this.updateCart();
    setInterval(() => { this.updateAuth(); this.updateCart(); }, 1000);

    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe(res => {
      const cats: any[] = res?.value || res?.data || [];
      this.allCategories.set(cats);
      this.parentCats.set(cats.filter((c: any) => !c.parentCategoryId));
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length > 1
        ? this.http.get<any>(`${environment.apiUrl}/products/search/suggestions?q=${encodeURIComponent(q)}`).pipe(catchError(() => of({ value: [] })))
        : of({ value: [] }))
    ).subscribe(res => this.suggestions.set(res?.value || []));
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.search-wrap')) this.suggestions.set([]);
    if (!target.closest('.mega-menu') && !target.closest('.cats-btn')) this.showMega = false;
  }

  updateAuth(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn.set(!!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
        this.isAdmin.set(role === 'Admin');
      } catch { this.isAdmin.set(false); }
    } else { this.isAdmin.set(false); }
  }

  updateCart(): void {
    try {
      const items: any[] = JSON.parse(localStorage.getItem('voltstore_cart') || '[]');
      this.cartCount.set(items.reduce((s: number, i: any) => s + i.quantity, 0));
    } catch { this.cartCount.set(0); }
  }

  getCatIcon(name: string): string { return this.catIcons[name] || '📦'; }
  getCatName(id: number): string { return this.allCategories().find((c: any) => c.id === id)?.name || ''; }
  getChildren(parentId: number): any[] { return this.allCategories().filter((c: any) => c.parentCategoryId === parentId); }

  onSearch(q: string): void { this.searchSubject.next(q); }

  goSearch(): void {
    if (this.searchQuery.trim()) {
      this.suggestions.set([]);
      this.router.navigate(['/products'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  goProduct(id: number): void { this.suggestions.set([]); this.searchQuery = ''; this.router.navigate(['/products', id]); }
  goCategory(id: number): void { this.showMega = false; this.router.navigate(['/products'], { queryParams: { cat: id } }); }

  logout(): void {
    localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('voltstore_cart');
    this.updateAuth(); this.updateCart();
    this.menuOpen.set(false);
    this.router.navigate(['/']);
  }

  onImgError(e: Event): void { (e.target as HTMLImageElement).src = this.fallback; }
}