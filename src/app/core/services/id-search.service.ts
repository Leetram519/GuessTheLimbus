import { Injectable, computed, signal } from '@angular/core';
import type { LimbusId } from '../models/limbus.models';

@Injectable({
  providedIn: 'root'
})
export class IdSearchService {
  private readonly _allIds = signal<LimbusId[]>([]);
  private readonly _searchTerm = signal('');

  readonly allIds = this._allIds.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly filteredIds = computed(() => {
    const term = this._searchTerm().trim().toLowerCase();
    if (!term) {
      return this._allIds();
    }

    return this._allIds().filter(id => id.name.toLowerCase().includes(term));
  });

  setAllIds(ids: LimbusId[]): void {
    this._allIds.set(ids);
  }

  setSearchTerm(value: string): void {
    this._searchTerm.set(value);
  }

  resetSearch(): void {
    this._searchTerm.set('');
  }
}
