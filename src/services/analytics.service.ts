import { Injectable } from "@angular/core";

export type PlayerType = 'new' | 'returning';
export type AnalyticsValue = string | number | boolean | null;
export type AnalyticsParams = Record<string, AnalyticsValue>;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
    

  readonly analyticsStorageKeys = {
    firstSeen: 'gtl_first_seen_at',
    sessions: 'gtl_sessions_count',
    daysPlayed: 'gtl_days_played',
    lastPlayedDate: 'gtl_last_played_date'
  } as const;
}