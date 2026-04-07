import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { LimbusId } from '../../core/models/limbus.models';

@Component({
  selector: 'gtl-game-result',
  templateUrl: './game-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }']
})
export class GameResultComponent {
  readonly hasWon = input.required<boolean>();
  readonly resultMessage = input.required<string>();
  readonly targetId = input<LimbusId | null>(null);
  readonly timeUntilNextGame = input.required<string>();
}
