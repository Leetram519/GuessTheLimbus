import { ChangeDetectionStrategy, Component, Inject, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AdPlaceholder } from '../../components/ad-placeholder/ad-placeholder';
import { IdGuessRowComponent } from '../../components/id-guess-row/id-guess-row';
import { IdCardGridComponent } from '../../components/id-card-grid/id-card-grid';
import { ConfirmGuessModalComponent } from '../../components/confirm-guess-modal/confirm-guess-modal';
import { ApiService, GuessComparison, LimbusId, SkillVariation } from '../../services/api.service';

type TrialId =
  | 'hide-rarity'
  | 'hide-season'
  | 'hide-status'
  | 'wrong-clue'
  | 'less-guess'
  | 'plus-power';

type DisplayYesNo = 'YES' | 'NO' | 'HIDDEN';
type DisplayDirectional = 'LESS' | 'YES' | 'MORE' | 'HIDDEN';

interface TrialDefinition {
  id: TrialId;
  name: string;
  description: string;
  stackable: boolean;
}

interface DisplayKeyword {
  keyword: string;
  match: DisplayYesNo;
}

interface DisplayComparison {
  sinner: DisplayYesNo;
  rarity: DisplayYesNo;
  preciseKeywords: DisplayKeyword[];
  statusKeywords: DisplayKeyword[];
  season: DisplayYesNo;
  passiveCount: DisplayDirectional;
  skills: {
    skillNumber: number;
    exists: 'YES' | 'NO';
    variations: {
      variationNumber: number;
      sinAffinity: DisplayYesNo;
      coinCount: DisplayYesNo;
      finalPower: DisplayDirectional;
    }[];
  }[];
  statusKeywordsHidden: boolean;
}

interface GuessResult {
  id: LimbusId;
  comparison: GuessComparison;
  displayComparison: DisplayComparison;
  isCorrect: boolean;
}

interface RoundHistory {
  round: number;
  targetId: number;
  won: boolean;
  guessesUsed: number;
  guessLimit: number;
  activeTrials: TrialId[];
}

interface TrialSummary {
  id: TrialId;
  name: string;
  description: string;
  count: number;
}

interface EndlessSummaryData {
  endedAt: string;
  roundsCleared: number;
  totalRoundsPlayed: number;
  activeTrials: TrialSummary[];
  history: RoundHistory[];
}

interface EndlessState {
  roundNumber: number;
  roundsCleared: number;
  activeTrials: TrialId[];
  targetIdNumber: number;
  guesses: (GuessResult | null)[];
  currentGuess: number;
  maxGuesses: number;
  usedIds: number[];
  gameOver: boolean;
  roundWon: boolean;
  roundMessage: string;
  showTrialSelection: boolean;
  history: RoundHistory[];
}

const ENDLESS_STATE_KEY = 'limbusEndlessState';
const ENDLESS_SUMMARY_KEY = 'limbusEndlessSummary';

const TRIAL_CATALOG: TrialDefinition[] = [
  {
    id: 'hide-rarity',
    name: 'Blind Sigils',
    description: 'Rarity feedback is hidden.',
    stackable: false
  },
  {
    id: 'hide-season',
    name: 'Calendar in Ashes',
    description: 'Season feedback is hidden.',
    stackable: false
  },
  {
    id: 'hide-status',
    name: 'Smothered Status',
    description: 'Status keyword clues are hidden.',
    stackable: false
  },
  {
    id: 'wrong-clue',
    name: 'False Witness',
    description: 'Injects one wrong clue in every guess result.',
    stackable: true
  },
  {
    id: 'less-guess',
    name: 'Shrinking Margin',
    description: 'You lose one guess for each stack (minimum 1).',
    stackable: true
  },
  {
    id: 'plus-power',
    name: 'Overclocked Target',
    description: 'Target skill power comparisons are shifted by +2 per stack.',
    stackable: true
  }
];

