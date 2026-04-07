import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gtl-tooltip-overlay',
  template: `
    @if (visible()) {
      <div class="custom-tooltip" [style.left.px]="x()" [style.top.px]="y()">
        {{ text() }}
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }']
})
export class TooltipOverlayComponent {
  readonly visible = input(false);
  readonly text = input('');
  readonly x = input(0);
  readonly y = input(0);
}
