import React from 'react';
import { Ability } from '../types';
import { ELEMENT_COLORS, ELEMENT_BG_COLORS } from '../constants';
import * as Icons from 'lucide-react';

interface AbilityCardProps {
  ability: Ability;
  onClick?: () => void;
  disabled?: boolean;
  isUnlocked?: boolean;
  cooldownRemaining?: number;
}

// ✅ STRICT PATTERN: Fallback Component
const FallbackIcon: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
  <div className={`w-4 h-4 rounded-full bg-gray-500 ${className ?? ''}`} style={{ width: size, height: size }} />
);

// ✅ STRICT PATTERN: getIcon must return React.ElementType
const getIcon = (name: string): React.ElementType => {
  // Cast to any to avoid build errors if specific icon names change in library versions
  const icons = Icons as any;
  return icons[name] ?? icons.CircleHelp ?? icons.HelpCircle ?? icons.AlertCircle ?? FallbackIcon;
};

export const AbilityCard: React.FC<AbilityCardProps> = ({ ability, onClick, disabled, isUnlocked = true, cooldownRemaining = 0 }) => {
  const IconComponent = getIcon(ability.icon);
  
  const colorClass = ELEMENT_COLORS[ability.element];
  const bgClass = ELEMENT_BG_COLORS[ability.element];
  const isOnCooldown = cooldownRemaining > 0;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || !isUnlocked || isOnCooldown}
      className={`
        relative p-2.5 rounded-xl border transition-all duration-200 w-full text-left
        overflow-hidden group min-h-[85px] flex items-center gap-3
        ${!isUnlocked 
            ? 'border-slate-800 bg-slate-900/40 opacity-50 grayscale' 
            : (disabled || isOnCooldown)
                ? 'opacity-80 cursor-not-allowed border-slate-700 bg-slate-900'
                : `bg-slate-900/80 hover:bg-slate-800 ${colorClass.split(' ')[1]} hover:shadow-lg hover:scale-[1.02]`
        }
      `}
    >
      {/* Background Element Color Hint */}
      {isUnlocked && <div className={`absolute top-0 right-0 w-16 h-16 ${bgClass} opacity-10 rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-20`}></div>}
      
      {/* Icon */}
      <div className={`
        relative z-10 p-2 rounded-lg border transition-colors shrink-0
        ${!isUnlocked ? 'bg-slate-950 border-slate-800 text-slate-600' : `${colorClass} ${bgClass.replace('bg-', 'bg-').replace('600', '950')}`}
      `}>
        <IconComponent size={20} />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex justify-between items-start">
            <h4 className={`font-bold text-sm truncate ${!isUnlocked ? 'text-slate-600' : 'text-slate-200'}`}>{ability.name}</h4>
            {isOnCooldown && (
                <span className="text-xs font-bold text-red-400 animate-pulse">{cooldownRemaining}T</span>
            )}
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${!isUnlocked ? 'border-slate-800 text-slate-700' : 'border-white/10 text-white/50'}`}>
                {ability.element}
            </span>
             {ability.manaCost > 0 && (
                <span className="text-[10px] text-blue-400 font-mono">{ability.manaCost} MP</span>
            )}
            {ability.cooldown > 0 && !isOnCooldown && (
                <span className="text-[10px] text-slate-500 font-mono">{ability.cooldown} CD</span>
            )}
        </div>
        
        <p className="text-[10px] text-slate-500 mt-1 truncate">{ability.description}</p>
      </div>

      {/* Unlock Requirement Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-20 backdrop-blur-[1px]">
             <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                 <Icons.Lock size={10} /> Lvl {ability.unlockLevel}
             </span>
        </div>
      )}
    </button>
  );
};