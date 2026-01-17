export enum AppPhase {
  WAITING = 'WAITING',
  TRANSITION = 'TRANSITION',
  DRAWING = 'DRAWING',
  COMPLETED = 'COMPLETED'
}

export interface DrawConfig {
  winnerId: string; // Format: "087" (The suffix part)
  totalParticipants: number;
  drawDurationSeconds: number;
}
