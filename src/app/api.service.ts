import { Injectable } from '@angular/core';
import type { DailyIdResponse, LimbusId, VerifyGuessResponse } from './core/models/limbus.models';

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
