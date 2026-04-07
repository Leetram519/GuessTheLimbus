import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'gtl-news-modal',
  templateUrl: './news-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }']
})
export class NewsModalComponent {
  readonly visible = input(false);
  readonly close = output<void>();

  protected closeModal(): void {
    this.close.emit();
  }
}
