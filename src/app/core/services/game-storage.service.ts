import { Injectable } from '@angular/core';
import type { PersistedGameState } from '../models/limbus.models';

@Injectable({
  providedIn: 'root'
})
export class GameStorageService {
  private readonly storageKey = 'limbusGuessGame';

  saveGameState(state: PersistedGameState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  loadGameState(): PersistedGameState | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return this.isPersistedGameState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  clearGameState(): void {
    localStorage.removeItem(this.storageKey);
  }

  private isPersistedGameState(value: unknown): value is PersistedGameState {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const state = value as Partial<PersistedGameState>;
    return typeof state.date === 'string'
      && Array.isArray(state.guesses)
      && typeof state.currentGuess === 'number'
      && typeof state.gameOver === 'boolean'
      && typeof state.hasWon === 'boolean'
      && typeof state.resultMessage === 'string'
      && Array.isArray(state.usedIds)
      && state.usedIds.every(id => typeof id === 'number');
  }
}
