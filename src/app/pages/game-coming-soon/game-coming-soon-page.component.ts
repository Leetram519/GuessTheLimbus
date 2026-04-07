import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'gtl-game-coming-soon-page',
  imports: [RouterLink],
  template: `
    <section class="coming-soon-page">
      <div class="coming-soon-card">
        <h1>{{ gameTitle() }}</h1>
        <p>{{ gameDescription() }}</p>

        <div class="coming-soon-notes">
          <h2>Migration Ready</h2>
          <ul>
            <li>Dedicated route already exists for this mode.</li>
            <li>You can now add mode-specific services and components in isolation.</li>
            <li>The global header automatically lists and routes to this mode.</li>
          </ul>
        </div>

        <a class="coming-soon-link" routerLink="/games/guess-id">Back to Guess the ID</a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComingSoonPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly gameTitle = signal(this.resolveData('gameTitle', 'New Game Mode'));
  protected readonly gameDescription = signal(
    this.resolveData('gameDescription', 'This game mode is under construction.')
  );

  private resolveData(key: string, fallback: string): string {
    const rawValue = this.route.snapshot.data[key];
    return typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : fallback;
  }
}
