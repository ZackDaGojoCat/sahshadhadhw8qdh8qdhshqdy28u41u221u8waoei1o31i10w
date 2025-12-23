import React from 'react';
import { Ability, ElementType } from '../types';
import { ELEMENT_COLORS, ELEMENT_BG_COLORS } from '../constants';
import * as Icons from 'lucide-react';

interface AbilityCardProps {
  ability: Ability;
  onClick?: () => void;
  disabled?: boolean;
  isUnlocked?: boolean;
  cooldownRemaining?: number;
}

export const AbilityCard: React.FC<AbilityCardProps> = ({ ability, onClick, disabled, isUnlocked = true, cooldownRemaining = 0 }) => {
  // Dynamically get icon
  // @ts-ignore
  const IconComponent = Icons[ability.icon] || Icons.HelpCircle;
  
  const colorClass = ELEMENT_COLORS[ability.element];
  const bgClass = ELEMENT_BG_COLORS[ability.element];
  const isOnCooldown = cooldownRemaining > 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isUnlocked || isOnCooldown}
      className={`
        relative p-2.5 rounded-xl border transition-all duration-200 w-full text-left
        overflow-hidden group min-h-[85px]
        ${!isUnlocked 
            ? 'border-slate-800 bg-slate-900/40' 
            : (disabled || isOnCooldown)
                ? 'opacity-80 cursor-not-allowed border-slate-700 bg-slate-900' 
                : `${colorClass} bg-opacity-5 hover:bg-opacity-10 border-opacity-30 hover:border-opacity-60 hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer`
        }
      `}
    >
      {/* Content Container */}
      <div className={`flex items-start gap-3 h-full ${!isUnlocked ? 'opacity-20 blur-[1.5px] grayscale' : ''}`}>
          
          {/* Icon Box */}
          <div className={`p-2 rounded-lg ${bgClass} text-white shrink-0 shadow-inner mt-0.5 relative`}>
            <IconComponent size={18} />
          </div>
          
          {/* Text Content */}
          <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
            <div>
                <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold text-sm text-slate-200 truncate pr-2 leading-none">{ability.name}</h4>
                    <div className="flex flex-col items-end">
                         <span className="text-[10px] font-mono text-slate-500 font-bold whitespace-nowrap">
                            {ability.manaCost > 0 ? `${ability.manaCost} MP` : ''}
                        </span>
                        {ability.cooldown > 0 && <span className="text-[9px] text-slate-600 flex items-center gap-0.5"><Icons.Hourglass size={8}/> {ability.cooldown}t</span>}
                    </div>
                   
                </div>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 h-8">{ability.description}</p>
            </div>

            <div className="flex items-center gap-2 mt-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${bgClass}`}></div>
                 <span className={`text-[9px] uppercase font-bold text-slate-500 tracking-wider`}>
                    {ability.element}
                 </span>
                 {ability.damage && <span className="text-[9px] text-red-400/80 font-mono ml-auto">DMG {ability.damage}</span>}
                 {ability.heal && <span className="text-[9px] text-emerald-400/80 font-mono ml-auto">HEAL {ability.heal}</span>}
            </div>
          </div>
      </div>

      {/* Locked Overlay Badge */}
      {!isUnlocked && (
         <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-slate-950 border border-slate-700 px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5">
                <Icons.Lock size={10} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Lvl {ability.unlockLevel}
                </span>
            </div>
         </div>
      )}

      {/* Cooldown Overlay */}
      {isUnlocked && isOnCooldown && (
          <div className="absolute inset-0 z-20 bg-slate-950/70 flex items-center justify-center backdrop-blur-[1px]">
               <div className="text-center">
                   <span className="block text-2xl font-black text-white drop-shadow-lg">{cooldownRemaining}</span>
                   <span className="text-[9px] uppercase font-bold text-slate-300">Turns</span>
               </div>
          </div>
      )}
    </button>
  );
};
