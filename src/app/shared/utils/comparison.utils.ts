import type { KeywordComparison, SkillComparison } from '../../core/models/limbus.models';

export function areAllKeywordsMatched(keywords: KeywordComparison[]): boolean {
  return keywords.every(keyword => keyword.match === 'YES');
}

export function areSomeKeywordsMatched(keywords: KeywordComparison[]): boolean {
  return keywords.some(keyword => keyword.match === 'YES');
}

export function isSkillFullyMatched(skill: SkillComparison): boolean {
  return skill.exists === 'YES' && skill.variations.every(variation =>
    variation.sinAffinity === 'YES' &&
    variation.coinCount === 'YES' &&
    variation.finalPower === 'YES'
  );
}

export function isSkillPartiallyMatched(skill: SkillComparison): boolean {
  return skill.exists === 'YES' && skill.variations.some(variation =>
    variation.sinAffinity === 'YES' ||
    variation.coinCount === 'YES' ||
    variation.finalPower === 'YES'
  );
}
