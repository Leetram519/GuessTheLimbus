import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'gtl-game-header',
  template: `
    <header class="game-header">
      <div class="header-buttons">
        <button type="button" class="header-btn news-btn" (click)="newsClicked.emit()">
          <span class="btn-icon" aria-hidden="true">📰</span>
          <span class="btn-text">News</span>
        </button>
        <button type="button" class="header-btn bug-btn" (click)="bugClicked.emit()">
          <span class="btn-icon" aria-hidden="true">🐛</span>
          <span class="btn-text">Report Bug</span>
        </button>
      </div>
      <h1>GUESS THE LIMBUS ID</h1>
      <p class="subtitle">A Project Moon Daily Challenge</p>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }']
})
export class GameHeaderComponent {
  readonly newsClicked = output<void>();
  readonly bugClicked = output<void>();
}
