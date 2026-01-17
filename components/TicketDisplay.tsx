
import React, { useEffect, useState, useRef } from 'react';
import { PREFIX, BATCH } from '../constants';
import { AppPhase } from '../types';
import { audioController } from '../utils/audio';

interface TicketDisplayProps {
  winnerSuffix: string; // e.g. "087"
  phase: AppPhase;
  drawProgress: number; // 0 to 30
}

export const TicketDisplay: React.FC<TicketDisplayProps> = ({ winnerSuffix, phase, drawProgress }) => {
  const [shuffledValues, setShuffledValues] = useState(['0', '0', '0']);
  const requestRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  // Indicies: D1=0, D2=1, D3=2
  const winnerDigits = winnerSuffix.split(''); // ['0', '8', '7']
  const fullWinnerId = `${PREFIX}${BATCH}${winnerSuffix}`;

  useEffect(() => {
    const animate = () => {
      // Only animate during drawing phase
      if (phase !== AppPhase.DRAWING) {
        if (phase === AppPhase.COMPLETED) {
             setShuffledValues(winnerDigits);
        }
        return;
      }
      
      // Update logic: limit frame rate of random numbers for legibility (every 3 frames ~ 20fps)
      frameRef.current++;
      if (frameRef.current % 3 !== 0) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      setShuffledValues(prev => {
        const next = [...prev];
        let changed = false;
        
        // Randomize based on phase
        // D3 (Index 2): Shuffles 0-10s
        if (drawProgress < 10) {
            next[2] = Math.floor(Math.random() * 10).toString();
            changed = true;
        } else {
            next[2] = winnerDigits[2];
        }

        // D2 (Index 1): Shuffles 10-20s
        if (drawProgress >= 10 && drawProgress < 20) {
             next[1] = Math.floor(Math.random() * 10).toString();
             changed = true;
        } else if (drawProgress >= 20) {
             next[1] = winnerDigits[1];
        }

        // D1 (Index 0): Shuffles 20-30s
        if (drawProgress >= 20 && drawProgress < 30) {
             next[0] = Math.floor(Math.random() * 10).toString();
             changed = true;
        } else if (drawProgress >= 30) {
             next[0] = winnerDigits[0];
        }
        
        if (changed) {
            audioController.playShuffle();
        }

        return next;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [phase, drawProgress]);

  // Helper to determine status of each digit
  const getStatus = (index: number) => {
    if (phase === AppPhase.WAITING || phase === AppPhase.TRANSITION) return 'DIMMED';
    if (phase === AppPhase.COMPLETED) return 'LOCKED';

    // Index 2 (D3)
    if (index === 2) {
      return drawProgress < 10 ? 'SHUFFLING' : 'LOCKED';
    }
    // Index 1 (D2)
    if (index === 1) {
      if (drawProgress < 10) return 'DIMMED';
      return drawProgress < 20 ? 'SHUFFLING' : 'LOCKED';
    }
    // Index 0 (D1)
    if (index === 0) {
      if (drawProgress < 20) return 'DIMMED';
      return drawProgress < 30 ? 'SHUFFLING' : 'LOCKED';
    }
    return 'LOCKED';
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 relative z-10">
      {/* Static Part */}
      <div className="flex items-center space-x-2 md:space-x-4 mb-4 md:mb-8 opacity-80">
        <span className="text-2xl md:text-4xl font-bold text-slate-500 tracking-widest">{PREFIX}</span>
        <span className="text-2xl md:text-4xl font-bold text-slate-500 tracking-widest">{BATCH}</span>
      </div>

      {/* Dynamic Digits Container */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Separator Line */}
        <div className="w-0.5 h-16 md:h-32 bg-slate-800 mx-4 md:mx-8"></div>

        {shuffledValues.map((val, idx) => {
           const status = getStatus(idx);
           const isLocked = status === 'LOCKED';
           const isShuffling = status === 'SHUFFLING';
           const isDimmed = status === 'DIMMED';

           return (
             <DigitBox 
               key={idx} 
               value={val} 
               isLocked={isLocked} 
               isShuffling={isShuffling}
               isDimmed={isDimmed}
             />
           );
        })}
      </div>
      
      {/* Full Winner ID Reveal */}
      <div className={`overflow-hidden transition-all duration-1000 ease-out delay-500 flex flex-col items-center ${
        phase === AppPhase.COMPLETED 
          ? 'max-h-40 opacity-100 mt-10' 
          : 'max-h-0 opacity-0 mt-0'
      }`}>
        <div className="text-4xl md:text-6xl font-bold text-white tracking-[0.15em] mono-font drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]">
            {fullWinnerId}
        </div>
      </div>
    </div>
  );
};

const DigitBox: React.FC<{ value: string; isLocked: boolean; isShuffling: boolean; isDimmed: boolean }> = ({ 
  value, isLocked, isShuffling, isDimmed 
}) => {
  return (
    <div className={`
      relative w-20 h-28 md:w-32 md:h-48 
      rounded-lg border-2 
      flex items-center justify-center
      transition-all duration-300
      overflow-hidden
      ${isLocked 
        ? 'bg-slate-900 border-amber-500/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)] text-amber-500' 
        : 'bg-slate-950 border-slate-800 text-slate-700'
      }
      ${isDimmed ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}
    `}>
      {/* Scanline effect for shuffling */}
      {isShuffling && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-scanline pointer-events-none"></div>
      )}
      
      <span className={`
        mono-font text-6xl md:text-9xl font-bold tabular-nums
        transform transition-transform duration-75
        ${isShuffling ? 'blur-[2px] opacity-80 translate-y-[2px] scale-105' : 'blur-0 opacity-100 translate-y-0 scale-100'}
      `}>
        {value}
      </span>

      {/* Locked Indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]"></div>
      )}
    </div>
  );
};
