import { DrawConfig } from './types';

// CONFIGURATION
// In a real scenario, START_TIME would be a fixed ISO string from a server or env var.
// For this demo, we set it to 8 seconds in the future from load so the user can experience the transition.
// If you refresh *after* this time, the app correctly respects the timeline (no replay).
const NOW = Date.now();
const DEMO_DELAY_MS = 8000; 

// We use a fixed timestamp for the session if not persisted, 
// but here we just want to demonstrate the mechanism. 
// A real app might use: new Date("2023-12-31T23:59:59Z").getTime();
export const START_TIME_MS = NOW + DEMO_DELAY_MS;

export const TRANSITION_DURATION_MS = 1000; // 1 second transition
export const DRAW_DURATION_SECONDS = 30; // 30 seconds draw

export const CONFIG: DrawConfig = {
  winnerId: "120", // MNTC120]
  totalParticipants: 131,
  drawDurationSeconds: DRAW_DURATION_SECONDS,
};

export const PREFIX = "MNTC";
export const BATCH = "11";
