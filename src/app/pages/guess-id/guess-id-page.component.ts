import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { GameFacadeService } from '../../core/services/game-facade.service';
import { GameHeaderComponent } from '../../features/header/game-header.component';
import { GamePlayfieldComponent } from '../../features/playfield/game-playfield.component';
import { IdSelectionComponent } from '../../features/selection/id-selection.component';
import { GameResultComponent } from '../../features/result/game-result.component';
import { HowToPlayComponent } from '../../features/how-to-play/how-to-play.component';
import { ConfirmGuessModalComponent } from '../../features/modals/confirm-guess-modal.component';
import { NewsModalComponent } from '../../features/modals/news-modal.component';

@Component({
  selector: 'gtl-guess-id-page',
  templateUrl: './guess-id-page.component.html',
  imports: [
    GameHeaderComponent,
    GamePlayfieldComponent,
    IdSelectionComponent,
    GameResultComponent,
    HowToPlayComponent,
    ConfirmGuessModalComponent,
    NewsModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuessIdPageComponent implements OnInit, OnDestroy {
  protected readonly game = inject(GameFacadeService);

  async ngOnInit(): Promise<void> {
    await this.game.initialize();
  }

  ngOnDestroy(): void {
    this.game.destroy();
  }
}
