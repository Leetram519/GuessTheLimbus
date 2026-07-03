import { Component, OnInit, signal, computed, ChangeDetectionStrategy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, LimbusId, GuessComparison } from '../../services/api.service';
import { AnalyticsParams, AnalyticsService, PlayerType } from '../../services/analytics.service';
import { AdPlaceholder } from '../../components/ad-placeholder/ad-placeholder';
import { IdGuessRowComponent } from '../../components/id-guess-row/id-guess-row';
import { IdCardGridComponent } from '../../components/id-card-grid/id-card-grid';
import { HowToPlayComponent } from '../../components/how-to-play/how-to-play';
import { ConfirmGuessModalComponent } from '../../components/confirm-guess-modal/confirm-guess-modal';

interface GuessResult {
  id: LimbusId;
  comparison: GuessComparison;
  isCorrect: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './hero.html',
  styleUrls: ['./hero.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdPlaceholder,
    IdGuessRowComponent,
    IdCardGridComponent,
    HowToPlayComponent,
    ConfirmGuessModalComponent
  ]
})
export class IdGuessPage implements OnInit {
  private readonly isBrowser: boolean;

  private readonly sessionId = this.generateSessionId();

  protected readonly playerType = signal<PlayerType>('new');
  protected readonly sessionsCount = signal(0);
  protected readonly daysPlayed = signal(0);

  protected readonly allIds = signal<LimbusId[]>([]);
  protected readonly filteredIds = signal<LimbusId[]>([]);
  protected readonly searchTerm = signal('');
  
  protected readonly guesses = signal<(GuessResult | null)[]>([null, null, null, null]);
  protected readonly currentGuess = signal(0);
  
  protected readonly targetId = signal<LimbusId | null>(null);
  protected readonly targetIdNumber = signal(0);
  protected readonly selectedId = signal<LimbusId | null>(null);
  protected readonly showConfirmModal = signal(false);
  
  protected readonly gameOver = signal(false);
  protected readonly hasWon = signal(false);
  protected readonly resultMessage = signal('');
  protected readonly timeUntilNextGame = signal('');
  protected readonly serverTimezone = signal('Europe/Paris');
  protected readonly serverResetTime = signal(0);
  protected readonly usedIds = signal<number[]>([]);
  
  protected readonly showNewsModal = signal(false);
  protected readonly isSubmitting = signal(false);

  constructor(
    private apiService: ApiService,
    private analyticsService: AnalyticsService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  openNewsModal() {
    this.showNewsModal.set(true);
  }

  closeNewsModal() {
    this.showNewsModal.set(false);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      this.initializeAnalyticsContext();
    }

    await this.loadIdsFromApi();
    await this.initializeGame();

    if (this.isBrowser) {
      this.trackEvent('session_start', {
        session_id: this.sessionId,
        player_type: this.playerType(),
        sessions_count: this.sessionsCount(),
        days_played: this.daysPlayed(),
        timezone: this.serverTimezone()
      });
    }

    this.updateTimeUntilNextGame();
    if (this.isBrowser) {
      setInterval(() => this.updateTimeUntilNextGame(), 1000);
    }
  }

  async loadIdsFromApi() {
    console.log('Loading IDs from API...');
    const ids = await this.apiService.getAllIds();
    this.allIds.set(ids);
    console.log(`Loaded ${ids.length} IDs from API`);
    this.filteredIds.set([...ids]);
  }

  async initializeGame() {
    const dailyId = await this.apiService.getDailyId();
    
    if (dailyId) {
      this.targetIdNumber.set(dailyId.id);
      this.serverTimezone.set(dailyId.timezone);
      this.serverResetTime.set(dailyId.msUntilReset);
      const targetIdData = this.allIds().find(id => id.id === dailyId.id);
      
      if (targetIdData) {
        this.targetId.set(targetIdData);
      }
    }
    
    const savedState = this.loadGameState();
    if (savedState && savedState.date === this.getDateString()) {
      this.guesses.set(savedState.guesses);
      this.currentGuess.set(savedState.currentGuess);
      this.gameOver.set(savedState.gameOver);
      this.hasWon.set(savedState.hasWon);
      this.resultMessage.set(savedState.resultMessage);
      this.usedIds.set(savedState.usedIds || []);

      if (this.isBrowser) {
        this.trackEvent('daily_state_loaded', {
          session_id: this.sessionId,
          player_type: this.playerType(),
          guesses_already_used: savedState.currentGuess,
          game_over: savedState.gameOver,
          has_won: savedState.hasWon
        });
      }
    } else {
      if (this.isBrowser) {
        this.trackEvent('daily_state_new', {
          session_id: this.sessionId,
          player_type: this.playerType()
        });
      }
    }
    
    this.filteredIds.set([...this.allIds()]);
  }

