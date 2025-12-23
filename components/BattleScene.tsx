
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
  const icons = Icons as any;
  return icons[name] ?? icons.CircleHelp ?? icons.HelpCircle ?? icons.AlertCircle ?? FallbackIcon;
};

// --- VFX COMPONENTS ---

const HitMarker: React.FC = () => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none">
        <div className="w-32 h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping opacity-75 border-4 border-white rounded-full"></div>
        <div className="w-48 h-1 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 shadow-[0_0_10px_white]"></div>
        <div className="w-48 h-1 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 shadow-[0_0_10px_white]"></div>
    </div>
);

const Projectile: React.FC<{ icon: string, color: string }> = ({ icon, color }) => {
    const Icon = getIcon(icon);
    return (
        <div className={`absolute top-1/2 left-[20%] z-50 animate-projectile-fast`}>
             <Icon size={48} className={color} />
             <div className={`absolute inset-0 blur-lg opacity-50 ${color.replace('text-', 'bg-')}`}></div>
             <style>{`
                @keyframes projectile-accel {
                    0% { left: 20%; transform: translateY(-50%) scale(0.5) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    100% { left: 80%; transform: translateY(-50%) scale(1.5) rotate(360deg); opacity: 1; }
                }
                /* Use cubic-bezier to simulate acceleration (slow start, fast end impact) */
                .animate-projectile-fast { animation: projectile-accel 0.25s cubic-bezier(0.5, 0, 1, 0.5) forwards; }
             `}</style>
        </div>
    );
}

const LaserBeam: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-50">
        <div className={`h-16 w-full origin-left animate-beam opacity-80 ${color.replace('text-', 'bg-')} shadow-[0_0_50px_currentColor] mix-blend-screen`}></div>
         <style>{`
            @keyframes beam-snap {
                0% { transform: scaleX(0); opacity: 0.8; }
                20% { transform: scaleX(1); opacity: 1; }
                100% { transform: scaleX(1); opacity: 0; }
            }
            .animate-beam { animation: beam-snap 0.3s ease-out forwards; }
         `}</style>
    </div>
);

const CloudArea: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-40">
        <div className={`w-64 h-64 rounded-full filter blur-2xl opacity-60 animate-pulse-fast ${color.replace('text-', 'bg-')}`}></div>
        <div className={`absolute top-0 left-0 w-full h-full rounded-full filter blur-xl opacity-40 animate-spin-slow ${color.replace('text-', 'bg-')}`}></div>
    </div>
);

const Vortex: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50">
        <div className={`w-48 h-48 border-4 border-dashed rounded-full animate-spin ${color}`}></div>
        <div className={`absolute inset-0 w-32 h-32 m-auto border-4 border-dotted rounded-full animate-spin-reverse ${color} opacity-50`}></div>
    </div>
);

const Explosion: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50">
         <div className={`w-16 h-16 rounded-full animate-explosion-snap ${color.replace('text-', 'bg-')}`}></div>
         <style>{`
            @keyframes explosion-snap {
                0% { transform: scale(0.1); opacity: 1; }
                30% { transform: scale(3.0); opacity: 0.9; }
                100% { transform: scale(3.5); opacity: 0; }
            }
            .animate-explosion-snap { animation: explosion-snap 0.3s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }
         `}</style>
    </div>
);

const Slash: React.FC<{ color: string, type?: 'diag' | 'cross' | 'horizontal' }> = ({ color, type = 'diag' }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center">
         <div className={`w-64 h-2 rounded-full shadow-[0_0_20px_currentColor] ${color.replace('text-', 'bg-')} ${type === 'diag' ? 'rotate-45' : type === 'horizontal' ? 'rotate-0' : 'rotate-90'} animate-slash`}></div>
         {type === 'cross' && <div className={`absolute w-64 h-2 rounded-full shadow-[0_0_20px_currentColor] ${color.replace('text-', 'bg-')} -rotate-45 animate-slash delay-75`}></div>}
         <style>{`
            @keyframes slash {
                0% { width: 0; opacity: 0; }
                30% { width: 256px; opacity: 1; }
                100% { width: 256px; opacity: 0; }
            }
            .animate-slash { animation: slash 0.15s ease-out forwards; }
         `}</style>
    </div>
);

const Rain: React.FC<{ icon: string, color: string }> = ({ icon, color }) => {
    const Icon = getIcon(icon);
    return (
        <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
             {[...Array(15)].map((_, i) => (
                 <div key={i} className="absolute animate-drop" style={{ left: `${50 + (i - 7) * 5}%`, animationDelay: `${i * 0.02}s` }}>
                     <Icon size={32} className={color} />
                 </div>
             ))}
             <style>{`
                @keyframes drop {
                    0% { top: -10%; opacity: 0; transform: scale(0.5); }
                    30% { opacity: 1; transform: scale(1); }
                    100% { top: 90%; opacity: 0; transform: scale(0.5); }
                }
                .animate-drop { animation: drop 0.4s linear forwards; }
             `}</style>
        </div>
    )
}

