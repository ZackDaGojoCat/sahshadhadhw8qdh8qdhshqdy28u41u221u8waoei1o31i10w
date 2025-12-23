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

// --- 1. SNOWFLAKE MINIGAME (Ice) ---
// Click the snowflakes before they disappear!
const SnowflakeMinigame: React.FC<{ onComplete: (m: number) => void }> = ({ onComplete }) => {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3000); // 3 seconds
  const totalTargets = useRef(5);
  const spawnedCount = useRef(0);

  useEffect(() => {
    // Spawn targets
    const interval = setInterval(() => {
      if (spawnedCount.current >= totalTargets.current) {
        clearInterval(interval);
        return;
      }
      const id = Date.now();
      setTargets(prev => [...prev, {
        id,
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 80 + 10
      }]);
      spawnedCount.current += 1;
    }, 400);

    // Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          clearInterval(timer);
          clearInterval(interval);
          finish();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const handleClick = (id: number) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    setScore(prev => prev + 1);
  };

  const finish = () => {
    // Score 0-5. Multiplier range: 1.0 to 2.0
    // 0 hits = 1.0x
    // 5 hits = 2.0x
    const multiplier = 1 + (score / totalTargets.current);
    setTimeout(() => onComplete(multiplier), 500);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-crosshair">
       <div className="absolute top-4 text-white text-2xl font-bold font-mono">
          CLICK THE FLAKES! {score}/{totalTargets.current}
       </div>
       <div className="w-full h-full relative overflow-hidden">
          {targets.map(t => (
             <div 
                key={t.id}
                onClick={(e) => { e.stopPropagation(); handleClick(t.id); }}
                className="absolute text-cyan-200 animate-pulse hover:scale-125 transition-transform cursor-pointer drop-shadow-[0_0_10px_rgba(34,211,238,1)]"
                style={{ left: `${t.x}%`, top: `${t.y}%` }}
             >
                <Icons.Snowflake size={48} />
             </div>
          ))}
       </div>
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
