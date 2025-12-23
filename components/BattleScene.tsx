import React, { useEffect, useState } from 'react';
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

const FallbackIcon: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
  <div className={`w-8 h-8 rounded-full bg-gray-500 ${className ?? ''}`} style={{ width: size, height: size }} />
);

const getIcon = (name: string): React.ElementType => {
  // Cast to any to avoid build errors if specific icon names change in library versions
  const icons = Icons as any;
  return icons[name] ?? icons.CircleHelp ?? icons.HelpCircle ?? icons.AlertCircle ?? FallbackIcon;
};

// --- UNIQUE PARTICLE SYSTEM ---
const ParticleSystem: React.FC<{ element: ElementType; x: number; y: number }> = ({ element, x, y }) => {
    const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties; className: string }>>([]);

    useEffect(() => {
        const count = 16; 
        const newParticles = [];
        
        const colors: Record<string, string> = {
            Fire: '#f97316', Water: '#3b82f6', Earth: '#78350f', Air: '#a5f3fc',
            Lightning: '#e879f9', Ice: '#bae6fd', Light: '#fef08a', Dark: '#581c87',
            Nature: '#84cc16', Metal: '#94a3b8', Blood: '#dc2626', Time: '#d946ef',
            Arcane: '#ec4899', Physical: '#cbd5e1'
        };
        const color = colors[element] || '#fff';

        let animationType = 'particle-explode';
        if (element === 'Fire' || element === 'Dark' || element === 'Arcane') animationType = 'particle-spiral';
        if (element === 'Water' || element === 'Blood' || element === 'Ice') animationType = 'particle-rain';
        if (element === 'Earth' || element === 'Nature') animationType = 'particle-rise';

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 120;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            newParticles.push({
                id: i,
                className: `particle ${animationType}`,
                style: {
                    backgroundColor: color,
                    left: `${x}px`,
                    top: `${y}px`,
                    boxShadow: `0 0 6px ${color}`, 
                    // @ts-ignore
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`,
                    '--ox': `${(Math.random() - 0.5) * 80}px`, 
                    '--size': `${4 + Math.random() * 6}px`
                }
            });
        }
        setParticles(newParticles);
    }, [element, x, y]);

    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {particles.map(p => (
                <div key={p.id} className={p.className} style={p.style} />
            ))}
        </div>
    );
};

// --- SPECIAL VFX COMPONENTS ---
const GlitchEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
        <div className="text-9xl font-black text-fuchsia-500 opacity-50 animate-glitch mix-blend-screen" style={{ transform: 'translateX(-5px)' }}>ERROR</div>
        <div className="text-9xl font-black text-cyan-500 opacity-50 animate-glitch mix-blend-screen" style={{ transform: 'translateX(5px)', animationDirection: 'reverse' }}>TIME</div>
        <div className="absolute inset-0 bg-fuchsia-900/20 mix-blend-overlay"></div>
    </div>
);

const NukeEffect: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full rounded-full animate-nuke" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}></div>
    </div>
);

const TsunamiEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
        <div className="w-[150%] h-full bg-blue-500/60 animate-tsunami absolute top-0 left-[-25%] skew-x-12 backdrop-blur-sm border-r-4 border-white/50"></div>
    </div>
);

const Avatar: React.FC<{ 
    iconName?: string, 
    element: ElementType, 
    isEnemy?: boolean, 
    isBoss?: boolean,
    isPvP?: boolean,
    isTurn?: boolean,
    isDead?: boolean,
    prestige?: number,
    level?: number
}> = ({ iconName, element, isEnemy, isBoss, isPvP, isTurn, isDead, prestige = 0, level }) => {
    
    const nameToUse = iconName || (isEnemy ? 'Skull' : 'User');
    const IconComp = getIcon(nameToUse);
    const CrownIcon = getIcon('Crown');

    const baseColor = ELEMENT_COLORS[element].split(' ')[0]; 
    const glowColor = ELEMENT_COLORS[element].split(' ')[3]; 
    const borderColor = ELEMENT_COLORS[element].split(' ')[1]; 
    
    const prestigeClass = prestige > 0 ? 'prestige-border' : '';
    
    return (
        <div className={`relative group transition-all duration-1000 ${isDead ? 'grayscale brightness-50 blur-sm scale-90' : ''}`}>
            {prestige > 0 && <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-yellow-500 via-red-500 to-purple-600 opacity-30 animate-spin blur-lg duration-1000"></div>}
            
            <div className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity duration-500 ${isTurn ? 'opacity-80' : 'opacity-20'} ${glowColor.replace('shadow-', 'bg-')}`}></div>
            
            <div className={`
                relative z-10 
                w-24 h-24 md:w-32 md:h-32 
                rounded-full 
                bg-slate-900 
                border-4 ${borderColor} ${prestigeClass}
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
                    <CrownIcon size={32} />
                </div>
            )}
             {isPvP && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-400">
                    PVP
                </div>
            )}
            {level !== undefined && (
                <div className={`absolute -bottom-1 ${isEnemy ? '-left-1' : '-right-1'} z-20 bg-slate-950 border border-slate-700 rounded-full px-2 py-0.5 shadow-lg flex items-center gap-1`}>
                    <span className="text-[10px] text-slate-400 font-bold">Lvl</span>
                    <span className="text-xs font-bold text-white">{level}</span>
                </div>
            )}
        </div>
    );
};

const VFXLayer: React.FC<{ activeEffect: VisualEffect }> = ({ activeEffect }) => {
    const { type, element, target, abilityId } = activeEffect;
    const isTargetPlayer = target === 'player';
    const positionClass = isTargetPlayer ? 'left-[20%]' : 'right-[20%]';

    // --- 1. CHECK FOR SPECIAL ABILITY OVERRIDES FIRST ---
    if (abilityId === 'paradox' || abilityId === 'time_stop' || abilityId === 'future_strike') {
        return <GlitchEffect />;
    }

    if (abilityId === 'supernova' || abilityId === 'supernova_arcane') {
        return <NukeEffect color={element === 'Fire' ? '#f97316' : '#ec4899'} />;
    }
    
    if (abilityId === 'tsunami' || abilityId === 'tidal_strike' || abilityId === 'leviathan') {
        return <TsunamiEffect />;
    }

    if (abilityId === 'void_ray' || abilityId === 'cataclysm' || abilityId === 'black_hole') {
         return (
            <div className={`absolute top-1/2 -translate-y-1/2 ${positionClass} z-50 pointer-events-none flex items-center justify-center`}>
                <div className="w-64 h-64 bg-black rounded-full animate-void border-4 border-purple-900 shadow-[0_0_50px_#000]"></div>
                <Icons.Skull size={100} className="text-purple-500 absolute animate-pulse z-10" />
            </div>
         );
    }
    
    if (abilityId === 'absolute_zero') {
         return (
            <div className="absolute inset-0 z-50 pointer-events-none bg-sky-300/20 backdrop-blur-[2px] flex items-center justify-center">
                 <Icons.Snowflake size={200} className="text-white animate-spin-slow drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
            </div>
         );
    }

    // --- 2. FALLBACK TO ELEMENTAL ANIMATIONS ---
    const renderEffect = () => {
        if (type === 'heal') {
             return (
                <div className={`absolute ${activeEffect.source === 'player' ? 'left-[20%]' : 'right-[20%]'} top-1/2 -translate-y-1/2 z-50 pointer-events-none`}>
                    <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 w-48 h-48 animate-heal rounded-full border-4 border-emerald-400 opacity-0 shadow-[0_0_50px_rgba(52,211,153,0.8)]"></div>
                    <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-float">
                        <Icons.Plus size={64} className="text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,1)]" />
                    </div>
                </div>
            );
        }

        return (
            <div className={`absolute top-1/2 -translate-y-1/2 ${positionClass} z-50 pointer-events-none flex items-center justify-center`}>
                
                <ParticleSystem element={element} x={0} y={0} />

                {element === 'Physical' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="vfx-slash absolute w-80 h-4 bg-white rounded-full shadow-[0_0_25px_rgba(255,255,255,1)]"></div>
                        <Icons.Sword size={80} className="text-zinc-200 animate-ping opacity-70 absolute" />
                    </div>
                )}

                {element === 'Fire' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                         <div className="vfx-fire-pillar absolute w-24 h-64 bg-gradient-to-t from-orange-600 via-yellow-500 to-transparent opacity-90 blur-lg"></div>
                         <Icons.Flame size={100} className="text-orange-200 animate-ping absolute drop-shadow-[0_0_20px_rgba(251,146,60,1)]" />
                    </div>
                )}

                {element === 'Water' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                         <div className="absolute w-56 h-56 border-8 border-blue-400 rounded-full animate-ripple opacity-80 shadow-[0_0_30px_rgba(59,130,246,0.6)]"></div>
                         <Icons.Droplets size={80} className="text-blue-200 animate-bounce absolute drop-shadow-[0_0_20px_rgba(59,130,246,1)]" />
                    </div>
                )}

                {element === 'Earth' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                         <Icons.Mountain size={110} className="text-stone-300 drop-shadow-2xl animate-shake-hard" />
                         <div className="absolute -bottom-10 w-48 h-24 bg-stone-700 blur-xl animate-pulse"></div>
                    </div>
                )}

                {element === 'Air' && (
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <Icons.Wind size={140} className="text-slate-100 opacity-80 blur-[1px] animate-spin-slow" />
                         <div className="vfx-implode absolute w-full h-full border-4 border-slate-300 rounded-full opacity-50"></div>
                    </div>
                )}

                {element === 'Lightning' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                         <div className="absolute inset-0 bg-white animate-flash opacity-60"></div>
                         <Icons.Zap size={140} className="text-yellow-100 drop-shadow-[0_0_40px_rgba(253,224,71,1)] animate-shake-hard" />
                    </div>
                )}

                {element === 'Ice' && (
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <Icons.Snowflake size={110} className="text-white drop-shadow-[0_0_25px_rgba(186,230,253,1)] animate-shatter" />
                    </div>
                )}

                {element === 'Light' && (
                    <div className="relative w-64 h-[800px] flex items-center justify-center -translate-y-24">
                        <div className="absolute w-32 h-full bg-gradient-to-t from-yellow-100/10 via-yellow-100/60 to-yellow-100/10 animate-pulse blur-xl"></div>
                        <Icons.Sun size={140} className="text-yellow-50 absolute top-1/2 -translate-y-1/2 animate-spin-slow z-10 drop-shadow-[0_0_60px_rgba(253,224,71,1)]" />
                    </div>
                )}

                {element === 'Dark' && (
                    <div className="relative w-64 h-64 flex items-center justify-center">
                         <div className="vfx-implode w-56 h-56 bg-black rounded-full border-4 border-purple-900 shadow-[0_0_80px_rgba(147,51,234,1)]"></div>
                         <Icons.Ghost size={80} className="text-purple-300 absolute opacity-70 animate-pulse" />
                    </div>
                )}
                
                {element === 'Time' && (
                     <div className="relative w-64 h-64 flex items-center justify-center">
                         <Icons.Clock size={90} className="text-fuchsia-300 absolute animate-pulse" />
                         <Icons.RotateCw size={120} className="text-fuchsia-500 absolute animate-spin-slow opacity-50" />
                    </div>
                )}

                 {(element === 'Nature' || element === 'Metal' || element === 'Blood' || element === 'Arcane') && (
                     <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="vfx-implode absolute inset-0 bg-white/30 rounded-full blur-md"></div>
                        <Icons.Sparkles size={90} className="animate-spin text-white drop-shadow-[0_0_20px_currentColor]" style={{ color: ELEMENT_COLORS[element].split(' ')[0].replace('text-', '') }} />
                     </div>
                 )}
            </div>
        );
    };

    return renderEffect();
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
         {activeEffect && <VFXLayer activeEffect={activeEffect} />}
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
                prestige={player.prestige}
                level={player.level}
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
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <div className="bg-slate-900/80 border-2 border-slate-600 px-4 py-2 rounded-lg backdrop-blur-sm transform -skew-x-12 shadow-xl">
                    <span className="text-2xl font-black italic text-slate-200">VS</span>
                </div>
            </div>
        )}

        {/* ENEMY SIDE */}
        <div className={`flex flex-col items-center gap-6 relative transition-transform duration-200 cubic-bezier(0.2, 0, 0, 1) ${getEnemyTransform()}`}>
            {damageNumbers.filter(d => d.x >= 50).map(dn => (
                <div key={dn.id} className="absolute -top-24 text-5xl font-black font-cinzel damage-number z-[60] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] stroke-black" style={{ color: dn.color, textShadow: '2px 2px 0 #000' }}>
                    {dn.value}
                </div>
            ))}
            {enemy && (
                <>
                    <Avatar 
                        iconName={enemy.iconName} 
                        element={enemy.element} 
                        isEnemy 
                        isBoss={enemy.isBoss} 
                        isPvP={enemy.isPvP}
                        isTurn={!isPlayerTurn && combatPhase === 'idle'}
                        isDead={enemy.currentHp <= 0}
                        level={enemy.level}
                    />
                    
                    {/* Enemy Health Bar */}
                    <div className={`transition-opacity duration-200 ${combatPhase !== 'idle' ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="w-32 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden shadow-lg relative">
                            <div className="absolute inset-0 bg-red-900/50"></div>
                            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" style={{ width: `${Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-1 px-1">
                            <span className="text-[10px] text-slate-400 font-bold tracking-wider">HP</span>
                            <span className="text-[10px] text-red-400 font-mono">{Math.max(0, enemy.currentHp)}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden mt-1">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(enemy.currentMp / enemy.maxMp) * 100}%` }}></div>
                        </div>
                    </div>
                </>
            )}
        </div>

      </div>
    </div>
  );
};