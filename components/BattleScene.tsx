import React, { useEffect } from 'react';
import { Player, Enemy, DamageNumber, VisualEffect, ElementType } from '../types';
import { ELEMENT_COLORS, ELEMENT_BG_COLORS } from '../constants';
import * as Icons from 'lucide-react';
import { playSfx } from '../services/audioService';

interface BattleSceneProps {
  player: Player;
  enemy: Enemy | null;
  isPlayerTurn: boolean;
  damageNumbers: DamageNumber[];
  activeEffect: VisualEffect | null;
  shakeScreen: boolean;
  flashScreen: 'red' | 'white' | null;
  combatPhase: 'idle' | 'player_lunge' | 'player_return' | 'enemy_lunge' | 'enemy_return';
}

const Avatar: React.FC<{ 
    iconName?: string, 
    element: ElementType, 
    isEnemy?: boolean, 
    isBoss?: boolean,
    isPvP?: boolean,
    isTurn?: boolean,
    isDead?: boolean
}> = ({ iconName, element, isEnemy, isBoss, isPvP, isTurn, isDead }) => {
    let IconComp: any;
    if (isPvP && iconName) {
         // @ts-ignore
        IconComp = Icons[iconName] || Icons.User;
    } else {
         // @ts-ignore
        IconComp = Icons[iconName] || (isEnemy ? Icons.Skull : Icons.User);
    }
    
    const baseColor = ELEMENT_COLORS[element].split(' ')[0]; 
    const glowColor = ELEMENT_COLORS[element].split(' ')[3]; 
    const borderColor = ELEMENT_COLORS[element].split(' ')[1]; 
    
    return (
        <div className={`relative group transition-all duration-1000 ${isDead ? 'grayscale brightness-50 blur-sm scale-90' : ''}`}>
            <div className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity duration-500 ${isTurn ? 'opacity-80' : 'opacity-20'} ${glowColor.replace('shadow-', 'bg-')}`}></div>
            <div className={`
                relative z-10 
                w-24 h-24 md:w-32 md:h-32 
                rounded-full 
                bg-slate-900 
                border-4 ${borderColor}
                flex items-center justify-center
                shadow-[0_0_30px_rgba(0,0,0,0.5)]
                ${glowColor}
                transition-all duration-300
                ${isBoss ? 'scale-125 border-double border-8' : ''}
                ${isTurn ? 'scale-105 brightness-110' : 'brightness-90'}
            `}>
                <IconComp 
                    className={`
                        ${baseColor} 
                        drop-shadow-[0_0_10px_currentColor]
                        transition-transform duration-500
                        ${isTurn ? 'scale-110' : 'scale-100'}
                    `} 
                    size={isBoss ? 64 : 48} 
                    strokeWidth={1.5}
                />
            </div>
             {isBoss && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-lg animate-bounce">
                    <Icons.Crown size={32} fill="currentColor" />
                </div>
            )}
        </div>
    );
};

export const BattleScene: React.FC<BattleSceneProps> = ({ 
    player, enemy, isPlayerTurn, damageNumbers, activeEffect, shakeScreen, flashScreen, combatPhase 
}) => {
  
  useEffect(() => {
    if (activeEffect) {
        if (activeEffect.type === 'heal') playSfx('heal', activeEffect.element);
        else if (activeEffect.type === 'impact') playSfx('hit', activeEffect.element);
        else if (activeEffect.type === 'projectile') playSfx('attack', activeEffect.element);
    }
  }, [activeEffect]);

  const getPlayerTransform = () => {
      if (combatPhase === 'player_lunge') return 'translate-x-[200px] md:translate-x-[300px] scale-110 z-50'; 
      if (combatPhase === 'enemy_lunge') return '-translate-x-4 brightness-150 grayscale'; 
      return 'translate-x-0 scale-100';
  };

  const getEnemyTransform = () => {
      if (combatPhase === 'enemy_lunge') return '-translate-x-[200px] md:-translate-x-[300px] scale-110 z-50';
      if (combatPhase === 'player_lunge') return 'translate-x-4 brightness-150 grayscale';
      return 'translate-x-0 scale-100'; 
  };

  const renderVFX = () => {
    if (!activeEffect) return null;
    const { type, element, target } = activeEffect;
    const isTargetPlayer = target === 'player';
    const positionClass = isTargetPlayer ? 'left-[20%]' : 'right-[20%]';
    
    // HEAL EFFECT
    if (type === 'heal') {
        const targetPos = activeEffect.source === 'player' ? 'left-[20%]' : 'right-[20%]';
        return (
            <div className={`absolute ${targetPos} top-1/2 -translate-y-1/2 z-50 pointer-events-none`}>
                <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 w-40 h-40 animate-heal rounded-full border-4 border-emerald-400 opacity-0 shadow-[0_0_30px_rgba(52,211,153,0.6)]"></div>
                <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-float">
                    <Icons.Plus size={48} className="text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,1)]" />
                </div>
                <div className="absolute -top-10 left-10 animate-float text-emerald-200 opacity-50"><Icons.Plus size={24}/></div>
                <div className="absolute top-10 -left-10 animate-float text-emerald-200 opacity-50 delay-100"><Icons.Plus size={24}/></div>
            </div>
        );
    }

    // IMPACT / ATTACK EFFECT
    if (type === 'impact') {
        return (
            <div className={`absolute top-1/2 -translate-y-1/2 ${positionClass} z-50 pointer-events-none flex items-center justify-center`}>
                
                {element === 'Physical' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute w-64 h-2 bg-white rounded-full animate-slash shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                        <div className="absolute w-64 h-1 bg-slate-300 rounded-full animate-slash shadow-[0_0_15px_rgba(255,255,255,0.8)] delay-[50ms]" style={{ transform: 'rotate(-45deg)'}}></div>
                        <Icons.Sword size={64} className="text-zinc-200 animate-ping opacity-50 absolute" />
                    </div>
                )}

                {element === 'Fire' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                         <div className="animate-fire-puff absolute w-32 h-32 bg-orange-500 rounded-full blur-xl opacity-80"></div>
                         <div className="animate-fire-puff delay-100 absolute w-24 h-24 bg-yellow-400 rounded-full blur-lg opacity-90"></div>
                         <div className="animate-fire-puff delay-200 absolute w-16 h-16 bg-white rounded-full blur-md"></div>
                         <Icons.Flame size={80} className="text-orange-200 animate-ping absolute" />
                    </div>
                )}

                {element === 'Water' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                         <div className="absolute w-32 h-32 border-4 border-blue-400 rounded-full animate-ripple opacity-70"></div>
                         <div className="absolute w-48 h-48 border-2 border-cyan-300 rounded-full animate-ripple delay-100 opacity-50"></div>
                         <Icons.Droplets size={64} className="text-blue-300 animate-bounce absolute" />
                         <div className="absolute top-0 right-0 w-4 h-4 bg-blue-400 rounded-full animate-float"></div>
                         <div className="absolute bottom-10 left-0 w-3 h-3 bg-cyan-300 rounded-full animate-float delay-150"></div>
                    </div>
                )}

                {element === 'Earth' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                         <div className="animate-crumble absolute -bottom-10 w-16 h-16 bg-stone-700 rounded-sm rotate-12"></div>
                         <div className="animate-crumble delay-75 absolute -bottom-8 -left-10 w-12 h-12 bg-stone-600 rounded-sm -rotate-6"></div>
                         <div className="animate-crumble delay-150 absolute -bottom-12 left-10 w-14 h-14 bg-stone-800 rounded-sm rotate-45"></div>
                         <Icons.Mountain size={96} className="text-stone-400 drop-shadow-2xl animate-shake-hard" />
                    </div>
                )}

                {element === 'Air' && (
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <Icons.Wind size={128} className="text-slate-200 opacity-40 blur-[1px] animate-swirl" />
                        <div className="absolute w-40 h-40 border-t-4 border-r-4 border-slate-300 rounded-full animate-spin"></div>
                        <div className="absolute w-56 h-56 border-b-2 border-l-2 border-slate-400 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse'}}></div>
                    </div>
                )}

                {element === 'Lightning' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                         <div className="absolute inset-0 bg-white animate-flash opacity-20"></div>
                         <Icons.Zap size={128} className="text-yellow-200 drop-shadow-[0_0_30px_rgba(253,224,71,1)] animate-shake-hard" />
                         <div className="absolute w-1 h-64 bg-yellow-400 rotate-45 animate-flash"></div>
                         <div className="absolute w-1 h-64 bg-purple-400 -rotate-45 animate-flash delay-75"></div>
                    </div>
                )}

                {element === 'Ice' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <Icons.Snowflake size={96} className="text-white drop-shadow-[0_0_15px_rgba(186,230,253,1)] animate-shatter" />
                        <div className="absolute w-2 h-32 bg-sky-200 rotate-0 animate-shatter"></div>
                        <div className="absolute w-2 h-32 bg-sky-200 rotate-90 animate-shatter"></div>
                        <div className="absolute w-32 h-2 bg-sky-200 rotate-45 animate-shatter"></div>
                        <div className="absolute w-32 h-2 bg-sky-200 -rotate-45 animate-shatter"></div>
                    </div>
                )}

                {element === 'Light' && (
                    <div className="relative w-24 h-[500px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-yellow-100 animate-beam blur-lg opacity-80"></div>
                        <div className="absolute inset-x-8 inset-y-0 bg-white animate-beam blur-md opacity-100"></div>
                        <Icons.Sun size={80} className="text-yellow-200 absolute top-1/2 -translate-y-1/2 animate-spin" />
                    </div>
                )}

                {element === 'Dark' && (
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <div className="animate-void w-48 h-48 bg-black rounded-full border-4 border-purple-900 shadow-[0_0_60px_rgba(147,51,234,0.8)]"></div>
                        <Icons.Ghost size={64} className="text-purple-300 animate-float absolute opacity-80" />
                        <div className="absolute w-full h-full border border-purple-900 rounded-full animate-ping opacity-50"></div>
                    </div>
                )}
            </div>
        );
    }
    return null;
  };

  return (
    <div className={`relative w-full h-80 md:h-96 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-100 ${shakeScreen ? 'animate-shake-hard border-red-500/50' : ''}`}>
      
      {/* Atmosphere */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${enemy ? ELEMENT_BG_COLORS[enemy.element].replace('bg-', 'bg-gradient-to-br from-slate-900 to-') : 'bg-slate-900'}`}></div>

      {/* Grid Floor */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
               backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
               backgroundSize: '40px 40px',
               transform: 'perspective(500px) rotateX(40deg) scale(1.5) translateY(50px)'
           }}>
      </div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80 pointer-events-none"></div>

      {/* Screen Flash Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-300 ${flashScreen === 'red' ? 'bg-red-600/30' : flashScreen === 'white' ? 'bg-white/50' : 'opacity-0'}`}></div>

      {/* VFX Layer */}
      <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none">
         {renderVFX()}
      </div>

      {/* Actors */}
      <div className="relative z-10 w-full h-full flex justify-between items-center px-8 md:px-24">
        
        {/* PLAYER SIDE */}
        <div className={`flex flex-col items-center gap-6 relative transition-transform duration-200 cubic-bezier(0.2, 0, 0, 1) ${getPlayerTransform()}`}>
            {damageNumbers.filter(d => d.x < 50).map(dn => (
                <div key={dn.id} className="absolute -top-24 text-5xl font-black font-cinzel damage-number z-[60] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] stroke-black" style={{ color: dn.color, textShadow: '2px 2px 0 #000' }}>
                    {dn.value}
                </div>
            ))}
            <Avatar 
                iconName={player.iconName} 
                element={player.element} 
                isTurn={isPlayerTurn && combatPhase === 'idle'} 
                isDead={player.currentHp <= 0}
            />
            
            {/* Player Health Bar */}
            <div className={`transition-opacity duration-200 ${combatPhase !== 'idle' ? 'opacity-0' : 'opacity-100'}`}>
                <div className="w-32 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden shadow-lg relative">
                    <div className="absolute inset-0 bg-red-900/50"></div>
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300" style={{ width: `${Math.max(0, (player.currentHp / player.maxHp) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider">HP</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{Math.max(0, player.currentHp)}</span>
                </div>
                <div className="w-32 h-1.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden mt-1">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(player.currentMp / player.maxMp) * 100}%` }}></div>
                </div>
            </div>
        </div>

        {/* VS / Turn Indicator */}
        {combatPhase === 'idle' && player.currentHp > 0 && enemy && enemy.currentHp > 0 && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex flex-col items-center">
               <span className="text-slate-700 font-black text-6xl italic opacity-30">VS</span>
               {isPlayerTurn ? 
                 <span className="text-blue-400 text-xs tracking-[0.3em] font-bold animate-pulse">YOUR TURN</span> : 
                 <span className="text-red-500 text-xs tracking-[0.3em] font-bold animate-pulse">ENEMY TURN</span>
               }
            </div>
        )}

        {/* ENEMY SIDE */}
        {enemy && (
          <div className={`flex flex-col items-center gap-6 relative transition-transform duration-200 cubic-bezier(0.2, 0, 0, 1) ${getEnemyTransform()}`}>
             {damageNumbers.filter(d => d.x > 50).map(dn => (
                <div key={dn.id} className="absolute -top-24 text-6xl font-black font-cinzel damage-number z-[60] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ color: dn.color, textShadow: '2px 2px 0 #000' }}>
                    {dn.value}
                </div>
            ))}
            <Avatar iconName={enemy.iconName} element={enemy.element} isEnemy isBoss={enemy.isBoss} isPvP={enemy.isPvP} isTurn={!isPlayerTurn && combatPhase === 'idle'} isDead={enemy.currentHp <= 0} />
            
             {/* Enemy Health Bar */}
            <div className={`transition-opacity duration-200 ${combatPhase !== 'idle' ? 'opacity-0' : 'opacity-100'} text-center`}>
                <h3 className="text-slate-200 font-bold text-sm mb-1 drop-shadow-md">{enemy.name}</h3>
                <div className="w-32 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden shadow-lg mx-auto relative">
                     <div className="absolute inset-0 bg-red-900/50"></div>
                    <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300" style={{ width: `${Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)}%` }}></div>
                </div>
                 <div className="flex justify-center gap-2 mt-1">
                    <span className={`text-[9px] uppercase font-bold px-1.5 rounded bg-slate-800 border ${ELEMENT_COLORS[enemy.element]}`}>{enemy.element}</span>
                    <span className="text-[10px] font-mono text-slate-500">Lvl {enemy.level}</span>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
