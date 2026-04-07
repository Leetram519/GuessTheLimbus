import { Injectable, computed, signal } from '@angular/core';
import type { GameModeDefinition, GameModeKey } from '../models/game-mode.model';

const DEFAULT_GAME_MODES: GameModeDefinition[] = [
  {
    key: 'guess-id',
    label: 'Guess the ID',
    route: 'games/guess-id',
    description: 'Daily guess mode for identities.',
    available: true
  },
  {
    key: 'guess-ego',
    label: 'Guess the EGO',
    route: 'games/guess-ego',
    description: 'Daily guess mode for EGOs.',
    available: false
  },
  {
    key: 'endless',
    label: 'Endless',
    route: 'games/endless',
    description: 'Unlimited rounds with rotating prompts.',
    available: false
  }
];

@Injectable({
  providedIn: 'root'
})
export class GameModeService {
  private readonly _modes = signal<GameModeDefinition[]>(DEFAULT_GAME_MODES);
  private readonly _activeMode = signal<GameModeKey>('guess-id');

  readonly modes = this._modes.asReadonly();
  readonly activeMode = this._activeMode.asReadonly();
  readonly availableModes = computed(() => this._modes().filter(mode => mode.available));

  setActiveMode(modeKey: GameModeKey): void {
    const exists = this._modes().some(mode => mode.key === modeKey);
    if (exists) {
      this._activeMode.set(modeKey);
    }
  }

  setActiveModeFromUrl(url: string): void {
    const [pathWithoutQuery] = url.split('?');
    const [pathWithoutHash] = pathWithoutQuery.split('#');
    const normalized = pathWithoutHash.startsWith('/') ? pathWithoutHash.slice(1) : pathWithoutHash;
    const matchedMode = this._modes().find(mode => normalized === mode.route);
    this._activeMode.set(matchedMode?.key ?? 'guess-id');
  }

  setModeAvailability(modeKey: GameModeKey, available: boolean): void {
    this._modes.update(modes =>
      modes.map(mode => mode.key === modeKey ? { ...mode, available } : mode)
    );
  }
}
