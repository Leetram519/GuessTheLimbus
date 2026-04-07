import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { GameModeService } from '../core/services/game-mode.service';

@Component({
  selector: 'gtl-site-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="site-brand">
        <a class="brand-link" routerLink="/games/guess-id">Guess The Limbus</a>
        <p class="brand-subtitle">Game Hub</p>
      </div>

      <nav class="site-nav" aria-label="Game navigation">
        @for (mode of gameMode.modes(); track mode.key) {
          <a
            class="site-nav-link"
            [class.is-active]="gameMode.activeMode() === mode.key"
            [class.is-coming-soon]="!mode.available"
            [routerLink]="['/', mode.route]"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            [attr.aria-current]="gameMode.activeMode() === mode.key ? 'page' : null"
          >
            <span class="site-nav-label">{{ mode.label }}</span>
            @if (!mode.available) {
              <span class="site-nav-badge">Soon</span>
            }
          </a>
        }
      </nav>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteHeaderComponent {
  protected readonly gameMode = inject(GameModeService);
  private readonly router = inject(Router);

  constructor() {
    this.gameMode.setActiveModeFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        this.gameMode.setActiveModeFromUrl(event.urlAfterRedirects);
      });
  }
}
