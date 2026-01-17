import { DrawConfig } from './types';

// CONFIGURATION
// Fixed start time: January 18, 2025 at 7:00 PM (19:00:00) Local Time
export const START_TIME_MS = new Date("2026-01-18T19:00:00").getTime();

export const TRANSITION_DURATION_MS = 1000; // 1 second transition
export const DRAW_DURATION_SECONDS = 30; // 30 seconds draw

export const CONFIG: DrawConfig = {
  winnerId: "120", // MNTC120]
  totalParticipants: 131,
  drawDurationSeconds: DRAW_DURATION_SECONDS,
};

export const PREFIX = "MNTC";
export const BATCH = "11";