  filterIds() {
    const term = this.searchTerm().toLowerCase();
    this.filteredIds.set(
      this.allIds().filter(id => id.name.toLowerCase().includes(term))
    );
  }

  selectId(id: LimbusId) {
    const isUsed = this.usedIds().includes(id.id);
    if (isUsed || this.gameOver()) return;

    if (this.isBrowser) {
      this.trackEvent('guess_candidate_selected', {
        session_id: this.sessionId,
        player_type: this.playerType(),
        guess_number: this.currentGuess() + 1,
        guessed_id: id.id,
        guessed_name: id.name,
        guessed_sinner: id.sinner,
        guessed_rarity: id.rarity
      });
    }

    this.selectedId.set(id);
    this.showConfirmModal.set(true);
  }

  cancelSelection() {
    this.selectedId.set(null);
    this.showConfirmModal.set(false);
  }

  async confirmGuess() {
    const selected = this.selectedId();
    if (!selected || this.isSubmitting()) return;
    
    this.isSubmitting.set(true);
    
    try {
      const result = await this.apiService.verifyGuess(selected.id, this.targetIdNumber());
      if (!result) {
        console.error('Failed to verify guess');
        this.isSubmitting.set(false);
        return;
      }
      
      const currentGuesses = [...this.guesses()];
      const guessNumber = this.currentGuess() + 1;

      currentGuesses[this.currentGuess()] = {
        id: result.guessedId,
        comparison: result.comparison,
        isCorrect: result.correct
      };
      this.guesses.set(currentGuesses);

      const exactMatches = this.countExactMatches(result.comparison);
      const skillExactMatches = this.countSkillExactMatches(result.comparison);

      if (this.isBrowser) {
        this.trackEvent('guess_submitted', {
          session_id: this.sessionId,
          player_type: this.playerType(),
          guess_number: guessNumber,
          guessed_id: selected.id,
          guessed_name: selected.name,
          guessed_sinner: selected.sinner,
          guessed_rarity: selected.rarity,
          is_correct: result.correct,
          exact_matches: exactMatches,
          skill_exact_matches: skillExactMatches
        });

        this.trackEvent(result.correct ? 'good_guess' : 'bad_guess', {
          session_id: this.sessionId,
          player_type: this.playerType(),
          guess_number: guessNumber,
          guessed_id: selected.id,
          guessed_name: selected.name,
          exact_matches: exactMatches,
          skill_exact_matches: skillExactMatches
        });
      }
      
      this.usedIds.update(ids => [...ids, selected.id]);
      this.currentGuess.update(g => g + 1);
      
      if (result.correct) {
        this.endGame(true);
      } else if (this.currentGuess() >= 4) {
        this.endGame(false);
      }
      
      this.saveGameState();
      this.showConfirmModal.set(false);
      this.selectedId.set(null);
      
      // Reset search for next guess
      this.searchTerm.set('');
      this.filteredIds.set([...this.allIds()]);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  endGame(won: boolean) {
    this.gameOver.set(true);
    this.hasWon.set(won);
    if (won) {
      this.resultMessage.set(`Congratulations! You guessed the ID in ${this.currentGuess()} ${this.currentGuess() === 1 ? 'try' : 'tries'}!`);
    } else {
      this.resultMessage.set(`Better luck tomorrow! The correct ID was:`);
    }

    if (this.isBrowser) {
      const target = this.targetId();
      this.trackEvent('game_completed', {
        session_id: this.sessionId,
        player_type: this.playerType(),
        won,
        guesses_used: this.currentGuess(),
        target_id: target ? target.id : null,
        target_name: target ? target.name : null
      });
    }

    this.saveGameState();
  }

  updateTimeUntilNextGame() {
    // Get current time in server's timezone (Europe/Paris)
    const nowLocal = new Date();
    const parisTimeString = nowLocal.toLocaleString('en-US', { timeZone: this.serverTimezone() });
    const nowParis = new Date(parisTimeString);
    
    // Calculate midnight in Paris timezone
    const tomorrowParis = new Date(nowParis.getFullYear(), nowParis.getMonth(), nowParis.getDate() + 1);
    
    // Get the difference
    const diff = tomorrowParis.getTime() - nowParis.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    this.timeUntilNextGame.set(`${hours}h ${minutes}m ${seconds}s`);
  }

  getDateString(): string {
    // Get date string in server's timezone (Europe/Paris)
    const nowLocal = new Date();
    const parisTimeString = nowLocal.toLocaleString('en-US', { timeZone: this.serverTimezone() });
    const today = new Date(parisTimeString);
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  saveGameState() {
    if (!this.isBrowser) {
      return;
    }

    const state = {
      date: this.getDateString(),
      guesses: this.guesses(),
      currentGuess: this.currentGuess(),
      gameOver: this.gameOver(),
      hasWon: this.hasWon(),
      resultMessage: this.resultMessage(),
      usedIds: this.usedIds()
    };
    localStorage.setItem('limbusGuessGame', JSON.stringify(state));
  }

  loadGameState(): any {
    if (!this.isBrowser) {
      return null;
    }

    const saved = localStorage.getItem('limbusGuessGame');
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Invalid saved game state, clearing local storage entry:', error);
      localStorage.removeItem('limbusGuessGame');
      return null;
    }
  }

  onSearchTermChange(value: string) {
    this.searchTerm.set(value);
    this.filterIds();
  }

  private initializeAnalyticsContext() {
    if (!this.isBrowser) {
      return;
    }

    const nowIso = new Date().toISOString();
    const hasFirstSeen = !!localStorage.getItem(this.analyticsService.analyticsStorageKeys.firstSeen);

    if (!hasFirstSeen) {
      localStorage.setItem(this.analyticsService.analyticsStorageKeys.firstSeen, nowIso);
      this.playerType.set('new');
      this.trackEvent('player_first_visit', {
        session_id: this.sessionId,
        player_type: 'new'
      });
    } else {
      this.playerType.set('returning');
    }

    const sessionsCount = this.safeParseNumber(localStorage.getItem(this.analyticsService.analyticsStorageKeys.sessions)) + 1;
    localStorage.setItem(this.analyticsService.analyticsStorageKeys.sessions, String(sessionsCount));
    this.sessionsCount.set(sessionsCount);

    const today = this.getDateString();
    const lastPlayedDate = localStorage.getItem(this.analyticsService.analyticsStorageKeys.lastPlayedDate);
    const previousDaysPlayed = this.safeParseNumber(localStorage.getItem(this.analyticsService.analyticsStorageKeys.daysPlayed));

    if (lastPlayedDate !== today) {
      const updatedDaysPlayed = previousDaysPlayed + 1;
      localStorage.setItem(this.analyticsService.analyticsStorageKeys.daysPlayed, String(updatedDaysPlayed));
      localStorage.setItem(this.analyticsService.analyticsStorageKeys.lastPlayedDate, today);
      this.daysPlayed.set(updatedDaysPlayed);
    } else {
      this.daysPlayed.set(previousDaysPlayed);
    }
  }

  private safeParseNumber(value: string | null): number {
    if (!value) {
      return 0;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private countExactMatches(comparison: GuessComparison): number {
    let matches = 0;

    if (comparison.sinner === 'YES') matches += 1;
    if (comparison.rarity === 'YES') matches += 1;
    if (comparison.season === 'YES') matches += 1;
    if (comparison.passiveCount === 'YES') matches += 1;

    return matches;
  }

  private countSkillExactMatches(comparison: GuessComparison): number {
    let matches = 0;

    for (const skill of comparison.skills) {
      if (skill.exists !== 'YES') {
        continue;
      }

      for (const variation of skill.variations) {
        if (
          variation.sinAffinity === 'YES' &&
          variation.coinCount === 'YES' &&
          variation.finalPower === 'YES'
        ) {
          matches += 1;
        }
      }
    }

    return matches;
  }

  private trackEvent(eventName: string, params: AnalyticsParams = {}) {
    if (!this.isBrowser) {
      return;
    }

    type GtagFn = (command: 'event', name: string, eventParams?: AnalyticsParams) => void;

    const maybeWindow = window as unknown as {
      gtag?: GtagFn;
      dataLayer?: unknown[];
    };

    const eventParams: AnalyticsParams = {
      ...params,
      app: 'guess_the_limbus'
    };

    if (typeof maybeWindow.gtag === 'function') {
      maybeWindow.gtag('event', eventName, eventParams);
      return;
    }

    if (Array.isArray(maybeWindow.dataLayer)) {
      maybeWindow.dataLayer.push({
        event: eventName,
        ...eventParams
      });
    }
  }
}
