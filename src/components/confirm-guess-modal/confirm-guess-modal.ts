import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LimbusId } from '../../services/api.service';

@Component({
  selector: 'app-confirm-guess-modal',
  standalone: true,
  templateUrl: './confirm-guess-modal.html',
  styleUrls: ['./confirm-guess-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmGuessModalComponent {
  @Input() isOpen = false;
  @Input() selectedId: LimbusId | null = null;
  @Input() isSubmitting = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }
}
