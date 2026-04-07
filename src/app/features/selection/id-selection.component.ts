import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LimbusId } from '../../core/models/limbus.models';

@Component({
  selector: 'gtl-id-selection',
  templateUrl: './id-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }']
})
export class IdSelectionComponent {
  readonly searchTerm = input.required<string>();
  readonly filteredIds = input.required<LimbusId[]>();
  readonly usedIds = input.required<number[]>();
  readonly searchTermChanged = output<string>();
  readonly idSelected = output<LimbusId>();

  protected onSearchInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchTermChanged.emit(target.value);
    }
  }

  protected selectId(id: LimbusId): void {
    this.idSelected.emit(id);
  }
}