const RisingPillars: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute bottom-0 left-[80%] -translate-x-1/2 w-48 h-full z-40 flex items-end justify-center gap-2 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-12 rounded-t-lg animate-rise ${color.replace('text-', 'bg-')}`} style={{ height: '100%', animationDelay: `${i * 0.05}s` }}></div>
        ))}
        <style>{`
            @keyframes rise {
                0% { transform: translateY(100%); }
                40% { transform: translateY(20%); }
                100% { transform: translateY(100%); }
            }
            .animate-rise { animation: rise 0.4s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }
        `}</style>
    </div>
);

const Orbit: React.FC<{ icon: string, color: string }> = ({ icon, color }) => {
    const Icon = getIcon(icon);
    return (
        <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50">
             <div className="relative w-32 h-32 animate-spin-fast">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"><Icon size={24} className={color} /></div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"><Icon size={24} className={color} /></div>
             </div>
             <style>{`
                .animate-spin-fast { animation: spin 0.5s linear infinite; }
             `}</style>
        </div>
    )
}

const GlitchEffect: React.FC<{ color: string }> = ({ color }) => (
    <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 z-50">
        <div className={`text-6xl font-black ${color} animate-glitch`}>!@#$%</div>
        <style>{`
            @keyframes glitch {
                0% { transform: translate(0); clip-path: inset(0 0 0 0); }
                20% { transform: translate(-5px, 5px); clip-path: inset(10% 0 80% 0); }
                40% { transform: translate(5px, -5px); clip-path: inset(80% 0 10% 0); }
                60% { transform: translate(-5px, -5px); clip-path: inset(40% 0 40% 0); }
                100% { transform: translate(0); clip-path: inset(0 0 0 0); }
            }
            .animate-glitch { animation: glitch 0.2s steps(2) infinite; }
        `}</style>
    </div>
);

// --- VFX CONFIG MAPPING ---

const getVFXConfiguration = (abilityId: string, element: ElementType): { type: string, props: any } => {
    // Helper to get element color
    const color = ELEMENT_COLORS[element].split(' ')[0];

    // --- MAPPING LOGIC ---
    // 1. BEAM TYPES
    if (['solar_beam', 'void_ray', 'aether_ray', 'plasma_cannon', 'prism_beam', 'laser_grid', 'judgment_day', 'gamma_ray', 'quasar', 'steam_jet'].includes(abilityId)) {
        return { type: 'beam', props: { color } };
    }

    // 2. EXPLOSION TYPES
    if (['fireball', 'supernova', 'inferno', 'combustion', 'shrapnel', 'crimson_nova', 'supernova_arcane', 'cataclysm', 'outbreak', 'black_sun', 'system_crash', 'total_chaos', 'anarchy', 'eruption', 'pompeii', 'spectral_blast', 'shatter', 'bass_drop', 'pressure_blast', 'pressure_valve'].includes(abilityId)) {
        return { type: 'explosion', props: { color } };
    }

    // 3. VORTEX TYPES
    if (['whirlpool', 'cyclone', 'tornado', 'hurricane', 'black_hole', 'gravity_well', 'singularity', 'sandstorm', 'dust_devil', 'chaos_agent', 'entropy', 'void_lord', 'event_horizon_burst'].includes(abilityId)) {
        return { type: 'vortex', props: { color } };
    }

    // 4. CLOUD/AREA TYPES
    if (['noxious_cloud', 'gloom', 'blizzard', 'fog', 'ice_age', 'permafrost', 'nightmare', 'hallucination', 'steam_cloud', 'miasma', 'contagion', 'nebula_mist', 'daydream', 'sleep_dust', 'scald'].includes(abilityId)) {
        return { type: 'cloud', props: { color } };
    }

    // 5. RAIN/FALLING TYPES
    if (['rain', 'spike_rain', 'meteor', 'star_fall', 'sky_fall', 'blade_dance', 'hail', 'snow', 'gem_storm', 'diamond_dust', 'sand_burial', 'volcanic_rock', 'pyroclasm', 'black_death'].includes(abilityId)) {
        return { type: 'rain', props: { icon: 'Circle', color } };
    }

    // 6. RISING/EARTH TYPES
    if (['fissure', 'earthquake', 'root_crush', 'eruption', 'ice_wall', 'stone_skin', 'titan_smash', 'crush', 'quicksand', 'geyser', 'grave_rise'].includes(abilityId)) {
        return { type: 'rise', props: { color } };
    }

    // 7. SLASH TYPES
    if (['strike', 'slash', 'cut', 'execute', 'claw_rake', 'quick_slash', 'guillotine', 'phantom_strike', 'lucid_strike', 'viper_strike', 'mirage_blade', 'infect', 'rot'].includes(abilityId)) {
        return { type: 'slash', props: { color, type: 'diag' } };
    }
    if (['cross_cut', 'x_scissor', 'dual_strike'].includes(abilityId)) {
        return { type: 'slash', props: { color, type: 'cross' } };
    }

    // 8. ORBIT TYPES
    if (['mystic_orb', 'satellite', 'shield_bash', 'barrier', 'entangle', 'orbit_shield', 'discord_orb', 'wisp_fire', 'haunt', 'poltergeist', 'lucid_shield'].includes(abilityId)) {
        return { type: 'orbit', props: { icon: 'Circle', color } };
    }

    // 9. GLITCH TYPES (New)
    if (['glitch_ray', 'malware', 'ddos', 'paradox', 'time_stop', 'warp_reality', 'collapse', 'multiverse_strike', 'false_reality', 'shattered_mind'].includes(abilityId)) {
        return { type: 'glitch', props: { color } };
    }

    // 10. SPECIFIC PROJECTILES
    if (abilityId.includes('bolt') || abilityId === 'spark') return { type: 'projectile', props: { icon: 'Zap', color } };
    if (abilityId === 'ember' || abilityId === 'lava_burst' || abilityId === 'magma_ball') return { type: 'projectile', props: { icon: 'Flame', color } };
    if (abilityId === 'bubble' || abilityId === 'water_gun') return { type: 'projectile', props: { icon: 'Droplets', color } };
    if (abilityId === 'rock_throw' || abilityId === 'pebble') return { type: 'projectile', props: { icon: 'Mountain', color } };
    if (abilityId === 'ice_shard' || abilityId === 'frost' || abilityId === 'comet_shard') return { type: 'projectile', props: { icon: 'Snowflake', color } };
    if (abilityId === 'toxic_shot' || abilityId === 'infect' || abilityId === 'poison_sting' || abilityId === 'acid_spit') return { type: 'projectile', props: { icon: 'Syringe', color } };
    if (abilityId === 'magic_missile' || abilityId === 'star_fall') return { type: 'projectile', props: { icon: 'Star', color } };
    if (abilityId === 'sonic_boom' || abilityId === 'echo_strike' || abilityId === 'screech') return { type: 'projectile', props: { icon: 'Volume2', color } };
    if (abilityId === 'shard_throw') return { type: 'projectile', props: { icon: 'Hexagon', color } };
    
    // Default fallback
    return { type: 'projectile', props: { icon: 'Circle', color } };
};


// --- MAIN VFX LAYER COMPONENT ---

const VFXLayer: React.FC<{ activeEffect: VisualEffect }> = ({ activeEffect }) => {
    const { type, element, abilityId, target } = activeEffect;
    
    // HEALING IS SPECIAL CASE
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

    // HIT IMPACT (M1 Effect)
    if (type === 'impact') {
        return <HitMarker />;
    }

    if (!abilityId) return null;

    const vfxConfig = getVFXConfiguration(abilityId, element);

    switch(vfxConfig.type) {
        case 'projectile': return <Projectile {...vfxConfig.props} />;
        case 'beam': return <LaserBeam {...vfxConfig.props} />;
        case 'cloud': return <CloudArea {...vfxConfig.props} />;
        case 'explosion': return <Explosion {...vfxConfig.props} />;
        case 'slash': return <Slash {...vfxConfig.props} />;
        case 'rain': return <Rain {...vfxConfig.props} />;
        case 'rise': return <RisingPillars {...vfxConfig.props} />;
        case 'vortex': return <Vortex {...vfxConfig.props} />;
        case 'orbit': return <Orbit {...vfxConfig.props} />;
        case 'glitch': return <GlitchEffect {...vfxConfig.props} />;
        default: return <Projectile icon="Circle" color="text-white" />;
    }
};

// ... (Avatar component remains unchanged) ...

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
      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-150 ${flashScreen === 'red' ? 'bg-red-600/30' : flashScreen === 'white' ? 'bg-white/60' : 'opacity-0'}`}></div>

      {/* VFX Layer */}
      <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none">
         {activeEffect && <VFXLayer activeEffect={activeEffect} />}
      </div>

      {/* Actors */}
      <div className="relative z-10 w-full h-full flex justify-between items-center px-8 md:px-24">
        
        {/* PLAYER SIDE */}
        <div className={`flex flex-col items-center gap-6 relative transition-transform duration-100 cubic-bezier(0.2, 0, 0, 1) ${getPlayerTransform()}`}>
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
        <div className={`flex flex-col items-center gap-6 relative transition-transform duration-100 cubic-bezier(0.2, 0, 0, 1) ${getEnemyTransform()}`}>
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
