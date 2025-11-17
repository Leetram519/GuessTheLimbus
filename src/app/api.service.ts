import { Injectable } from '@angular/core';

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

export interface GuessComparison {
  sinner: "YES" | "NO";
  rarity: "YES" | "NO";
  preciseKeywords: { keyword: string; match: "YES" | "NO" }[];
  statusKeywords: { keyword: string; match: "YES" | "NO" }[];
  season: "YES" | "NO";
  passiveCount: "LESS" | "YES" | "MORE";
  skills: {
    skillNumber: number;
    exists: "YES" | "NO";
    variations: {
      variationNumber: number;
      sinAffinity: "YES" | "NO";
      coinCount: "YES" | "NO";
      finalPower: "LESS" | "YES" | "MORE";
    }[];
  }[];
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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://guessthelimbus.com/api';

  async getAllIds(): Promise<LimbusId[]> {
    try {
      const response = await fetch(`${this.apiUrl}/ids`);
      if (!response.ok) {
        throw new Error('Failed to fetch IDs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching IDs:', error);
      return [];
    }
  }

  async getDailyId(): Promise<DailyIdResponse | null> {
    try {
      const response = await fetch(`${this.apiUrl}/daily-id`);
      if (!response.ok) {
        throw new Error('Failed to fetch daily ID');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching daily ID:', error);
      return null;
    }
  }

  async verifyGuess(guessId: number, targetId: number): Promise<VerifyGuessResponse | null> {
    try {
      const response = await fetch(`${this.apiUrl}/verify-guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guessId, targetId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify guess');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error verifying guess:', error);
      return null;
    }
  }
}
