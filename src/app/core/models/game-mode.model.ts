export type GameModeKey = 'guess-id' | 'guess-ego' | 'endless';

export interface GameModeDefinition {
  key: GameModeKey;
  label: string;
  route: string;
  description: string;
  available: boolean;
}
