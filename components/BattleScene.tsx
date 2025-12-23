
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

// --- GENERIC PARTICLE SYSTEM ---
const ParticleSystem: React.FC<{ element: ElementType; x: number; y: number }> = ({ element, x, y }) => {
    const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties; className: string }>>([]);

    useEffect(() => {
        const count = 16; 
        const newParticles = [];
        
        const colors: Record<string, string> = {
            Fire: '#f97316', Water: '#3b82f6', Earth: '#78350f', Air: '#a5f3fc',
            Lightning: '#e879f9', Ice: '#bae6fd', Light: '#fef08a', Dark: '#581c87',
            Nature: '#84cc16', Metal: '#94a3b8', Blood: '#dc2626', Time: '#d946ef',
            Arcane: '#ec4899', Physical: '#cbd5e1', Gravity: '#6366f1', Sound: '#2dd4bf',
            Venom: '#10b981', Crystal: '#fda4af', Steam: '#d1d5db', Spirit: '#93c5fd',
            Cyber: '#22c55e', Quantum: '#06b6d4', Dream: '#c084fc'
        };
        const color = colors[element] || '#fff';

        let animationType = 'particle-explode';
        if (element === 'Fire' || element === 'Dark' || element === 'Arcane' || element === 'Quantum') animationType = 'particle-spiral';
        if (element === 'Water' || element === 'Blood' || element === 'Ice' || element === 'Steam') animationType = 'particle-rain';
        if (element === 'Earth' || element === 'Nature' || element === 'Crystal') animationType = 'particle-rise';

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

// --- SPECIFIC VFX COMPONENTS ---

const Projectile: React.FC<{ icon: string, color: string, className?: string }> = ({ icon, color, className }) => {
    const Icon = getIcon(icon);
    return (
        <div className={`absolute top-1/2 left-[20%] z-50 animate-projectile ${className}`}>
             <Icon size={48} className={color} />
             <div className={`absolute inset-0 blur-lg opacity-50 ${color.replace('text-', 'bg-')}`}></div>
             <style>{`
                @keyframes projectile {
                    0% { left: 20%; transform: translateY(-50%) scale(0.5); opacity: 0; }
                    20% { opacity: 1; }
                    100% { left: 80%; transform: translateY(-50%) scale(1.5); opacity: 1; }
                }
                .animate-projectile { animation: projectile 0.4s linear forwards; }
             `}</style>
        </div>
    );
}

const SlashEffect: React.FC<{ color: string, type?: 'diag' | 'cross' | 'horizontal' }> = ({ color, type = 'diag' }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center">
         <div className={`w-64 h-2 rounded-full shadow-[0_0_20px_currentColor] ${color.replace('text-', 'bg-')} ${type === 'diag' ? 'rotate-45' : type === 'horizontal' ? 'rotate-0' : 'rotate-90'} animate-slash`}></div>
         {type === 'cross' && <div className={`absolute w-64 h-2 rounded-full shadow-[0_0_20px_currentColor] ${color.replace('text-', 'bg-')} -rotate-45 animate-slash delay-75`}></div>}
         <style>{`
            @keyframes slash {
                0% { width: 0; opacity: 0; }
                50% { width: 256px; opacity: 1; }
                100% { width: 256px; opacity: 0; }
            }
            .animate-slash { animation: slash 0.2s ease-out forwards; }
         `}</style>
    </div>
);

const BeamEffect: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-50">
        <div className={`h-12 w-full origin-left animate-beam opacity-80 ${color.replace('text-', 'bg-')} shadow-[0_0_50px_currentColor]`}></div>
         <style>{`
            @keyframes beam {
                0% { transform: scaleX(0); opacity: 0.5; }
                20% { transform: scaleX(1); opacity: 1; }
                100% { transform: scaleX(1); opacity: 0; }
            }
            .animate-beam { animation: beam 0.5s ease-out forwards; }
         `}</style>
    </div>
);

const ImpactRipple: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50">
         <div className={`w-32 h-32 rounded-full border-4 ${color.replace('text-', 'border-')} animate-ripple opacity-0`}></div>
         <style>{`
            @keyframes ripple {
                0% { transform: scale(0.1); opacity: 1; border-width: 10px; }
                100% { transform: scale(3); opacity: 0; border-width: 0px; }
            }
            .animate-ripple { animation: ripple 0.6s ease-out forwards; }
         `}</style>
    </div>
);

