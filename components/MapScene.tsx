import React, { useEffect, useState, useRef } from 'react';
import { MapCell, Position, Player } from '../types';
import * as Icons from 'lucide-react';
import { ELEMENT_COLORS } from '../constants';

interface MapSceneProps {
  cells: MapCell[];
  playerPosition: Position;
  player: Player;
  onMove: (x: number, y: number) => void;
}

// ✅ STRICT PATTERN: Fallback Component
const FallbackIcon: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
  <div className={`w-4 h-4 rounded-full bg-gray-500 ${className ?? ''}`} style={{ width: size, height: size }} />
);

// ✅ STRICT PATTERN: getIcon must return React.ElementType
const getIcon = (name: string): React.ElementType => {
  const icons = Icons as unknown as Record<string, React.ElementType | undefined>;
  return icons[name] ?? Icons.CircleHelp ?? Icons.HelpCircle ?? Icons.AlertCircle ?? FallbackIcon;
};

export const MapScene: React.FC<MapSceneProps> = ({ cells, playerPosition, player, onMove }) => {
  const MAP_SIZE = 8;
  const [isMoving, setIsMoving] = useState(false);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.code) > -1) {
          e.preventDefault();
      }

      if (e.repeat && isMoving) return; 

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

      if (dx !== 0 || dy !== 0) {
          setIsMoving(true);
          if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
          moveTimeoutRef.current = setTimeout(() => setIsMoving(false), 150);
          onMove(dx, dy);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMove, isMoving]);

  // Use Strict Pattern for Player Icon
  const PlayerIcon = getIcon(player.iconName || 'User');
  
  // Specific icons for map elements
  const SkullIcon = getIcon('Skull');
  const GiftIcon = getIcon('Gift');
  const FlagIcon = getIcon('Flag');
  const UserIcon = getIcon('User'); // Fallback D-Pad

  // Helper for dynamic coloring based on player icon name (mimicking old logic but safer)
  const getPlayerColorClass = () => {
     if (player.iconName === 'Shield') return "text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]";
     if (player.iconName === 'Sparkles') return "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]";
     if (player.iconName === 'Feather') return "text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]";
     return "text-white";
  };

  return (
    <div className="w-full flex flex-col items-center">
        
      {/* 3D Map Container */}
      <div 
        className="relative mb-8"
        style={{
            width: `${MAP_SIZE * 100}%`,
            maxWidth: '320px',
            height: '320px',
            perspective: '800px',
        }}
      >
        <div 
            className="w-full h-full relative transition-transform duration-500 ease-out"
            style={{
                transform: 'rotateX(40deg) rotateZ(0deg)',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Grid Floor */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1">
                {cells.map((cell) => {
                    const isRevealed = cell.isRevealed;
                    return (
                        <div 
                            key={`${cell.x}-${cell.y}`}
                            className={`
                                relative rounded-sm flex items-center justify-center
                                transition-all duration-300
                                ${cell.type === 'wall' ? 'bg-slate-800 translate-z-4 border-t border-slate-700' : 'bg-slate-700/50'}
                            `}
                            style={{
                                opacity: isRevealed ? 1 : 0.1,
                                transform: cell.type === 'wall' ? 'translateZ(10px)' : 'translateZ(0px)',
                                boxShadow: cell.type === 'wall' ? '0 5px 15px rgba(0,0,0,0.5)' : 'none'
                            }}
                        >
                             {isRevealed && (
                                <>
                                    {cell.type === 'enemy' && <SkullIcon size={20} className="text-red-500 animate-pulse" />}
                                    {cell.type === 'boss' && <SkullIcon size={28} className="text-purple-500 animate-bounce" />}
                                    {cell.type === 'treasure' && <GiftIcon size={20} className="text-yellow-400 animate-float" />}
                                    {cell.type === 'start' && <FlagIcon size={16} className="text-green-500 opacity-50" />}
                                </>
                            )}
                            
                            {cell.type !== 'wall' && isRevealed && (
                                <div className="absolute inset-0 border border-white/5 rounded-sm"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Smooth Player Character Layer */}
            <div 
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ transform: 'translateZ(10px)' }}
            >
                <div 
                    className={`absolute w-[12.5%] h-[12.5%] flex items-center justify-center transition-all duration-150 ease-linear z-20`}
                    style={{
                        transform: `translate(${playerPosition.x * 100}%, ${playerPosition.y * 100}%)`
                    }}
                >
                    {/* Character Icon Avatar */}
                    <div 
                        className={`
                            relative -mt-6 
                            transition-transform duration-100 
                            ${isMoving ? 'scale-110' : 'animate-idle'}
                        `}
                    >
                         <PlayerIcon size={28} className={getPlayerColorClass()} />
                         {/* Simple shadow */}
                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/50 blur-[2px] rounded-full"></div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* D-PAD Controls */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
         <div></div>
         <button onClick={() => { onMove(0, -1); setIsMoving(true); }} className="p-4 bg-slate-800 rounded-lg active:bg-blue-600 transition-colors shadow-lg active:scale-95"><UserIcon size={24} className="rotate-0"/></button>
         <div></div>
         <button onClick={() => { onMove(-1, 0); setIsMoving(true); }} className="p-4 bg-slate-800 rounded-lg active:bg-blue-600 transition-colors shadow-lg active:scale-95"><UserIcon size={24} className="-rotate-90"/></button>
         <div className="flex items-center justify-center text-slate-500 text-xs font-mono font-bold tracking-widest">MOVE</div>
         <button onClick={() => { onMove(1, 0); setIsMoving(true); }} className="p-4 bg-slate-800 rounded-lg active:bg-blue-600 transition-colors shadow-lg active:scale-95"><UserIcon size={24} className="rotate-90"/></button>
         <div></div>
         <button onClick={() => { onMove(0, 1); setIsMoving(true); }} className="p-4 bg-slate-800 rounded-lg active:bg-blue-600 transition-colors shadow-lg active:scale-95"><UserIcon size={24} className="rotate-180"/></button>
         <div></div>
      </div>
      
      <div className="hidden md:block text-slate-400 text-sm font-mono mt-4 opacity-75">
        Use <span className="text-white font-bold border border-slate-600 px-1 rounded">Arrows</span> or <span className="text-white font-bold border border-slate-600 px-1 rounded">WASD</span> to Explore
      </div>
    </div>
  );
};