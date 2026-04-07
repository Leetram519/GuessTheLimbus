export interface SkillVariation {
  variationNumber: number;
  sinAffinity: string;
  coinCount: number;
  finalPower: number;
}

export interface Skill {
  skillNumber: number;
  variations: SkillVariation[];
}

export interface PassiveCount {
  combat: number;
  support: number;
}

export interface LimbusId {
  id: number;
  name: string;
  imagePath: string;
  sinner: string;
  rarity: number;
  preciseKeywords: string[];
  statusKeywords: string[];
  season: string;
  passiveCount: PassiveCount;
  skills: Skill[];
}

export type YesNoMatch = 'YES' | 'NO';
export type DirectionalMatch = 'LESS' | 'YES' | 'MORE';

export interface KeywordComparison {
  keyword: string;
  match: YesNoMatch;
}

export interface SkillVariationComparison {
  variationNumber: number;
  sinAffinity: YesNoMatch;
  coinCount: YesNoMatch;
  finalPower: DirectionalMatch;
}

export interface SkillComparison {
  skillNumber: number;
  exists: YesNoMatch;
  variations: SkillVariationComparison[];
}

export interface GuessComparison {
  sinner: YesNoMatch;
  rarity: YesNoMatch;
  preciseKeywords: KeywordComparison[];
  statusKeywords: KeywordComparison[];
  season: YesNoMatch;
  passiveCount: DirectionalMatch;
  skills: SkillComparison[];
}

export interface DailyIdResponse {
  id: number;
  date: string;
  timezone: string;
  msUntilReset: number;
}

export interface VerifyGuessResponse {
  correct: boolean;
  guessedId: LimbusId;
  comparison: GuessComparison;
}

export interface GuessResult {
  id: LimbusId;
  comparison: GuessComparison;
  isCorrect: boolean;
}

export interface PersistedGameState {
  date: string;
  guesses: Array<GuessResult | null>;
  currentGuess: number;
  gameOver: boolean;
  hasWon: boolean;
  resultMessage: string;
  usedIds: number[];
}