@Component({
  selector: 'app-endless-page',
  templateUrl: './endless.html',
  styleUrls: ['./endless.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdPlaceholder, IdGuessRowComponent, IdCardGridComponent, ConfirmGuessModalComponent]
})
export class EndlessGuessPage implements OnInit {
  private readonly isBrowser: boolean;

  protected readonly allIds = signal<LimbusId[]>([]);
  protected readonly filteredIds = signal<LimbusId[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly tooltipText = signal('');
  protected readonly tooltipVisible = signal(false);
  protected readonly tooltipX = signal(0);
  protected readonly tooltipY = signal(0);

  protected readonly guesses = signal<(GuessResult | null)[]>([]);
  protected readonly currentGuess = signal(0);
  protected readonly maxGuesses = signal(4);

  protected readonly targetId = signal<LimbusId | null>(null);
  protected readonly targetIdNumber = signal(0);
  protected readonly usedIds = signal<number[]>([]);

  protected readonly selectedId = signal<LimbusId | null>(null);
  protected readonly showConfirmModal = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly roundNumber = signal(1);
  protected readonly roundsCleared = signal(0);
  protected readonly activeTrials = signal<TrialId[]>([]);
  protected readonly history = signal<RoundHistory[]>([]);

  protected readonly gameOver = signal(false);
  protected readonly roundWon = signal(false);
  protected readonly roundMessage = signal('');
  protected readonly showTrialSelection = signal(false);
  protected readonly selectedTrial = signal<TrialId | null>(null);

  protected readonly trialCatalog = TRIAL_CATALOG;

  protected readonly guessesLeft = computed(() => Math.max(this.maxGuesses() - this.currentGuess(), 0));
  protected readonly trialSummary = computed(() => this.buildTrialSummary());

  constructor(
    private apiService: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    await this.loadIdsFromApi();

    const restored = this.restoreState();
    if (!restored) {
      await this.startFreshSession();
    }
  }

  async loadIdsFromApi() {
    const ids = await this.apiService.getAllIds();
    this.allIds.set(ids);
    this.filteredIds.set([...ids]);
  }

  showTooltip(event: MouseEvent, text: string) {
    this.tooltipText.set(text);
    this.tooltipVisible.set(true);
    this.updateTooltipPosition(event);
  }

  hideTooltip() {
    this.tooltipVisible.set(false);
  }

  updateTooltipPosition(event: MouseEvent) {
    this.tooltipX.set(event.clientX + 15);
    this.tooltipY.set(event.clientY + 15);
  }

  onSearchTermChange(value: string) {
    this.searchTerm.set(value);
    this.filterIds();
  }

  filterIds() {
    const term = this.searchTerm().toLowerCase();
    this.filteredIds.set(this.allIds().filter(id => id.name.toLowerCase().includes(term)));
  }

  selectId(id: LimbusId) {
    if (this.gameOver() || this.usedIds().includes(id.id)) {
      return;
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
    if (!selected || this.isSubmitting() || this.gameOver()) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const result = await this.apiService.verifyGuess(selected.id, this.targetIdNumber());
      if (!result) {
        return;
      }

      const displayComparison = this.applyTrialsToComparison(result.comparison, result.guessedId);
      const updatedGuesses = [...this.guesses()];
      updatedGuesses[this.currentGuess()] = {
        id: result.guessedId,
        comparison: result.comparison,
        displayComparison,
        isCorrect: result.correct
      };

      this.guesses.set(updatedGuesses);
      this.usedIds.update(ids => [...ids, selected.id]);
      this.currentGuess.update(g => g + 1);

      if (result.correct) {
        this.endRound(true);
      } else if (this.currentGuess() >= this.maxGuesses()) {
        this.endRound(false);
      }

      this.searchTerm.set('');
      this.filteredIds.set([...this.allIds()]);
      this.selectedId.set(null);
      this.showConfirmModal.set(false);
      this.saveState();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  continueToTrialSelection() {
    this.showTrialSelection.set(true);
    this.selectedTrial.set(null);
  }

  pickTrial(trialId: TrialId) {
    if (!this.canPickTrial(trialId)) {
      return;
    }

    this.selectedTrial.set(trialId);
  }

  async applyTrialAndContinue() {
    const picked = this.selectedTrial();
    if (!picked) {
      return;
    }

    this.activeTrials.update(trials => [...trials, picked]);
    this.showTrialSelection.set(false);
    this.selectedTrial.set(null);

    const previousTarget = this.targetIdNumber();
    this.roundNumber.update(round => round + 1);
    await this.initializeRound(previousTarget);
  }

  endSession() {
    const summary: EndlessSummaryData = {
      endedAt: new Date().toISOString(),
      roundsCleared: this.roundsCleared(),
      totalRoundsPlayed: this.history().length,
      activeTrials: this.buildTrialSummary(),
      history: this.history()
    };

    if (this.isBrowser) {
      localStorage.setItem(ENDLESS_SUMMARY_KEY, JSON.stringify(summary));
      localStorage.removeItem(ENDLESS_STATE_KEY);
    }

    this.router.navigate(['/endless-summary'], {
      state: { summary }
    });
  }

  canPickTrial(trialId: TrialId): boolean {
    const trial = TRIAL_CATALOG.find(candidate => candidate.id === trialId);
    if (!trial) {
      return false;
    }

    if (trial.stackable) {
      return true;
    }

    return !this.activeTrials().includes(trial.id);
  }

  getTrialCount(trialId: TrialId): number {
    return this.activeTrials().filter(trial => trial === trialId).length;
  }

  areAllKeywordsMatched(keywords: DisplayKeyword[]): boolean {
    if (!keywords.length) {
      return false;
    }

    return keywords.every(keyword => keyword.match === 'YES');
  }

  areSomeKeywordsMatched(keywords: DisplayKeyword[]): boolean {
    return keywords.some(keyword => keyword.match === 'YES');
  }

  isSkillFullyMatched(skill: { exists: 'YES' | 'NO'; variations: { sinAffinity: DisplayYesNo; coinCount: DisplayYesNo; finalPower: DisplayDirectional; }[] }): boolean {
    return skill.exists === 'YES' && skill.variations.every(variation => (
      variation.sinAffinity === 'YES' &&
      variation.coinCount === 'YES' &&
      variation.finalPower === 'YES'
    ));
  }

  isSkillPartiallyMatched(skill: { exists: 'YES' | 'NO'; variations: { sinAffinity: DisplayYesNo; coinCount: DisplayYesNo; finalPower: DisplayDirectional; }[] }): boolean {
    return skill.exists === 'YES' && skill.variations.some(variation => (
      variation.sinAffinity === 'YES' ||
      variation.coinCount === 'YES' ||
      variation.finalPower === 'YES'
    ));
  }

  getSkillVariation(id: LimbusId, skillNumber: number, variationNumber: number): SkillVariation | null {
    const skill = id.skills.find(candidate => candidate.skillNumber === skillNumber);
    if (!skill) {
      return null;
    }

    return skill.variations.find(variation => variation.variationNumber === variationNumber) ?? null;
  }

  private async startFreshSession() {
    this.roundNumber.set(1);
    this.roundsCleared.set(0);
    this.activeTrials.set([]);
    this.history.set([]);
    await this.initializeRound();
  }

  private computeRoundGuessLimit(): number {
    const lessGuessStacks = this.getTrialCount('less-guess');
    return Math.max(4 - lessGuessStacks, 1);
  }

  private async initializeRound(excludeId?: number) {
    const randomTarget = await this.apiService.getRandomId(excludeId);
    if (!randomTarget) {
      this.roundMessage.set('Unable to start next round. Please refresh and try again.');
      this.gameOver.set(true);
      return;
    }

    const target = this.allIds().find(id => id.id === randomTarget.id) ?? null;
    this.targetIdNumber.set(randomTarget.id);
    this.targetId.set(target);

    const guessLimit = this.computeRoundGuessLimit();
    this.maxGuesses.set(guessLimit);
    this.guesses.set(Array.from({ length: guessLimit }, () => null));
    this.currentGuess.set(0);

    this.usedIds.set([]);
    this.gameOver.set(false);
    this.roundWon.set(false);
    this.roundMessage.set('');
    this.showTrialSelection.set(false);

    this.searchTerm.set('');
    this.filteredIds.set([...this.allIds()]);

    this.saveState();
  }

  private endRound(won: boolean) {
    this.gameOver.set(true);
    this.roundWon.set(won);

    this.history.update(history => [
      ...history,
      {
        round: this.roundNumber(),
        targetId: this.targetIdNumber(),
        won,
        guessesUsed: this.currentGuess(),
        guessLimit: this.maxGuesses(),
        activeTrials: [...this.activeTrials()]
      }
    ]);

    if (won) {
      this.roundsCleared.update(value => value + 1);
      this.roundMessage.set(`Round ${this.roundNumber()} cleared in ${this.currentGuess()} guess${this.currentGuess() === 1 ? '' : 'es'}!`);
    } else {
      this.roundMessage.set(`Round ${this.roundNumber()} failed. The target was revealed.`);
    }

    this.saveState();
  }

  private applyTrialsToComparison(baseComparison: GuessComparison, guessedId: LimbusId): DisplayComparison {
    const display: DisplayComparison = {
      sinner: baseComparison.sinner,
      rarity: baseComparison.rarity,
      preciseKeywords: baseComparison.preciseKeywords.map(keyword => ({ ...keyword })),
      statusKeywords: baseComparison.statusKeywords.map(keyword => ({ ...keyword })),
      season: baseComparison.season,
      passiveCount: baseComparison.passiveCount,
      skills: baseComparison.skills.map(skill => ({
        skillNumber: skill.skillNumber,
        exists: skill.exists,
        variations: skill.variations.map(variation => ({ ...variation }))
      })),
      statusKeywordsHidden: false
    };

    if (this.getTrialCount('hide-rarity') > 0) {
      display.rarity = 'HIDDEN';
    }

    if (this.getTrialCount('hide-season') > 0) {
      display.season = 'HIDDEN';
    }

    if (this.getTrialCount('hide-status') > 0) {
      display.statusKeywordsHidden = true;
      display.statusKeywords = [];
    }

    const powerBonus = this.getTrialCount('plus-power') * 2;
    if (powerBonus > 0) {
      this.applyPowerModifier(display, guessedId, powerBonus);
    }

    const wrongClueStacks = this.getTrialCount('wrong-clue');
    for (let index = 0; index < wrongClueStacks; index += 1) {
      const seed = this.hashSeed(`${this.roundNumber()}-${guessedId.id}-${index}`);
      this.injectWrongClue(display, seed);
    }

    return display;
  }

  private applyPowerModifier(display: DisplayComparison, guessedId: LimbusId, powerBonus: number) {
    const target = this.targetId();
    if (!target) {
      return;
    }

    for (const skill of display.skills) {
      const targetSkill = target.skills.find(candidate => candidate.skillNumber === skill.skillNumber);
      if (!targetSkill) {
        continue;
      }

      for (const variation of skill.variations) {
        const guessedVariation = this.getSkillVariation(guessedId, skill.skillNumber, variation.variationNumber);
        const targetVariation = targetSkill.variations.find(candidate => candidate.variationNumber === variation.variationNumber);

        if (!guessedVariation || !targetVariation) {
          continue;
        }

        const boostedPower = targetVariation.finalPower + powerBonus;
        if (guessedVariation.finalPower < boostedPower) {
          variation.finalPower = 'LESS';
        } else if (guessedVariation.finalPower > boostedPower) {
          variation.finalPower = 'MORE';
        } else {
          variation.finalPower = 'YES';
        }
      }
    }
  }

  private injectWrongClue(display: DisplayComparison, seed: number) {
    const candidates: Array<() => boolean> = [
      () => this.flipYesNoField(display, 'sinner'),
      () => this.flipYesNoField(display, 'rarity'),
      () => this.flipYesNoField(display, 'season'),
      () => this.flipPassiveField(display),
      () => this.flipFirstKeyword(display.preciseKeywords),
      () => this.flipFirstKeyword(display.statusKeywords),
      () => this.flipFirstFinalPower(display)
    ];

    for (let offset = 0; offset < candidates.length; offset += 1) {
      const index = (seed + offset) % candidates.length;
      if (candidates[index]()) {
        return;
      }
    }
  }

  private flipYesNoField(display: DisplayComparison, field: 'sinner' | 'rarity' | 'season'): boolean {
    const current = display[field];
    if (current === 'HIDDEN') {
      return false;
    }

    display[field] = current === 'YES' ? 'NO' : 'YES';
    return true;
  }

  private flipPassiveField(display: DisplayComparison): boolean {
    if (display.passiveCount === 'HIDDEN') {
      return false;
    }

    if (display.passiveCount === 'YES') {
      display.passiveCount = 'LESS';
    } else if (display.passiveCount === 'LESS') {
      display.passiveCount = 'MORE';
    } else {
      display.passiveCount = 'YES';
    }

    return true;
  }

  private flipFirstKeyword(keywords: DisplayKeyword[]): boolean {
    const candidate = keywords.find(keyword => keyword.match !== 'HIDDEN');
    if (!candidate) {
      return false;
    }

    candidate.match = candidate.match === 'YES' ? 'NO' : 'YES';
    return true;
  }

  private flipFirstFinalPower(display: DisplayComparison): boolean {
    for (const skill of display.skills) {
      for (const variation of skill.variations) {
        if (variation.finalPower === 'HIDDEN') {
          continue;
        }

        if (variation.finalPower === 'YES') {
          variation.finalPower = 'LESS';
        } else if (variation.finalPower === 'LESS') {
          variation.finalPower = 'MORE';
        } else {
          variation.finalPower = 'YES';
        }

        return true;
      }
    }

    return false;
  }

  private hashSeed(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash);
  }

  private buildTrialSummary(): TrialSummary[] {
    return TRIAL_CATALOG
      .map(trial => ({
        id: trial.id,
        name: trial.name,
        description: trial.description,
        count: this.getTrialCount(trial.id)
      }))
      .filter(trial => trial.count > 0);
  }

  private saveState() {
    if (!this.isBrowser) {
      return;
    }

    const state: EndlessState = {
      roundNumber: this.roundNumber(),
      roundsCleared: this.roundsCleared(),
      activeTrials: this.activeTrials(),
      targetIdNumber: this.targetIdNumber(),
      guesses: this.guesses(),
      currentGuess: this.currentGuess(),
      maxGuesses: this.maxGuesses(),
      usedIds: this.usedIds(),
      gameOver: this.gameOver(),
      roundWon: this.roundWon(),
      roundMessage: this.roundMessage(),
      showTrialSelection: this.showTrialSelection(),
      history: this.history()
    };

    localStorage.setItem(ENDLESS_STATE_KEY, JSON.stringify(state));
  }

  private restoreState(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const raw = localStorage.getItem(ENDLESS_STATE_KEY);
    if (!raw) {
      return false;
    }

    try {
      const state = JSON.parse(raw) as EndlessState;
      const target = this.allIds().find(id => id.id === state.targetIdNumber) ?? null;
      if (!target) {
        localStorage.removeItem(ENDLESS_STATE_KEY);
        return false;
      }

      this.roundNumber.set(state.roundNumber || 1);
      this.roundsCleared.set(state.roundsCleared || 0);
      this.activeTrials.set(Array.isArray(state.activeTrials) ? state.activeTrials : []);
      this.targetIdNumber.set(state.targetIdNumber);
      this.targetId.set(target);
      this.guesses.set(Array.isArray(state.guesses) ? state.guesses : []);
      this.currentGuess.set(state.currentGuess || 0);
      this.maxGuesses.set(state.maxGuesses || this.computeRoundGuessLimit());
      this.usedIds.set(Array.isArray(state.usedIds) ? state.usedIds : []);
      this.gameOver.set(!!state.gameOver);
      this.roundWon.set(!!state.roundWon);
      this.roundMessage.set(state.roundMessage || '');
      this.showTrialSelection.set(!!state.showTrialSelection);
      this.history.set(Array.isArray(state.history) ? state.history : []);

      this.filteredIds.set([...this.allIds()]);
      return true;
    } catch {
      localStorage.removeItem(ENDLESS_STATE_KEY);
      return false;
    }
  }
}
