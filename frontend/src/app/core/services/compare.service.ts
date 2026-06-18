import { Injectable, signal, computed } from '@angular/core';

export interface CompareItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  stock?: number;
}

@Injectable({ providedIn: 'root' })
export class CompareService {
  private readonly MAX = 4;
  items = signal<CompareItem[]>([]);
  count = computed(() => this.items().length);

  add(item: CompareItem): boolean {
    if (this.items().length >= this.MAX) return false;
    if (this.items().find(i => i.id === item.id)) return false;
    this.items.set([...this.items(), item]);
    return true;
  }

  remove(id: number): void {
    this.items.set(this.items().filter(i => i.id !== id));
  }

  toggle(item: CompareItem): boolean {
    if (this.has(item.id)) { this.remove(item.id); return false; }
    return this.add(item);
  }

  has(id: number): boolean {
    return !!this.items().find(i => i.id === id);
  }

  clear(): void { this.items.set([]); }
}
