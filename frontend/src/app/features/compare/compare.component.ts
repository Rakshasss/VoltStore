import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CompareService } from '../../core/services/compare.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container" style="padding-top:80px;padding-bottom:60px">
      <h1 class="page-h1">Compare Products</h1>

      @if (compare.items().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">⚖️</div>
          <h3>No products to compare</h3>
          <p>Click the compare button on any product.</p>
          <a routerLink="/products" class="btn btn-primary" style="margin-top:16px">Browse Products</a>
        </div>
      } @else if (compare.items().length === 1) {
        <div class="empty-state">
          <div class="empty-state-icon">➕</div>
          <h3>Add one more product</h3>
          <a routerLink="/products" class="btn btn-primary" style="margin-top:16px">Add More</a>
        </div>
      } @else {
        <div class="compare-wrap">
          <table class="compare-table">
            <tr class="header-row">
              <td class="compare-label">Product</td>
              @for (item of compare.items(); track item.id) {
                <td class="compare-cell header-cell">
                  <button class="remove-btn" (click)="compare.remove(item.id)">X</button>
                  <img [src]="item.imageUrl || fallback" [alt]="item.name" class="compare-img" (error)="onErr($event)">
                  <div class="compare-name">{{ item.name }}</div>
                  <div class="compare-price">{{ item.price.toFixed(2) }} GEL</div>
                  <a [routerLink]="['/products', item.id]" class="btn btn-primary btn-sm" style="margin-top:10px;display:inline-block">View Product</a>
                </td>
              }
            </tr>
            <tr class="highlight-row">
              <td class="compare-label">Best Price?</td>
              @for (item of compare.items(); track item.id) {
                <td class="compare-cell">
                  @if (item.price === minPrice()) {
                    <span class="best-badge">Best Price</span>
                  } @else {
                    <span class="diff-badge">+{{ (item.price - minPrice()).toFixed(2) }} GEL</span>
                  }
                </td>
              }
            </tr>
            <tr>
              <td class="compare-label">Stock</td>
              @for (item of compare.items(); track item.id) {
                <td class="compare-cell">
                  <span class="badge" [class.badge-success]="(item.stock ?? 0) > 0" [class.badge-danger]="(item.stock ?? 0) === 0">
                    {{ (item.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock' }}
                  </span>
                </td>
              }
            </tr>
            @if (loadingSpecs()) {
              <tr>
                <td class="compare-label">Specs</td>
                <td [attr.colspan]="compare.items().length" class="compare-cell">Loading specs...</td>
              </tr>
            } @else {
              @for (spec of specFields; track spec.key) {
                @if (hasAnyValue(spec.key)) {
                  <tr>
                    <td class="compare-label">{{ spec.label }}</td>
                    @for (item of compare.items(); track item.id) {
                      <td class="compare-cell">{{ getSpec(item.id, spec.key) || 'N/A' }}</td>
                    }
                  </tr>
                }
              }
            }
            <tr class="action-row">
              <td class="compare-label"></td>
              @for (item of compare.items(); track item.id) {
                <td class="compare-cell">
                  <a [routerLink]="['/products', item.id]" class="btn btn-primary" style="width:100%">View and Buy</a>
                </td>
              }
            </tr>
          </table>
        </div>
        <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">
          <button class="btn btn-outline" (click)="compare.clear()">Clear All</button>
          <a routerLink="/products" class="btn btn-primary">Add More Products</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-h1 { font-size: 26px; font-weight: 700; margin-bottom: 28px; }
    .compare-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #e0e0e0; }
    .compare-table { width: 100%; border-collapse: collapse; background: white; min-width: 600px; }
    .compare-table tr:nth-child(even) { background: #fafafa; }
    .highlight-row { background: #fffbf0 !important; }
    .compare-label { padding: 14px 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #888; background: #f8f8f8; border-right: 1px solid #e0e0e0; white-space: nowrap; min-width: 140px; vertical-align: middle; }
    .compare-cell { padding: 14px 20px; font-size: 13px; color: #333; border-right: 1px solid #f0f0f0; vertical-align: middle; text-align: center; }
    .compare-cell:last-child { border-right: none; }
    .header-row .compare-label { background: #1e2130; color: #aaa; }
    .header-row .compare-cell { background: #1e2130; padding: 24px 20px; position: relative; }
    .remove-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.1); border: none; color: white; font-size: 12px; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; }
    .remove-btn:hover { background: #dc2626; }
    .compare-img { width: 100px; height: 100px; object-fit: contain; display: block; margin: 0 auto 10px; border-radius: 8px; }
    .compare-name { color: white; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .compare-price { color: #f5a623; font-size: 18px; font-weight: 800; }
    .best-badge { background: #e6f9f0; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .diff-badge { background: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
    .action-row .compare-cell { padding: 20px; background: #f8f8f8; }
  `]
})
export class CompareComponent implements OnInit {
  fallback = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200';
  loadingSpecs = signal(true);
  specsMap = signal<Map<number, any>>(new Map());

  specFields = [
    { key: 'brand', label: 'Brand' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'processor', label: 'Processor' },
    { key: 'gpu', label: 'GPU' },
    { key: 'vram', label: 'VRAM' },
    { key: 'displaySize', label: 'Display Size' },
    { key: 'displayType', label: 'Display Type' },
    { key: 'displayResolution', label: 'Resolution' },
    { key: 'refreshRate', label: 'Refresh Rate' },
    { key: 'operatingSystem', label: 'OS' },
    { key: 'mainCamera', label: 'Main Camera' },
    { key: 'frontCamera', label: 'Front Camera' },
    { key: 'batteryCapacity', label: 'Battery' },
    { key: 'connectivity', label: 'Connectivity' },
    { key: 'cores', label: 'Cores' },
    { key: 'clockSpeed', label: 'Clock Speed' },
    { key: 'tdp', label: 'TDP' },
    { key: 'socket', label: 'Socket' },
    { key: 'weight', label: 'Weight' },
  ];

  constructor(public compare: CompareService, private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAllSpecs();
  }

  fetchAllSpecs(): void {
    const items = this.compare.items();
    if (!items.length) { this.loadingSpecs.set(false); return; }
    let done = 0;
    const map = new Map<number, any>();
    items.forEach(item => {
      this.http.get<any>(environment.apiUrl + '/specs/' + item.id).subscribe({
        next: res => {
          const spec = res?.value || res?.data;
          if (spec) map.set(item.id, spec);
        },
        error: () => {},
        complete: () => {
          done++;
          if (done === items.length) {
            this.specsMap.set(map);
            this.loadingSpecs.set(false);
          }
        }
      });
    });
  }

  getSpec(productId: number, key: string): string {
    const spec = this.specsMap().get(productId);
    if (!spec) return '';
    return spec[key] || '';
  }

  hasAnyValue(key: string): boolean {
    return this.compare.items().some(item => !!this.getSpec(item.id, key));
  }

  minPrice(): number {
    return Math.min(...this.compare.items().map(i => i.price));
  }

  onErr(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallback;
  }
}
