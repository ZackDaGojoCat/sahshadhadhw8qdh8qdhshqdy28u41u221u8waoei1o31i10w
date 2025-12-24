
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { MinigameType } from '../types';

interface MinigameControllerProps {
  type: MinigameType;
  onComplete: (multiplier: number) => void;
}

export const MinigameController: React.FC<MinigameControllerProps> = ({ type, onComplete }) => {
  if (type === 'snowflake') return <SnowflakeMinigame onComplete={onComplete} />;
  if (type === 'mash') return <MashMinigame onComplete={onComplete} />;
  if (type === 'timing') return <TimingMinigame onComplete={onComplete} />;
  return null;
};

// --- 1. SNOWFLAKE BARRAGE (Ice) ---
// FAST PACED: Click the target to throw snowflakes!
const SnowflakeMinigame: React.FC<{ onComplete: (m: number) => void }> = ({ onComplete }) => {
  const [snowballs, setSnowballs] = useState<{ id: number; x: number; y: number; tx: number; ty: number }[]>([]);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3000); // 3 seconds
  
  // Game Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          clearInterval(timer);
          finish();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Spawn a snowball at mouse position moving towards center (50, 50)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Add snowball visual
    const id = Date.now();
    setSnowballs(prev => [...prev, { id, x, y, tx: 50, ty: 50 }]);
    
    // Count hit
    setHits(h => h + 1);

    // Remove after animation
    setTimeout(() => {
      setSnowballs(prev => prev.filter(s => s.id !== id));
    }, 400);
  };

  const finish = () => {
    // Score based on rapid clicks. 15 clicks = max 2.0x multiplier
    const maxClicks = 15;
    // Multiplier caps at 2.0x, starts at 1.0x
    const multiplier = 1 + Math.min(1, hits / maxClicks);
    setTimeout(() => onComplete(multiplier), 500);
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-crosshair overflow-hidden"
      onClick={handleClick}
    >
       <div className="absolute top-4 text-white text-2xl font-bold font-mono z-20 pointer-events-none drop-shadow-md">
          RAPID FIRE! CLICK TO THROW!
       </div>
       
       {/* Target Enemy in Center */}
       <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
           <div className="w-32 h-32 rounded-full border-4 border-red-500/50 bg-red-900/30 animate-pulse flex items-center justify-center">
               <Icons.Target size={64} className="text-red-400" />
           </div>
       </div>

       {/* Hits Counter */}
       <div className="absolute bottom-10 text-cyan-300 text-6xl font-black opacity-50 pointer-events-none">
           {hits}
       </div>

       {/* Flying Snowballs */}
       {snowballs.map(s => (
          <div 
            key={s.id}
            className="absolute text-white pointer-events-none"
            style={{ 
                left: `${s.x}%`, 
                top: `${s.y}%`,
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                transform: `translate(-50%, -50%)`,
                // We use a small timeout or effect to trigger the move, but here we can just animate in CSS with keyframes if we wanted complex curves.
                // For simplicity in React loop, let's just render start position and let CSS 'left/top' transition to center if we updated state.
                // But updating state for every frame is slow.
                // Instead, use animation.
                animation: 'flyToCenter 0.4s forwards'
            }}
          >
             <Icons.Snowflake size={32} />
          </div>
       ))}
       
       <style>{`
         @keyframes flyToCenter {
           to { left: 50%; top: 50%; opacity: 0; transform: scale(0.5); }
         }
       `}</style>
    </div>
  );
};

// --- 2. MASH MINIGAME (Gravity/Physical) ---
// Press SPACE as fast as possible to fill bar
const MashMinigame: React.FC<{ onComplete: (m: number) => void }> = ({ onComplete }) => {
  const [power, setPower] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2000);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.code === 'Space') {
          setPower(p => Math.min(100, p + 10));
       }
    };
    window.addEventListener('keydown', handleKeyDown);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
         if (prev <= 10) {
            clearInterval(timer);
            const multiplier = 1 + (power / 100);
            onComplete(multiplier);
            return 0;
         }
         return prev - 10;
      });
      // Decay power
      setPower(p => Math.max(0, p - 0.5));
    }, 10);

    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       clearInterval(timer);
    }
  }, [power]);

  return (
     <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
        <h2 className="text-4xl font-bold text-white mb-8 animate-pulse">MASH SPACEBAR!</h2>
        <div className="w-64 h-8 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-500">
           <div className="h-full bg-purple-500 transition-all duration-75" style={{ width: `${power}%` }}></div>
        </div>
        <div className="mt-4 text-white font-mono">{(timeLeft/1000).toFixed(1)}s</div>
        <div className="mt-8">
           <button 
              className="md:hidden px-8 py-8 bg-purple-600 rounded-full font-bold text-white active:bg-purple-400 active:scale-95 transition-all shadow-lg"
              onClick={() => setPower(p => Math.min(100, p + 15))}
           >
              TAP!
           </button>
        </div>
     </div>
  );
};

// --- 3. TIMING MINIGAME (Sound) ---
// Click when the circle overlaps
const TimingMinigame: React.FC<{ onComplete: (m: number) => void }> = ({ onComplete }) => {
   const [size, setSize] = useState(100);
   const [expanding, setExpanding] = useState(false);
   const [stopped, setStopped] = useState(false);
   
   useEffect(() => {
      const interval = setInterval(() => {
         if (stopped) return;
         setSize(prev => {
            if (prev <= 0) {
                setExpanding(true);
                return 0;
            }
            if (prev >= 100) {
                setExpanding(false);
                return 100;
            }
            return expanding ? prev + 2 : prev - 2;
         });
      }, 10);
      return () => clearInterval(interval);
   }, [expanding, stopped]);

   const stop = () => {
      if (stopped) return;
      setStopped(true);
      // Perfect is 50 (middle)
      const diff = Math.abs(50 - size);
      let multiplier = 1.0;
      if (diff < 5) multiplier = 2.0; // Perfect
      else if (diff < 15) multiplier = 1.5; // Good
      else multiplier = 1.1; // Okay
      
      setTimeout(() => onComplete(multiplier), 800);
   };

   return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm" onClick={stop}>
         <h2 className="text-2xl font-bold text-teal-200 mb-8">CLICK WHEN MATCHED!</h2>
         
         <div className="relative w-64 h-64 flex items-center justify-center cursor-pointer">
            {/* Target Ring */}
            <div className="absolute w-32 h-32 rounded-full border-4 border-white/50"></div>
            
            {/* Moving Ring */}
            <div 
               className="absolute rounded-full border-4 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)]"
               style={{ 
                  width: `${(size / 100) * 256}px`, 
                  height: `${(size / 100) * 256}px` 
               }}
            ></div>
         </div>
         {stopped && (
            <div className="text-4xl font-bold text-white mt-4 animate-bounce">
               {Math.abs(50 - size) < 5 ? "PERFECT!" : Math.abs(50 - size) < 15 ? "GOOD!" : "MISS..."}
            </div>
         )}
      </div>
   );
};
