import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LimbusId } from '../../core/models/limbus.models';

@Component({
  selector: 'gtl-confirm-guess-modal',
  templateUrl: './confirm-guess-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }']
})
export class ConfirmGuessModalComponent {
  readonly visible = input(false);
  readonly selectedId = input<LimbusId | null>(null);
  readonly isSubmitting = input(false);
  readonly cancel = output<void>();
  readonly confirm = output<void>();

  protected close(): void {
    this.cancel.emit();
  }

  protected submit(): void {
    this.confirm.emit();
  }
}
