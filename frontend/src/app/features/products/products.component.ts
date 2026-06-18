import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { CompareService } from '../../core/services/compare.service';
import { environment } from '../../../environments/environment';
import { Title } from '@angular/platform-browser';

const KNOWN_BRANDS = ['Apple','Samsung','Google','Xiaomi','ASUS','MSI','Lenovo','Dell','HP','Sony','LG','NVIDIA','AMD','Intel','Corsair','Kingston','G.Skill'];

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container" style="padding-top:80px; padding-bottom:40px">
      <div class="layout">

        <!-- SIDEBAR -->
        <aside class="sidebar">

          <!-- SEARCH BY NAME -->
          <div class="filter-section">
            <div class="filter-title">Search</div>
            <input class="form-control" [(ngModel)]="nameFilter" (ngModelChange)="applyFilters()"
                   placeholder="Search by name...">
          </div>

          <!-- PRICE RANGE -->
          <div class="filter-section">
            <div class="filter-title">Price Range (₾)</div>
            <div class="price-inputs">
              <input class="form-control" type="number" [(ngModel)]="minPrice" (ngModelChange)="applyFilters()" placeholder="Min">
              <span class="price-sep">—</span>
              <input class="form-control" type="number" [(ngModel)]="maxPrice" (ngModelChange)="applyFilters()" placeholder="Max">
            </div>
          </div>

          <!-- BRANDS -->
          <div class="filter-section">
            <div class="filter-title">Brand</div>
            <div class="brand-list">
              @for (brand of availableBrands(); track brand) {
                <label class="brand-item">
                  <input type="checkbox" [checked]="selectedBrands().includes(brand)"
                         (change)="toggleBrand(brand)">
                  <span>{{ brand }}</span>
                </label>
              }
            </div>
          </div>


          <!-- CATEGORIES -->
          <div class="filter-section">
            <div class="filter-title">Categories</div>
            <div class="sidebar-cats">
              <div class="sidebar-cat" [class.active]="!currentCatId()" (click)="selectCat(null)">All Products</div>
              @for (cat of parentCats(); track cat['id']) {
                <div class="sidebar-cat" [class.active]="currentCatId() === cat['id']" (click)="selectCat(cat['id'])">
                  {{ cat['name'] }}
                </div>
                @for (child of getChildren(cat['id']); track child['id']) {
                  <div class="sidebar-child" [class.active]="currentCatId() === child['id']" (click)="selectCat(child['id'])">
                    {{ child['name'] }}
                  </div>
                }
              }
            </div>
          </div>

          <!-- RESET -->
          <button class="btn btn-outline btn-sm" style="width:100%" (click)="resetFilters()">Reset Filters</button>
        </aside>

        <!-- MAIN -->
        <main class="main">
          <div class="main-header">
            <div>
              <h1 class="page-title">{{ pageTitle() }}</h1>
              <div class="result-count">{{ filteredProducts().length }} products</div>
            </div>
            <!-- SORT -->
            <select class="sort-select" [(ngModel)]="sortBy" (ngModelChange)="applyFilters()">
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>

          @if (loading()) {
            <div class="loading-wrap"><div class="spinner"></div> Loading products...</div>
          } @else if (filteredProducts().length === 0) {
            <div class="empty-state">
              <div class="empty-state-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters</p>
              <button class="btn btn-primary" (click)="resetFilters()">Reset Filters</button>
            </div>
          } @else {
            <div class="products-grid">
              @for (p of pagedProducts(); track p.id) {
                <div class="product-card" [routerLink]="['/products', p.id]">
                  <img class="product-card-img" [src]="p.thumbnailUrl || fallback" [alt]="p.name" (error)="onImgError($event)">
                  <div class="product-card-body">
                    <div class="product-card-name">{{ p.name }}</div>
                    <div class="product-card-price">₾{{ p.price.toFixed(2) }}</div>
                    <div class="product-card-actions">
                      <button class="product-card-btn" (click)="addToCart($event, p)">Add to Cart</button>
                      <button class="compare-btn" [class.active]="compare.has(p.id)"
                              (click)="toggleCompare($event, p)" title="Add to Compare">⚖️</button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- PAGINATION -->
            @if (totalPages() > 1) {
              <div class="pagination">
                @if (currentPage() > 1) {
                  <button class="page-btn" (click)="goPage(currentPage() - 1)">←</button>
                }
                @for (p of pageNumbers(); track p) {
                  <button class="page-btn" [class.active]="p === currentPage()" (click)="goPage(p)">{{ p }}</button>
                }
                @if (currentPage() < totalPages()) {
                  <button class="page-btn" (click)="goPage(currentPage() + 1)">→</button>
                }
              </div>
            }
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }

    /* SIDEBAR */
    .sidebar { align-self: start; position: sticky; top: 80px; display: flex; flex-direction: column; gap: 0; }
    .filter-section { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .filter-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 12px; }
    .price-inputs { display: flex; align-items: center; gap: 8px; }
    .price-inputs .form-control { padding: 8px 10px; font-size: 13px; }
    .price-sep { color: #888; flex-shrink: 0; }
    .brand-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
    .brand-item { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #444; }
    .brand-item input { accent-color: var(--primary); cursor: pointer; }
    .brand-item:hover { color: #d97706; }
    .sidebar-cats { display: flex; flex-direction: column; gap: 2px; }
    .sidebar-cat { padding: 7px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s; color: #333; }
    .sidebar-cat:hover, .sidebar-cat.active { background: #fff8e6; color: #d97706; }
    .sidebar-child { padding: 5px 10px 5px 20px; border-radius: 6px; cursor: pointer; font-size: 12px; color: #666; transition: all 0.15s; }
    .sidebar-child:hover, .sidebar-child.active { color: #d97706; background: #fffdf5; }

    /* MAIN */
    .main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 22px; font-weight: 700; }
    .result-count { font-size: 13px; color: #888; margin-top: 4px; }
    .sort-select { padding: 8px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-size: 13px; font-family: 'Inter', sans-serif; color: #333; background: white; cursor: pointer; outline: none; }
    .sort-select:focus { border-color: var(--primary); }

    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; } }
  `]
})
export class ProductsComponent implements OnInit {
  allProducts = signal<any[]>([]);
  filteredProducts = signal<any[]>([]);
  allCategories = signal<any[]>([]);
  parentCats = signal<any[]>([]);
  loading = signal(true);
  currentCatId = signal<number | null>(null);
  currentPage = signal(1);
  pageTitle = signal('All Products');
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400';
  readonly PAGE_SIZE = 20;

  // Filters
  nameFilter = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedBrands = signal<string[]>([]);
  inStockOnly = false;
  sortBy = 'default';

  availableBrands = computed(() => {
    const brands = new Set<string>();
    this.allProducts().forEach(p => {
      const brand = this.extractBrand(p.name);
      if (brand) brands.add(brand);
    });
    return Array.from(brands).sort();
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.PAGE_SIZE));

  pagedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + this.PAGE_SIZE);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i);
    return pages;
  });

  constructor(
    private http: HttpClient,
    private cart: CartService,
    public compare: CompareService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe(res => {
      const cats = res?.value || res?.data || [];
      this.allCategories.set(cats);
      this.parentCats.set(cats.filter((c: any) => !c.parentCategoryId));
    });

    this.route.queryParams.subscribe(params => {
      this.currentCatId.set(params['cat'] ? +params['cat'] : null);
      const q = params['q'] || '';
      if (q) { this.nameFilter = q; this.pageTitle.set(`Results for "${q}"`); }
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const catId = this.currentCatId() || 1;
    const pages = [1, 2, 3];
    const all: any[] = [];
    let done = 0;

    const cats = this.currentCatId()
      ? [catId]
      : this.allCategories().filter((c: any) => !c.parentCategoryId).map((c: any) => c.id);

    const catList = cats.length ? cats : [1, 2, 3, 4, 5, 6];

    catList.forEach(id => {
      this.http.get<any>(`${environment.apiUrl}/products/category/${id}?page=1`).subscribe(res => {
        const items = res?.value?.items || res?.data?.items || [];
        items.forEach((p: any) => { if (!all.find((e: any) => e.id === p.id)) all.push(p); });
        done++;
        if (done === catList.length) {
          this.allProducts.set(all);
          this.applyFilters();
          this.loading.set(false);
        }
      });
    });
  }

  applyFilters(): void {
    let result = [...this.allProducts()];

    if (this.nameFilter) {
      const q = this.nameFilter.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    if (this.minPrice !== null) result = result.filter(p => p.price >= this.minPrice!);
    if (this.maxPrice !== null) result = result.filter(p => p.price <= this.maxPrice!);
    if (this.selectedBrands().length > 0) {
      result = result.filter(p => {
        const brand = this.extractBrand(p.name);
        return brand && this.selectedBrands().includes(brand);
      });
    }
    // Sort
    switch (this.sortBy) {
      case 'price-asc':  result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'name-asc':   result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':  result.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    this.filteredProducts.set(result);
    this.currentPage.set(1);
  }

  extractBrand(name: string): string | null {
    for (const brand of KNOWN_BRANDS) {
      if (name.toLowerCase().startsWith(brand.toLowerCase()) || name.toLowerCase().includes(' ' + brand.toLowerCase() + ' ')) {
        return brand;
      }
    }
    return null;
  }

  toggleBrand(brand: string): void {
    const current = this.selectedBrands();
    if (current.includes(brand)) {
      this.selectedBrands.set(current.filter(b => b !== brand));
    } else {
      this.selectedBrands.set([...current, brand]);
    }
    this.applyFilters();
  }

  resetFilters(): void {
    this.nameFilter = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedBrands.set([]);
    this.inStockOnly = false;
    this.sortBy = 'default';
    this.applyFilters();
  }

  selectCat(id: number | null): void {
    this.router.navigate(['/products'], { queryParams: id ? { cat: id } : {} });
  }

  getChildren(parentId: number): any[] {
    return this.allCategories().filter((c: any) => c.parentCategoryId === parentId);
  }

  goPage(page: number): void {
    this.currentPage.set(page);
    window.scrollTo(0, 0);
  }

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
