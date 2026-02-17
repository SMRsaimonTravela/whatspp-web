// Types for Travela restriction API

export interface TravelaRestriction {
  date: string; // e.g. "2026-02-28"
  id: number;
  count: number;
}

export interface TravelaRestrictionResponse {
  success: boolean;
  message: string;
  data: TravelaRestriction[];
}

