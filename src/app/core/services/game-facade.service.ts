import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../api.service';
import type { GuessResult, LimbusId, PersistedGameState, VerifyGuessResponse } from '../models/limbus.models';
import { GameStorageService } from './game-storage.service';
import { GameTimerService } from './game-timer.service';
import { IdSearchService } from './id-search.service';

@Injectable({
  providedIn: 'root'
})
export class GameFacadeService {
  private readonly apiService = inject(ApiService);
  private readonly storageService = inject(GameStorageService);
  private readonly timerService = inject(GameTimerService);
  private readonly searchService = inject(IdSearchService);

  private readonly _guesses = signal<Array<GuessResult | null>>([null, null, null, null]);
  private readonly _currentGuess = signal(0);
  private readonly _targetId = signal<LimbusId | null>(null);
  private readonly _targetIdNumber = signal(0);
  private readonly _selectedId = signal<LimbusId | null>(null);
  private readonly _showConfirmModal = signal(false);
  private readonly _showNewsModal = signal(false);
  private readonly _gameOver = signal(false);
  private readonly _hasWon = signal(false);
  private readonly _resultMessage = signal('');
  private readonly _usedIds = signal<number[]>([]);
  private readonly _isSubmitting = signal(false);
  private initialized = false;

  readonly allIds = this.searchService.allIds;
  readonly filteredIds = this.searchService.filteredIds;
  readonly searchTerm = this.searchService.searchTerm;
  readonly guesses = this._guesses.asReadonly();
  readonly currentGuess = this._currentGuess.asReadonly();
  readonly targetId = this._targetId.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly showConfirmModal = this._showConfirmModal.asReadonly();
  readonly showNewsModal = this._showNewsModal.asReadonly();
  readonly gameOver = this._gameOver.asReadonly();
  readonly hasWon = this._hasWon.asReadonly();
  readonly resultMessage = this._resultMessage.asReadonly();
  readonly usedIds = this._usedIds.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly timeUntilNextGame = this.timerService.timeUntilNextGame;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    await this.loadIdsFromApi();
    await this.initializeGame();
    this.timerService.startCountdown();
  }

  destroy(): void {
    this.timerService.stopCountdown();
  }

  openNewsModal(): void {
    this._showNewsModal.set(true);
  }

  closeNewsModal(): void {
    this._showNewsModal.set(false);
  }

  openBugReport(): void {
    window.open('https://github.com/Leetram519/GuessTheLimbus/issues', '_blank');
  }

  onSearchTermChange(value: string): void {
    this.searchService.setSearchTerm(value);
  }

  selectId(id: LimbusId): void {
    if (this._usedIds().includes(id.id) || this._gameOver()) {
      return;
    }

    this._selectedId.set(id);
    this._showConfirmModal.set(true);
  }

  cancelSelection(): void {
    this._selectedId.set(null);
    this._showConfirmModal.set(false);
  }

  async confirmGuess(): Promise<void> {
    const selected = this._selectedId();
    if (!selected || this._isSubmitting()) {
      return;
    }

    this._isSubmitting.set(true);

    try {
      const result = await this.apiService.verifyGuess(selected.id, this._targetIdNumber());
      if (!result) {
        console.error('Failed to verify guess');
        return;
      }

      this.applyGuessResult(selected.id, result);
    } finally {
      this._isSubmitting.set(false);
    }
  }

  private async loadIdsFromApi(): Promise<void> {
    const ids = await this.apiService.getAllIds();
    this.searchService.setAllIds(ids);
  }

  private async initializeGame(): Promise<void> {
    const dailyId = await this.apiService.getDailyId();

    if (dailyId) {
      this._targetIdNumber.set(dailyId.id);
      this.timerService.setServerTimezone(dailyId.timezone);
      this.updateTargetIdByNumber(dailyId.id);
    }

    const savedState = this.storageService.loadGameState();
    const currentDate = this.timerService.getDateString();
    if (savedState && savedState.date === currentDate) {
      this.restoreGameState(savedState);
    }
  }

  private updateTargetIdByNumber(targetId: number): void {
    const target = this.searchService.allIds().find(id => id.id === targetId) ?? null;
    this._targetId.set(target);
  }

  private restoreGameState(savedState: PersistedGameState): void {
    this._guesses.set(savedState.guesses);
    this._currentGuess.set(savedState.currentGuess);
    this._gameOver.set(savedState.gameOver);
    this._hasWon.set(savedState.hasWon);
    this._resultMessage.set(savedState.resultMessage);
    this._usedIds.set(savedState.usedIds);
  }

  private applyGuessResult(selectedId: number, result: VerifyGuessResponse): void {
    const guessIndex = this._currentGuess();
    const currentGuesses = [...this._guesses()];

    if (guessIndex >= currentGuesses.length) {
      return;
    }

    currentGuesses[guessIndex] = {
      id: result.guessedId,
      comparison: result.comparison,
      isCorrect: result.correct
    };

    this._guesses.set(currentGuesses);
    this._usedIds.update(ids => [...ids, selectedId]);
    this._currentGuess.update(value => value + 1);

    if (result.correct) {
      this.endGame(true);
    } else if (this._currentGuess() >= currentGuesses.length) {
      this.endGame(false);
    }

    this.persistGameState();
    this._showConfirmModal.set(false);
    this._selectedId.set(null);
    this.searchService.resetSearch();
  }

  private endGame(won: boolean): void {
    this._gameOver.set(true);
    this._hasWon.set(won);

    if (won) {
      const tries = this._currentGuess();
      this._resultMessage.set(`Congratulations! You guessed the ID in ${tries} ${tries === 1 ? 'try' : 'tries'}!`);
    } else {
      this._resultMessage.set('Better luck tomorrow! The correct ID was:');
    }

    this.persistGameState();
  }

  private persistGameState(): void {
    const state: PersistedGameState = {
      date: this.timerService.getDateString(),
      guesses: this._guesses(),
      currentGuess: this._currentGuess(),
      gameOver: this._gameOver(),
      hasWon: this._hasWon(),
      resultMessage: this._resultMessage(),
      usedIds: this._usedIds()
    };

    this.storageService.saveGameState(state);
  }
}
