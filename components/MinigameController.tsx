
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
// FASTER, PUNCHIER VERSION
const SnowflakeMinigame: React.FC<{ onComplete: (m: number) => void }> = ({ onComplete }) => {
  const [snowballs, setSnowballs] = useState<{ id: number; x: number; y: number }[]>([]);
  const [hits, setHits] = useState(0);
  const [isHit, setIsHit] = useState(false); // Visual recoil for target
  const [timeLeft, setTimeLeft] = useState(2500); // Reduced time to 2.5s for urgency
  
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const id = Date.now();
    setSnowballs(prev => [...prev, { id, x, y }]);
    
    setHits(h => h + 1);
    
    // Trigger Recoil
    setIsHit(true);
    setTimeout(() => setIsHit(false), 50);

    // Remove snowball faster
    setTimeout(() => {
      setSnowballs(prev => prev.filter(s => s.id !== id));
    }, 200); // 0.2s duration matches CSS animation
  };

  const finish = () => {
    // 12 clicks in 2.5s = max 2.0x
    const maxClicks = 12;
    const multiplier = 1 + Math.min(1, hits / maxClicks);
    setTimeout(() => onComplete(multiplier), 300);
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-cyan-900/40 backdrop-blur-[2px] cursor-crosshair overflow-hidden select-none"
      onClick={handleClick}
    >
       <div className="absolute top-4 text-white text-3xl font-black font-mono z-20 pointer-events-none drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] animate-pulse">
          TAP FAST!
       </div>
       
       {/* Target Enemy in Center with Recoil */}
       <div 
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none transition-transform duration-75 ${isHit ? 'scale-90 brightness-150' : 'scale-100'}`}
       >
           <div className="w-40 h-40 rounded-full border-4 border-red-500 bg-slate-900 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.4)]">
               <Icons.Target size={80} className="text-red-500" />
           </div>
       </div>

       {/* Hits Counter */}
       <div className="absolute bottom-10 text-cyan-200 text-8xl font-black opacity-20 pointer-events-none">
           {hits}
       </div>

       {/* Flying Snowballs - SUPER FAST */}
       {snowballs.map(s => (
          <div 
            key={s.id}
            className="absolute text-white pointer-events-none"
            style={{ 
                left: `${s.x}%`, 
                top: `${s.y}%`,
                transform: `translate(-50%, -50%)`,
                animation: 'flyToCenterFast 0.2s cubic-bezier(0.1, 0.7, 1.0, 0.1) forwards'
            }}
          >
             <Icons.Snowflake size={48} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]" />
          </div>
       ))}
       
       <style>{`
         @keyframes flyToCenterFast {
           0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
           100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(2); }
         }
       `}</style>
    </div>
  );
};

// --- 2. MASH MINIGAME (Gravity/Physical) ---
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
        <div className="w-64 h-8 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-500 shadow-[0_0_20px_purple]">
           <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-75" style={{ width: `${power}%` }}></div>
        </div>
        <div className="mt-4 text-white font-mono font-bold text-2xl">{(timeLeft/1000).toFixed(1)}s</div>
        <div className="mt-8 md:hidden">
           <button 
              className="w-32 h-32 bg-purple-600 rounded-full font-bold text-white active:bg-purple-400 active:scale-95 transition-all shadow-lg flex items-center justify-center text-xl"
              onClick={() => setPower(p => Math.min(100, p + 15))}
           >
              TAP!
           </button>
        </div>
     </div>
  );
};

// --- 3. TIMING MINIGAME (Sound) ---
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
      const diff = Math.abs(50 - size);
      let multiplier = 1.0;
      if (diff < 5) multiplier = 2.0; 
      else if (diff < 15) multiplier = 1.5; 
      else multiplier = 1.1; 
      
      setTimeout(() => onComplete(multiplier), 800);
   };

   return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer" onClick={stop}>
         <h2 className="text-3xl font-bold text-teal-200 mb-8 drop-shadow-[0_0_10px_teal]">CLICK TO MATCH!</h2>
         
         <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Target Ring */}
            <div className="absolute w-32 h-32 rounded-full border-4 border-white/80 shadow-[0_0_20px_white]"></div>
            
            {/* Moving Ring */}
            <div 
               className="absolute rounded-full border-4 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)]"
               style={{ 
                  width: `${(size / 100) * 256}px`, 
                  height: `${(size / 100) * 256}px`,
                  opacity: stopped ? 0 : 1
               }}
            ></div>
            
            {stopped && (
                <div className={`absolute text-5xl font-black animate-bounce ${Math.abs(50 - size) < 5 ? 'text-yellow-400' : 'text-white'}`}>
                   {Math.abs(50 - size) < 5 ? "PERFECT!" : Math.abs(50 - size) < 15 ? "GOOD!" : "MISS..."}
                </div>
            )}
         </div>
      </div>
   );
};
