import React, { useEffect, useState, useRef } from 'react';
import { CountdownOverlay } from './components/CountdownOverlay';
import { TicketDisplay } from './components/TicketDisplay';
import { CONFIG, START_TIME_MS, TRANSITION_DURATION_MS, DRAW_DURATION_SECONDS } from './constants';
import { AppPhase } from './types';
import { audioController } from './utils/audio';

// Extend Tailwind for scanline animation
const tailwindConfigScript = `
  tailwind.config = {
    theme: {
      extend: {
        animation: {
          'scanline': 'scanline 1s linear infinite',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          scanline: {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(100%)' },
          }
        }
      }
    }
  }
`;

// Helper to format date for datetime-local input
const toLocalISOString = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
};

function App() {
  const [now, setNow] = useState(Date.now());
  
  // State for dynamic target time, defaulting to constant
  const [targetTime, setTargetTime] = useState<number>(START_TIME_MS);
  const [showConfig, setShowConfig] = useState(false);

  const [phase, setPhase] = useState<AppPhase>(AppPhase.WAITING);
  const prevPhaseRef = useRef<AppPhase>(AppPhase.WAITING);
  
  // Audio state tracking
  const lastSecondRef = useRef<number>(0);
  const lastDrawStepRef = useRef<number>(0);

  // Add the custom tailwind config to head
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = tailwindConfigScript;
    document.head.appendChild(script);
    
    // Attempt to init audio on load, though likely needs interaction
    audioController.init();

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 50); // High frequency update for smoother seconds tracking
    return () => clearInterval(interval);
  }, []);

  // Derived State Logic for continuity
  // T0 = targetTime (Countdown reaches 0, Transition Begins)
  // T1 = targetTime + TRANSITION_DURATION_MS (Transition Ends, Draw Starts)
  // T2 = T1 + DRAW_DURATION_SECONDS * 1000 (Draw Ends)

  const timeUntilStart = targetTime - now;
  const drawStartTime = targetTime + TRANSITION_DURATION_MS;
  const drawEndTime = drawStartTime + (DRAW_DURATION_SECONDS * 1000);
  
  // Calculate Draw Progress (0 to 30)
  const rawDrawProgress = Math.max(0, (now - drawStartTime) / 1000);
  const drawProgress = Math.min(DRAW_DURATION_SECONDS, rawDrawProgress);

  // Sound Logic Hook
  useEffect(() => {
    // 1. Countdown Ticks (Pre-draw)
    if (phase === AppPhase.WAITING) {
      const currentSecond = Math.floor(timeUntilStart / 1000);
      if (currentSecond !== lastSecondRef.current && currentSecond <= 10 && currentSecond >= 0) {
        audioController.playTick();
        lastSecondRef.current = currentSecond;
      }
    }
    
    // 2. Countdown Ticks (During Draw)
    if (phase === AppPhase.DRAWING) {
        const remaining = Math.ceil(DRAW_DURATION_SECONDS - drawProgress);
        if (remaining !== lastSecondRef.current && remaining <= 10 && remaining > 0) {
           audioController.playTick(); // Ticks for final 10 seconds of draw
           lastSecondRef.current = remaining;
        }
    }

    // 3. Phase Transitions
    if (phase !== prevPhaseRef.current) {
        if (phase === AppPhase.TRANSITION) {
            audioController.playTransition();
        } else if (phase === AppPhase.COMPLETED) {
            audioController.playReveal();
        }
        prevPhaseRef.current = phase;
    }

    // 4. Draw Locks (10s, 20s, 30s)
    // We check if we crossed a 10s threshold
    const currentStep = Math.floor(drawProgress / 10); // 0, 1, 2, 3
    if (currentStep > lastDrawStepRef.current && phase === AppPhase.DRAWING) {
        audioController.playLock(currentStep);
        lastDrawStepRef.current = currentStep;
    }
    // Also trigger lock when entering completion if not already caught (usually handled by phase change logic, but specific lock sound for final digit)
    if (phase === AppPhase.COMPLETED && lastDrawStepRef.current < 3) {
        audioController.playLock(3);
        lastDrawStepRef.current = 3;
    }

  }, [now, phase, timeUntilStart, drawProgress]);

  useEffect(() => {
    let nextPhase = AppPhase.WAITING;
    if (now < targetTime) {
      nextPhase = AppPhase.WAITING;
    } else if (now >= targetTime && now < drawStartTime) {
      nextPhase = AppPhase.TRANSITION;
    } else if (now >= drawStartTime && now < drawEndTime) {
      nextPhase = AppPhase.DRAWING;
    } else {
      nextPhase = AppPhase.COMPLETED;
    }

    if (nextPhase !== phase) {
      setPhase(nextPhase);
    }
  }, [now, targetTime, drawStartTime, drawEndTime, phase]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newTime = new Date(e.target.value).getTime();
      if (!isNaN(newTime)) {
        setTargetTime(newTime);
      }
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center relative overflow-hidden"
      onClick={() => audioController.init()} // Simple way to ensure audio unlocks on first interaction
    >
      
      {/* Background Gradients (Subtle) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[100px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/3 bg-gradient-to-t from-black to-transparent opacity-80"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Main Countdown Layer */}
      <CountdownOverlay 
        phase={phase} 
        timeRemainingMs={timeUntilStart}
        drawProgressSeconds={drawProgress}
      />

      {/* Draw Area */}
      <div className={`transition-all duration-1000 ease-out transform mt-24 md:mt-32 ${
        phase === AppPhase.WAITING || phase === AppPhase.TRANSITION 
          ? 'opacity-0 translate-y-12 scale-95 blur-sm' 
          : 'opacity-100 translate-y-0 scale-100 blur-0'
      }`}>
        <TicketDisplay 
          winnerSuffix={CONFIG.winnerId}
          phase={phase}
          drawProgress={drawProgress}
        />
      </div>

      {/* Configuration Control */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end">
        {showConfig && (
          <div className="mb-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-lg shadow-2xl w-72 animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-semibold">
              Set Draw Start Time
            </label>
            <input 
              type="datetime-local" 
              className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none tabular-nums font-mono"
              onChange={handleDateChange}
              value={toLocalISOString(new Date(targetTime))}
            />
            <div className="mt-2 text-[10px] text-slate-500">
              Current system time: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowConfig(!showConfig); }}
          className={`p-2 rounded-full transition-all duration-300 ${showConfig ? 'bg-slate-800 text-emerald-400 rotate-180' : 'bg-transparent text-slate-700 hover:text-slate-400'}`}
          title="Configure Draw Timer"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </div>

      {/* Footer info (only visible post-draw or pre-draw small) */}
      <div className="absolute bottom-8 text-center px-4 pointer-events-none">
        <p className="text-[10px] text-slate-700 tracking-widest uppercase">
          System ID: MNTC-CORE-11 • Secure RNG V4.2 • Verification Active
        </p>
      </div>

    </div>
  );
}

export default App;