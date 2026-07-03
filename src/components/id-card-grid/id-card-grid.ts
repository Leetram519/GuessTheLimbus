import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LimbusId } from '../../services/api.service';

@Component({
  selector: 'app-id-card-grid',
  standalone: true,
  templateUrl: './id-card-grid.html',
  styleUrls: ['./id-card-grid.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdCardGridComponent {
  @Input() ids: LimbusId[] = [];
  @Input() usedIds: number[] = [];
  @Input() searchTerm = '';
  @Input() disabled = false;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() selectId = new EventEmitter<LimbusId>();

  onSearchChange(value: string) {
    this.searchTermChange.emit(value);
  }

  onSelect(id: LimbusId) {
    if (this.disabled || this.usedIds.includes(id.id)) {
      return;
    }

    this.selectId.emit(id);
  }
}
