import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameTimerService {
  private readonly _serverTimezone = signal('Europe/Paris');
  private readonly _timeUntilNextGame = signal('');
  private intervalId: number | null = null;

  readonly serverTimezone = this._serverTimezone.asReadonly();
  readonly timeUntilNextGame = this._timeUntilNextGame.asReadonly();

  setServerTimezone(timezone: string): void {
    this._serverTimezone.set(timezone);
    this.updateTimeUntilNextGame();
  }

  startCountdown(): void {
    this.stopCountdown();
    this.updateTimeUntilNextGame();
    this.intervalId = window.setInterval(() => this.updateTimeUntilNextGame(), 1000);
  }

  stopCountdown(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getDateString(): string {
    const nowLocal = new Date();
    const timezoneString = nowLocal.toLocaleString('en-US', { timeZone: this._serverTimezone() });
    const today = new Date(timezoneString);
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  private updateTimeUntilNextGame(): void {
    const nowLocal = new Date();
    const timezoneString = nowLocal.toLocaleString('en-US', { timeZone: this._serverTimezone() });
    const nowInServerTimezone = new Date(timezoneString);

    const tomorrowInServerTimezone = new Date(
      nowInServerTimezone.getFullYear(),
      nowInServerTimezone.getMonth(),
      nowInServerTimezone.getDate() + 1
    );

    const diff = tomorrowInServerTimezone.getTime() - nowInServerTimezone.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this._timeUntilNextGame.set(`${hours}h ${minutes}m ${seconds}s`);
  }
}
