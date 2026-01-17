
import React, { useMemo } from 'react';
import { AppPhase } from '../types';
import { TRANSITION_DURATION_MS, DRAW_DURATION_SECONDS } from '../constants';

interface CountdownOverlayProps {
  phase: AppPhase;
  timeRemainingMs: number; // For pre-draw
  drawProgressSeconds: number; // For active draw
}

const formatTime = (ms: number) => {
  if (ms <= 0) return { d: '00', h: '00', m: '00', s: '00' };
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  return {
    d: days.toString().padStart(2, '0'),
    h: hours.toString().padStart(2, '0'),
    m: minutes.toString().padStart(2, '0'),
    s: seconds.toString().padStart(2, '0'),
  };
};

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  phase,
  timeRemainingMs,
  drawProgressSeconds,
}) => {
  const { d, h, m, s } = useMemo(() => formatTime(timeRemainingMs), [timeRemainingMs]);
  
  // Calculate remaining seconds for the active draw phase
  const drawSecondsRemaining = Math.max(0, DRAW_DURATION_SECONDS - Math.floor(drawProgressSeconds));
  const drawDisplay = drawSecondsRemaining.toString().padStart(2, '0');

  // Determine layout classes based on phase
  const isWaiting = phase === AppPhase.WAITING;
  const isCompleted = phase === AppPhase.COMPLETED;
  
  // Base container styles for the smooth transition
  // We use fixed positioning to move the entire block from center to top
  const containerClass = `fixed left-0 right-0 transition-all ease-in-out z-50 flex flex-col items-center justify-center pointer-events-none select-none`;
  
  // Dynamic styles
  const positionStyles = isWaiting
    ? "top-0 bottom-0 scale-100" // Full screen centered
    : "top-8 bottom-auto scale-90 origin-top"; // Top anchored, slightly smaller

  // We explicitly set the duration in style to match constants
  const transitionStyle = {
    transitionDuration: `${TRANSITION_DURATION_MS}ms`,
  };

  return (
    <div className={`${containerClass} ${positionStyles}`} style={transitionStyle}>
      {/* Label Text */}
      <div 
        className={`uppercase tracking-[0.2em] font-medium text-slate-400 mb-4 transition-all duration-700 ${
          isWaiting ? 'text-sm md:text-base opacity-100' : 'text-xs opacity-60'
        }`}
      >
        {isCompleted ? "Official Draw Completed" : isWaiting ? "Official Draw Will Begin In" : "Official Draw In Progress"}
      </div>

      {/* Timer Display */}
      <div className="relative">
        {/* Waiting Phase: Full Date Timer */}
        <div 
          className={`flex items-baseline space-x-4 transition-opacity duration-500 ${
            isWaiting ? 'opacity-100' : 'opacity-0 absolute top-0 left-1/2 -translate-x-1/2'
          }`}
        >
          <TimeSegment value={d} label="Days" />
          <span className="text-4xl text-slate-600 font-thin self-start mt-2">:</span>
          <TimeSegment value={h} label="Hrs" />
          <span className="text-4xl text-slate-600 font-thin self-start mt-2">:</span>
          <TimeSegment value={m} label="Min" />
          <span className="text-4xl text-slate-600 font-thin self-start mt-2">:</span>
          <TimeSegment value={s} label="Sec" highlight />
        </div>

        {/* Draw Phase: Seconds Only */}
        <div 
          className={`flex flex-col items-center transition-all duration-700 ${
             !isWaiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute top-0 left-1/2 -translate-x-1/2'
          }`}
        >
          <div className={`mono-font text-6xl md:text-7xl font-bold tabular-nums tracking-tighter ${
             drawSecondsRemaining <= 10 && !isCompleted ? 'text-amber-500' : 'text-white'
          }`}>
            {isCompleted ? "00" : drawDisplay}
          </div>
          {/* Hide label when completed to save vertical space */}
          <div className={`text-[10px] uppercase tracking-widest text-slate-500 mt-2 transition-opacity duration-300 ${isCompleted ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
            Seconds Remaining
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeSegment: React.FC<{ value: string; label: string; highlight?: boolean }> = ({ value, label, highlight }) => (
  <div className="flex flex-col items-center">
    <span className={`mono-font text-5xl md:text-7xl font-bold tabular-nums leading-none ${highlight ? 'text-white' : 'text-slate-300'}`}>
      {value}
    </span>
    <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-500 mt-2">{label}</span>
  </div>
);