const RainEffect: React.FC<{ icon: string, color: string }> = ({ icon, color }) => {
    const Icon = getIcon(icon);
    return (
        <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
             {[...Array(10)].map((_, i) => (
                 <div key={i} className="absolute animate-drop" style={{ left: `${10 + i * 10}%`, animationDelay: `${i * 0.1}s` }}>
                     <Icon size={32} className={color} />
                 </div>
             ))}
             <style>{`
                @keyframes drop {
                    0% { top: -10%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                .animate-drop { animation: drop 0.5s linear forwards; }
             `}</style>
        </div>
    )
}

// --- MAIN VFX LOGIC ---

const VFXLayer: React.FC<{ activeEffect: VisualEffect }> = ({ activeEffect }) => {
    const { type, element, abilityId, target } = activeEffect;
    
    // HEALING
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
    
    // UNIQUE ABILITY MAPPING
    // If it's a projectile from player to enemy
    if (type === 'projectile' && abilityId) {
        if (abilityId.includes('bolt') || abilityId === 'spark') return <Projectile icon="Zap" color="text-yellow-400" />;
        if (abilityId.includes('fire') || abilityId === 'ember' || abilityId === 'inferno') return <Projectile icon="Flame" color="text-orange-500" />;
        if (abilityId === 'bubble' || abilityId === 'aqua_jet') return <Projectile icon="Droplets" color="text-blue-400" />;
        if (abilityId.includes('rock') || abilityId === 'pebble') return <Projectile icon="Circle" color="text-stone-500" />;
        if (abilityId.includes('ice') || abilityId === 'frost') return <Projectile icon="Snowflake" color="text-sky-300" />;
        if (abilityId.includes('void') || abilityId === 'gloom') return <Projectile icon="Skull" color="text-purple-600" />;
        if (abilityId.includes('magic') || abilityId === 'mystic') return <Projectile icon="Sparkles" color="text-pink-400" />;
        if (abilityId.includes('beam') || abilityId === 'ray') return <BeamEffect color={ELEMENT_COLORS[element].split(' ')[0]} />;
        if (abilityId === 'toxic_shot') return <Projectile icon="Syringe" color="text-emerald-500" />;
        if (abilityId === 'sonic_boom') return <Projectile icon="Volume2" color="text-teal-400" />;
        return <Projectile icon="Circle" color="text-white" />; // Fallback projectile
    }

    // Impact effects (Slashes, Explosions)
    if (type === 'impact' && abilityId) {
        if (abilityId.includes('slash') || abilityId.includes('cut') || abilityId === 'strike') return <SlashEffect color="text-zinc-300" type="diag" />;
        if (abilityId === 'cross_cut' || abilityId === 'x_scissor') return <SlashEffect color="text-red-400" type="cross" />;
        if (abilityId === 'bladestorm' || abilityId === 'cyclone') return <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50 animate-spin text-zinc-400"><Icons.RotateCcw size={128} /></div>;
        if (abilityId === 'earthquake' || abilityId === 'fissure') return <div className="absolute inset-0 z-50 flex items-center justify-center animate-shake-hard"><Icons.Mountain size={200} className="text-stone-600 opacity-50" /></div>;
        if (abilityId.includes('nova') || abilityId === 'explosion') return <ImpactRipple color="text-orange-500" />;
        if (abilityId === 'black_hole') return <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50 w-64 h-64 bg-black rounded-full border-2 border-purple-500 animate-pulse shadow-[0_0_50px_#000]"></div>;
        if (abilityId === 'rain' || abilityId === 'blizzard' || abilityId === 'spike_rain') return <RainEffect icon={element === 'Ice' ? 'Snowflake' : 'ArrowDown'} color="text-white" />;
        
        // GENERIC FALLBACK IMPACT
        return <ImpactRipple color={ELEMENT_COLORS[element].split(' ')[0]} />;
    }

    // Fallback to particle system
    const x = target === 'player' ? 80 : 250; 
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
            <ParticleSystem element={element} x={x} y={150} />
        </div>
    );
};

// ... (Avatar component remains mostly the same, updated props for clarity) ...

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
