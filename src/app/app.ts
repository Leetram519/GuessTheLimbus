import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, LimbusId, GuessComparison } from './api.service';

interface GuessResult {
  id: LimbusId;
  comparison: GuessComparison;
  isCorrect: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
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
  protected readonly usedIds = signal<number[]>([]);

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.loadIdsFromApi();
    await this.initializeGame();
    this.updateTimeUntilNextGame();
    setInterval(() => this.updateTimeUntilNextGame(), 1000);
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
      const targetIdData = this.allIds().find(id => id.id === dailyId.id);
      
      if (targetIdData) {
        this.targetId.set(targetIdData);
        console.log(`Today's target ID: ${targetIdData.name}`);
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
    this.selectedId.set(id);
    this.showConfirmModal.set(true);
  }

  cancelSelection() {
    this.selectedId.set(null);
    this.showConfirmModal.set(false);
  }

  async confirmGuess() {
    const selected = this.selectedId();
    if (!selected) return;
    
    const result = await this.apiService.verifyGuess(selected.id, this.targetIdNumber());
    if (!result) {
      console.error('Failed to verify guess');
      return;
    }
    
    const currentGuesses = [...this.guesses()];
    currentGuesses[this.currentGuess()] = {
      id: result.guessedId,
      comparison: result.comparison,
      isCorrect: result.correct
    };
    this.guesses.set(currentGuesses);
    
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
  }

  endGame(won: boolean) {
    this.gameOver.set(true);
    this.hasWon.set(won);
    if (won) {
      this.resultMessage.set(`Congratulations! You guessed the ID in ${this.currentGuess()} ${this.currentGuess() === 1 ? 'try' : 'tries'}!`);
    } else {
      this.resultMessage.set(`Better luck tomorrow! The correct ID was:`);
    }
    this.saveGameState();
  }

  updateTimeUntilNextGame() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    this.timeUntilNextGame.set(`${hours}h ${minutes}m ${seconds}s`);
  }

  getDateString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  saveGameState() {
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
    const saved = localStorage.getItem('limbusGuessGame');
    return saved ? JSON.parse(saved) : null;
  }

  onSearchTermChange(value: string) {
    this.searchTerm.set(value);
    this.filterIds();
  }

  // Helper methods for quick preview
  areAllKeywordsMatched(keywords: { keyword: string; match: "YES" | "NO" }[]): boolean {
    return keywords.every(kw => kw.match === 'YES');
  }

  areSomeKeywordsMatched(keywords: { keyword: string; match: "YES" | "NO" }[]): boolean {
    return keywords.some(kw => kw.match === 'YES');
  }

  isSkillFullyMatched(skill: { exists: "YES" | "NO"; variations: any[] }): boolean {
    return skill.exists === 'YES' && skill.variations.every(v => 
      v.sinAffinity === 'YES' && v.coinCount === 'YES' && v.finalPower === 'YES'
    );
  }

  isSkillPartiallyMatched(skill: { exists: "YES" | "NO"; variations: any[] }): boolean {
    return skill.exists === 'YES' && skill.variations.some(v => 
      v.sinAffinity === 'YES' || v.coinCount === 'YES' || v.finalPower === 'YES'
    );
  }
}
