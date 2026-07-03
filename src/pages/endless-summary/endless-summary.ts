import { ChangeDetectionStrategy, Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

type TrialId =
  | 'hide-rarity'
  | 'hide-season'
  | 'hide-status'
  | 'wrong-clue'
  | 'less-guess'
  | 'plus-power';

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

const ENDLESS_SUMMARY_KEY = 'limbusEndlessSummary';
const ENDLESS_STATE_KEY = 'limbusEndlessState';

@Component({
  selector: 'app-endless-summary',
  templateUrl: './endless-summary.html',
  styleUrls: ['./endless-summary.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe]
})
export class EndlessSummaryPage implements OnInit {
  private readonly isBrowser: boolean;

  protected readonly summary = signal<EndlessSummaryData | null>(null);
  protected readonly copied = signal(false);
  protected readonly shareError = signal('');

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    const fromNavigation = history.state?.summary as EndlessSummaryData | undefined;
    if (fromNavigation) {
      this.summary.set(fromNavigation);
      return;
    }

    if (!this.isBrowser) {
      return;
    }

    const raw = localStorage.getItem(ENDLESS_SUMMARY_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as EndlessSummaryData;
      this.summary.set(parsed);
    } catch {
      localStorage.removeItem(ENDLESS_SUMMARY_KEY);
    }
  }

  async copyShareText() {
    const summary = this.summary();
    if (!summary || !this.isBrowser || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.buildShareText(summary));
      this.copied.set(true);
      this.shareError.set('');
    } catch {
      this.shareError.set('Unable to copy your achievement.');
    }
  }

  async nativeShare() {
    const summary = this.summary();
    if (!summary || !this.isBrowser) {
      return;
    }

    const shareText = this.buildShareText(summary);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Guess The Limbus - Endless Run',
          text: shareText,
          url: window.location.origin
        });
        this.shareError.set('');
        return;
      } catch {
        this.shareError.set('Share was cancelled or unavailable.');
        return;
      }
    }

    await this.copyShareText();
  }

  shareToX() {
    const summary = this.summary();
    if (!summary || !this.isBrowser) {
      return;
    }

    const text = encodeURIComponent(this.buildShareText(summary));
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  playAgain() {
    if (this.isBrowser) {
      localStorage.removeItem(ENDLESS_STATE_KEY);
    }

    this.router.navigate(['/endless']);
  }

  goToDaily() {
    this.router.navigate(['/idguess']);
  }

  private buildShareText(summary: EndlessSummaryData): string {
    const trials = summary.activeTrials.length > 0
      ? summary.activeTrials.map(trial => `${trial.name} x${trial.count}`).join(', ')
      : 'No active trials';

    return `I cleared ${summary.roundsCleared} Endless round${summary.roundsCleared === 1 ? '' : 's'} in Guess The Limbus. Active Mounting Trials: ${trials}.`;
  }
}
