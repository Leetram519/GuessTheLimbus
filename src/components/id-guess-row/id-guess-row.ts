import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GuessComparison, LimbusId, SkillVariation } from '../../services/api.service';

type DisplayYesNo = 'YES' | 'NO' | 'HIDDEN';
type DisplayDirectional = 'LESS' | 'YES' | 'MORE' | 'HIDDEN';

interface DisplayComparison {
  sinner: DisplayYesNo;
  rarity: DisplayYesNo;
  preciseKeywords: { keyword: string; match: DisplayYesNo }[];
  statusKeywords: { keyword: string; match: DisplayYesNo }[];
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
  statusKeywordsHidden?: boolean;
}

interface GuessResult {
  id: LimbusId;
  comparison: GuessComparison;
  isCorrect: boolean;
  displayComparison?: DisplayComparison;
}

@Component({
  selector: 'app-id-guess-row',
  standalone: true,
  templateUrl: './id-guess-row.html',
  styleUrls: ['./id-guess-row.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdGuessRowComponent {
  @Input() guess: GuessResult | null = null;
  @Input() index = 0;
  @Input() isActive = false;

  tooltipText = '';
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;

  showTooltip(event: MouseEvent, text: string) {
    this.tooltipText = text;
    this.tooltipVisible = true;
    this.updateTooltipPosition(event);
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

  updateTooltipPosition(event: MouseEvent) {
    this.tooltipX = event.clientX + 15;
    this.tooltipY = event.clientY + 15;
  }

  areAllKeywordsMatched(keywords: { keyword: string; match: string }[]): boolean {
    return keywords.every(kw => kw.match === 'YES');
  }

  areSomeKeywordsMatched(keywords: { keyword: string; match: string }[]): boolean {
    return keywords.some(kw => kw.match === 'YES');
  }

  isSkillFullyMatched(skill: { exists: 'YES' | 'NO'; variations: any[] }): boolean {
    return skill.exists === 'YES' && skill.variations.every(v => 
      v.sinAffinity === 'YES' && v.coinCount === 'YES' && v.finalPower === 'YES'
    );
  }

  isSkillPartiallyMatched(skill: { exists: 'YES' | 'NO'; variations: any[] }): boolean {
    return skill.exists === 'YES' && skill.variations.some(v => 
      v.sinAffinity === 'YES' || v.coinCount === 'YES' || v.finalPower === 'YES'
    );
  }

  getSkillVariation(id: LimbusId, skillNumber: number, variationNumber: number): SkillVariation | null {
    const skill = id.skills.find(s => s.skillNumber === skillNumber);
    if (!skill) {
      return null;
    }

    return skill.variations.find(v => v.variationNumber === variationNumber) ?? null;
  }

  getComparison(): any {
    return this.guess?.displayComparison ?? this.guess?.comparison ?? null;
  }
}
