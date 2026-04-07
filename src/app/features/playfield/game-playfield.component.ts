import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import type { GuessResult } from '../../core/models/limbus.models';
import { TooltipOverlayComponent } from '../../shared/components/tooltip/tooltip-overlay.component';
import {
  areAllKeywordsMatched,
  areSomeKeywordsMatched,
  isSkillFullyMatched,
  isSkillPartiallyMatched
} from '../../shared/utils/comparison.utils';

@Component({
  selector: 'gtl-game-playfield',
  templateUrl: './game-playfield.component.html',
  imports: [TooltipOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }']
})
export class GamePlayfieldComponent {
  readonly guesses = input.required<Array<GuessResult | null>>();
  readonly currentGuess = input.required<number>();

  protected readonly tooltipText = signal('');
  protected readonly tooltipVisible = signal(false);
  protected readonly tooltipX = signal(0);
  protected readonly tooltipY = signal(0);

  protected readonly areAllKeywordsMatched = areAllKeywordsMatched;
  protected readonly areSomeKeywordsMatched = areSomeKeywordsMatched;
  protected readonly isSkillFullyMatched = isSkillFullyMatched;
  protected readonly isSkillPartiallyMatched = isSkillPartiallyMatched;

  protected showTooltip(event: MouseEvent, text: string): void {
    this.tooltipText.set(text);
    this.tooltipVisible.set(true);
    this.updateTooltipPosition(event);
  }

  protected hideTooltip(): void {
    this.tooltipVisible.set(false);
  }

  protected updateTooltipPosition(event: MouseEvent): void {
    this.tooltipX.set(event.clientX + 15);
    this.tooltipY.set(event.clientY + 15);
  }
}
