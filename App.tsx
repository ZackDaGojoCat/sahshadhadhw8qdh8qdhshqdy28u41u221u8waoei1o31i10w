import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, Enemy, Ability, GameState, CombatLogEntry, DamageNumber, ElementType, VisualEffect, Weapon 
} from './types';
import { 
  ABILITIES, TYPE_ADVANTAGE, CHARACTER_CLASSES, BASE_XP_REQ, XP_SCALING, WEAPONS, ELEMENT_COLORS
} from './constants';
import { generateEnemy, generateCombatFlavor } from './services/geminiService';
import { encodePlayerToCode, decodeCodeToEnemy } from './services/pvpService';
import { playSfx } from './services/audioService';
import { BattleScene } from './components/BattleScene';
import { AbilityCard } from './components/AbilityCard';
import * as Icons from 'lucide-react';

const DEFAULT_WEAPON = WEAPONS[0];

const EMPTY_PLAYER: Player = {
    name: '',
    maxHp: 0,
    currentHp: 0,
    maxMp: 0,
    currentMp: 0,
    level: 1,
    xp: 0,
    maxXp: 0,
    gold: 0,
    element: 'Physical',
    unlockedAbilities: [],
    iconName: 'User',
    classId: '',
    weapon: DEFAULT_WEAPON,
    winStreak: 0
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [player, setPlayer] = useState<Player>(EMPTY_PLAYER);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  
  // PVP State
  const [pvpCodeInput, setPvpCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Combat State
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [activeEffect, setActiveEffect] = useState<VisualEffect | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [flashScreen, setFlashScreen] = useState<'red' | 'white' | null>(null);
  const [combatPhase, setCombatPhase] = useState<'idle' | 'player_lunge' | 'player_return' | 'enemy_lunge' | 'enemy_return'>('idle');
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  const logMessage = (message: string, type: CombatLogEntry['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setCombatLog(prev => [{ id, message, type }, ...prev].slice(0, 50));
  };

  const addDamageNumber = (value: number | string, x: number, y: number, color: string) => {
    const id = Date.now() + Math.random();
    setDamageNumbers(prev => [...prev, { id, value, x, y, color }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 1000);
  };

  const triggerShake = () => {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400); 
  };

  const triggerFlash = (color: 'red' | 'white') => {
      setFlashScreen(color);
      setTimeout(() => setFlashScreen(null), 300);
  };

  const selectCharacter = (classId: string) => {
      playSfx('ui');
      const charClass = CHARACTER_CLASSES.find(c => c.id === classId);
      if (!charClass) return;

      const startingWeapon = WEAPONS.find(w => w.id === charClass.startingWeaponId) || DEFAULT_WEAPON;

      const newPlayer: Player = {
          name: charClass.name,
          maxHp: charClass.baseHp,
          currentHp: charClass.baseHp,
          maxMp: charClass.baseMp,
          currentMp: charClass.baseMp,
          level: 1,
          xp: 0,
          maxXp: BASE_XP_REQ,
          gold: 0,
          element: charClass.element,
          unlockedAbilities: charClass.startingAbilities,
          iconName: charClass.iconName,
          classId: charClass.id,
          weapon: startingWeapon,
          winStreak: 0
      };

      setPlayer(newPlayer);
      setGameState('TOWN');
  };

  const startCombat = async (isBoss: boolean) => {
    playSfx('ui');
    setGameState('COMBAT');
    setCombatLog([]);
    setEnemy(null);
    setCombatPhase('idle');
    setCooldowns({}); 
    
    // Level scaling: Player level + some randomness + difficulty ramp based on streak
    const difficultyMod = Math.floor(player.winStreak / 3);
    const level = player.level + difficultyMod;
    
    const enemyData = await generateEnemy(level);
    
    if (isBoss) {
        enemyData.name = `BOSS: ${enemyData.name}`;
        enemyData.maxHp = Math.floor(enemyData.maxHp * 1.5);
        enemyData.currentHp = enemyData.maxHp;
        enemyData.xpReward = enemyData.xpReward * 2;
        enemyData.goldReward = enemyData.goldReward * 3;
        enemyData.isBoss = true;
    }

    setEnemy(enemyData);
    setIsPlayerTurn(true);
    logMessage(`Encountered ${enemyData.name}!`, 'system');
  };

  const calculateDamage = (attackerLevel: number, baseDamage: number, attackerElement: ElementType, defenderElement: ElementType, weaponDamage: number = 0) => {
    let multiplier = 1;
    let isCritical = false;
    
    const totalBase = baseDamage + weaponDamage;
    const rawDamage = totalBase + (attackerLevel * 2);

    if (TYPE_ADVANTAGE[attackerElement] === defenderElement) {
        multiplier = 1.5;
        isCritical = true;
    } else if (TYPE_ADVANTAGE[defenderElement] === attackerElement) {
        multiplier = 0.75;
    }

    const variance = (Math.random() * 0.2) + 0.9;
    const finalDamage = Math.floor(rawDamage * multiplier * variance);
    return { damage: finalDamage, isCritical, multiplier };
  };

  const handlePlayerAbility = async (ability: Ability) => {
    if (!enemy || !isPlayerTurn || activeEffect || combatPhase !== 'idle') return; 
    
    if (player.currentMp < ability.manaCost) {
        logMessage("Not enough Mana!", 'system');
        return;
    }

    if ((cooldowns[ability.id] || 0) > 0) {
        logMessage(`${ability.name} is on cooldown!`, 'system');
        return;
    }

    setPlayer(p => ({ ...p, currentMp: p.currentMp - ability.manaCost }));
    if (ability.cooldown > 0) {
        setCooldowns(prev => ({ ...prev, [ability.id]: ability.cooldown + 1 })); 
    }

    if (ability.heal) {
        setActiveEffect({ id: 'heal', type: 'heal', element: ability.element, source: 'player', target: 'player' });
        setTimeout(() => {
            const healAmount = ability.heal! + (player.level * 8);
            setPlayer(p => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + healAmount) }));
            addDamageNumber(`+${healAmount}`, 25, 50, '#4ade80');
            logMessage(`You healed for ${healAmount} HP.`, 'player-action');
            setActiveEffect(null);
            endPlayerTurn();
        }, 800);
        return;
    }

    setCombatPhase('player_lunge');

    setTimeout(() => {
        setActiveEffect({ id: 'atk-proj', type: 'projectile', element: ability.element, source: 'player', target: 'enemy' });
        
        const { damage, isCritical } = calculateDamage(player.level, ability.damage || 0, ability.element, enemy.element, player.weapon.damage);
        
        setTimeout(() => {
            setActiveEffect({ id: 'atk-impact', type: 'impact', element: ability.element, source: 'player', target: 'enemy' });
            setEnemy(e => e ? { ...e, currentHp: Math.max(0, e.currentHp - damage) } : null);
            addDamageNumber(damage, 75, 50, isCritical ? '#facc15' : '#fff');
            
            triggerShake();
            setCombatPhase('player_return'); 

            generateCombatFlavor(ability.name, "Player", enemy.name, damage, isCritical).then(flavor => {
                if (flavor) logMessage(flavor, 'player-action');
                else logMessage(`You hit for ${damage} damage using ${player.weapon.name}!`, 'player-action');
            });

            setTimeout(() => {
                setActiveEffect(null);
                setCombatPhase('idle');
                if (enemy.currentHp - damage <= 0) {
                    handleVictory();
                } else {
                    endPlayerTurn();
                }
            }, 500); 
        }, 400); 
    }, 300); 
  };

  const endPlayerTurn = () => {
    setIsPlayerTurn(false);
    setTimeout(enemyTurn, 1000);
  };

  const enemyTurn = () => {
    if (!enemy || gameState !== 'COMBAT') return;
    
    // Enemy Attack Logic
    let abilityToUse: Ability | undefined;
    
    // ... (Simplified Enemy AI: mostly standard attack unless PVP) ... 

    setCombatPhase('enemy_lunge');

    setTimeout(() => {
        const attackElement = abilityToUse ? abilityToUse.element : enemy.element;
        setActiveEffect({ id: 'enemy-proj', type: 'projectile', element: attackElement, source: 'enemy', target: 'player' });

        const baseEnemyDmg = 10 + (enemy.level * 2.5); // Slightly harder
        const { damage, isCritical } = calculateDamage(enemy.level, baseEnemyDmg, enemy.element, player.element);

        setTimeout(() => {
            setActiveEffect({ id: 'enemy-impact', type: 'impact', element: attackElement, source: 'enemy', target: 'player' });
            setPlayer(p => ({ ...p, currentHp: Math.max(0, p.currentHp - damage) }));
            addDamageNumber(damage, 25, 50, '#ef4444');
            triggerShake();
            triggerFlash('red');
            setCombatPhase('enemy_return');

            logMessage(`${enemy.name} attacked for ${damage} damage!`, 'enemy-action');

            setTimeout(() => {
                setActiveEffect(null);
                setCombatPhase('idle');
                if (player.currentHp - damage <= 0) {
                    setGameState('DEFEAT');
                    playSfx('defeat');
                } else {
                    // Mana regen
                    setPlayer(p => ({ ...p, currentMp: Math.min(p.maxMp, p.currentMp + 5) }));
                    startPlayerTurn();
                }
            }, 500);
        }, 400);
    }, 300);
  };

  const startPlayerTurn = () => {
      setCooldowns(prev => {
          const next = { ...prev };
          for (const key in next) {
              if (next[key] > 0) next[key] -= 1;
          }
          return next;
      });
      setIsPlayerTurn(true);
  };

  const handleVictory = () => {
    if (!enemy) return;
    playSfx('victory');
    setGameState('VICTORY');
    const xpGain = enemy.xpReward;
    const goldGain = enemy.goldReward;
    
    setPlayer(p => ({ ...p, gold: p.gold + goldGain, winStreak: p.winStreak + 1 }));
    logMessage(`Victory! Gained ${xpGain} XP and ${goldGain} Gold.`, 'system');
    
    // Boss Drops
    if (enemy.isBoss) {
         const betterWeapons = WEAPONS.filter(w => w.damage > player.weapon.damage || w.rarity !== 'common');
         if (betterWeapons.length > 0) {
             const rewardWeapon = betterWeapons[Math.floor(Math.random() * betterWeapons.length)];
             setPlayer(p => ({ ...p, weapon: rewardWeapon }));
             logMessage(`BOSS DROP: You obtained ${rewardWeapon.name}!`, 'system');
         }
    } 

    let newXp = player.xp + xpGain;
    let newLevel = player.level;
    let newMaxXp = player.maxXp;
    let leveledUp = false;

    while (newXp >= newMaxXp) {
        newLevel += 1;
        newXp = newXp - newMaxXp;
        newMaxXp = Math.floor(newMaxXp * XP_SCALING);
        leveledUp = true;
    }

    if (leveledUp) {
         setPlayer(p => ({
            ...p,
            level: newLevel,
            maxHp: p.maxHp + 30,
            currentHp: p.maxHp + 30, // Full heal on level up
            maxMp: p.maxMp + 15,
            currentMp: p.maxMp + 15,
            xp: newXp,
            maxXp: newMaxXp,
            unlockedAbilities: ABILITIES.filter(a => 
                (a.element === p.element || a.element === 'Physical') && a.unlockLevel <= newLevel
            ).map(a => a.id)
        }));
        logMessage(`LEVEL UP! You are now level ${newLevel}.`, 'system');
    } else {
        setPlayer(p => ({ ...p, xp: newXp }));
    }
  };

  const returnToTown = () => {
      playSfx('ui');
      setGameState('TOWN');
      setEnemy(null);
  }
  
  const handleRest = () => {
      playSfx('heal');
      setPlayer(p => ({ ...p, currentHp: p.maxHp, currentMp: p.maxMp }));
      logMessage("Restored HP and MP.", 'system');
  }

  const handleBuyWeapon = (weapon: Weapon) => {
      if (player.gold >= weapon.price) {
          playSfx('ui');
          setPlayer(p => ({ ...p, gold: p.gold - weapon.price, weapon: weapon }));
          alert(`Equipped ${weapon.name}!`);
      } else {
          alert("Not enough Gold!");
      }
  };

  const respawn = () => {
      setPlayer(p => ({
          ...p,
          currentHp: p.maxHp,
          currentMp: p.maxMp,
          gold: Math.floor(p.gold * 0.75), // Penalty
          winStreak: 0
      }));
      setEnemy(null);
      setCombatLog([]);
      setGameState('TOWN');
      playSfx('revive');
  }

  const copyCode = () => {
      navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  };
  
  // PVP functions
  const openPvPMenu = () => {
    if (!player.name) {
        alert("You must start a game and choose a character first!");
        return;
    }
    const code = encodePlayerToCode(player);
    setGeneratedCode(code);
    setGameState('PVP_MENU');
  };

  const startPvPCombat = () => {
      const pvpEnemy = decodeCodeToEnemy(pvpCodeInput);
      if (!pvpEnemy) {
          alert("Invalid Code!");
          return;
      }
      setGameState('COMBAT');
      setCombatLog([]);
      setEnemy(pvpEnemy);
      setCooldowns({});
      setIsPlayerTurn(true);
      setCombatPhase('idle');
      logMessage(`Duel started against ${pvpEnemy.name}!`, 'system');
  };

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [combatLog]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center overflow-hidden font-sans">
      <header className="w-full p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold fantasy-font bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Elemental Odyssey
            </h1>
            {player.name && (
                <div className="flex items-center gap-4">
                    <div className="text-yellow-400 font-mono font-bold flex items-center gap-1 text-xs md:text-sm border border-yellow-900/50 bg-yellow-900/20 px-2 py-1 rounded">
                         <Icons.Coins size={14} /> {player.gold}
                    </div>
                    <div className="text-xs md:text-sm font-mono text-yellow-500 flex items-center gap-1">
                        <Icons.Trophy size={14} /> Lvl {player.level}
                    </div>
                </div>
            )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 flex flex-col gap-6 relative">
        {gameState === 'MENU' && (
             <div className="flex-1 flex flex-col items-center justify-center text-center py-10 animate-float">
                <Icons.Sparkles size={64} className="text-blue-400 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                <h2 className="text-4xl md:text-6xl font-bold fantasy-font mb-4">Begin Your Journey</h2>
                <button 
                    onClick={() => setGameState('CHARACTER_SELECT')}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all hover:scale-105 flex items-center gap-2 group"
                >
                    <Icons.Play size={20} fill="currentColor" className="group-hover:translate-x-1 transition-transform" /> New Game
                </button>
             </div>
        )}

        {gameState === 'CHARACTER_SELECT' && (
            <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold fantasy-font mb-8 text-center">Choose Your Hero</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {CHARACTER_CLASSES.map((cls) => {
                        // @ts-ignore
                        const Icon = Icons[cls.iconName as keyof typeof Icons] || Icons.User;
                        // @ts-ignore
                        const borderColor = (ELEMENT_COLORS[cls.element] || "").split(' ')[1];
                        // @ts-ignore
                        const glowColor = (ELEMENT_COLORS[cls.element] || "").split(' ')[3];
                        // @ts-ignore
                        const textColor = (ELEMENT_COLORS[cls.element] || "").split(' ')[0];
                        const startWeapon = WEAPONS.find(w => w.id === cls.startingWeaponId);

                        return (
                            <div 
                                key={cls.id}
                                onClick={() => selectCharacter(cls.id)}
                                className={`bg-slate-900 border-2 ${borderColor} rounded-xl overflow-hidden cursor-pointer hover:shadow-xl ${glowColor} transition-all group p-6 flex flex-col items-center text-center`}
                            >
                                <div className={`w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${glowColor} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                    <Icon size={48} className={textColor} />
                                </div>
                                <h3 className="text-2xl font-bold fantasy-font mb-2 text-slate-100">{cls.name}</h3>
                                <p className="text-sm text-slate-400 mb-4">{cls.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* TOWN HUB (Replaces Map) */}
        {gameState === 'TOWN' && (
             <div className="flex-1 flex flex-col items-center justify-center animate-fade-in gap-6">
                 <div className="text-center">
                    <h2 className="text-4xl font-bold fantasy-font mb-2 text-white">The Hub</h2>
                    <p className="text-slate-400">Streak: <span className="text-yellow-400 font-bold">{player.winStreak} Wins</span></p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                     
                     {/* HUNT */}
                     <button 
                        onClick={() => startCombat(false)}
                        className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center gap-4 transition-all group hover:scale-[1.02] shadow-xl"
                     >
                         <div className="p-4 bg-red-900/30 rounded-full text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                             <Icons.Swords size={48} />
                         </div>
                         <div>
                             <h3 className="font-bold text-2xl mb-1">Hunt Monsters</h3>
                             <p className="text-sm text-slate-500">Find a random enemy. Level {player.level}</p>
                         </div>
                     </button>

                     {/* BOSS */}
                     <button 
                        onClick={() => startCombat(true)}
                        className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center gap-4 transition-all group hover:scale-[1.02] shadow-xl"
                     >
                         <div className="p-4 bg-purple-900/30 rounded-full text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                             <Icons.Skull size={48} />
                         </div>
                         <div>
                             <h3 className="font-bold text-2xl mb-1">Challange Boss</h3>
                             <p className="text-sm text-slate-500">Harder fight. Better Loot.</p>
                         </div>
                     </button>

                     {/* REST */}
                     <button 
                        onClick={handleRest}
                        className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-4 hover:border-emerald-500/50 transition-colors"
                     >
                         <div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-400"><Icons.TentTree /></div>
                         <div className="text-left">
                             <h4 className="font-bold">Rest & Heal</h4>
                             <p className="text-xs text-slate-500">Recover full HP/MP</p>
                         </div>
                     </button>

                     {/* SHOP */}
                     <button 
                        onClick={() => setGameState('SHOP')}
                        className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-4 hover:border-yellow-500/50 transition-colors"
                     >
                         <div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-400"><Icons.Anvil /></div>
                         <div className="text-left">
                             <h4 className="font-bold">Blacksmith</h4>
                             <p className="text-xs text-slate-500">Buy Equipment</p>
                         </div>
                     </button>
                     
                     {/* PVP */}
                     <button 
                        onClick={openPvPMenu}
                        className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-4 hover:border-blue-500/50 transition-colors col-span-1 md:col-span-2 justify-center"
                     >
                         <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400"><Icons.Swords /></div>
                         <div className="text-left">
                             <h4 className="font-bold">Enter PvP Arena</h4>
                         </div>
                     </button>
                 </div>
             </div>
        )}

        {/* SHOP */}
        {gameState === 'SHOP' && (
             <div className="flex-1 flex flex-col items-center animate-fade-in">
                 <div className="flex items-center gap-4 mb-6">
                     <button onClick={returnToTown} className="p-2 hover:bg-slate-800 rounded-full"><Icons.ArrowLeft /></button>
                     <h2 className="text-3xl font-bold fantasy-font">Blacksmith</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                     {WEAPONS.filter(w => w.price > 0 && w.damage > player.weapon.damage).map(weapon => (
                         <div key={weapon.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                             <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                 {/* @ts-ignore */}
                                 {React.createElement(Icons[weapon.icon] || Icons.Sword, { size: 24, className: 'text-slate-300' })}
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-slate-200">{weapon.name}</h4>
                                 <p className="text-xs text-slate-500">+{weapon.damage} DMG • {weapon.element}</p>
                             </div>
                             <button 
                                onClick={() => handleBuyWeapon(weapon)}
                                disabled={player.gold < weapon.price}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all
                                    ${player.gold >= weapon.price 
                                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-500' 
                                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
                                `}
                             >
                                 {player.gold >= weapon.price ? 'Buy' : 'Locked'} <br/> {weapon.price}g
                             </button>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {/* PVP MENU */}
        {gameState === 'PVP_MENU' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-4">
                 <button onClick={returnToTown} className="mb-4 text-slate-400 hover:text-white flex items-center gap-2"><Icons.ArrowLeft size={16}/> Back to Hub</button>
                <div className="relative bg-slate-900 p-1 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                    <div className="bg-slate-950 rounded-xl p-8 border border-slate-800 relative z-10">
                        <h2 className="text-3xl font-bold fantasy-font mb-6 text-center text-blue-400">Astral Arena</h2>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 mb-6">
                            <label className="block text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-2">Your Code</label>
                            <div className="flex gap-2">
                                <input readOnly value={generatedCode} className="bg-slate-950 border border-slate-800 rounded px-4 py-2 w-full text-xs font-mono text-slate-400"/>
                                <button onClick={copyCode} className="px-4 rounded-lg bg-slate-800 border border-slate-700 text-xs">Copy</button>
                            </div>
                        </div>
                        <div className="mb-8">
                            <label className="block text-[10px] uppercase font-bold text-red-400 tracking-widest mb-2">Enemy Code</label>
                            <textarea value={pvpCodeInput} onChange={(e) => setPvpCodeInput(e.target.value)} placeholder="Paste enemy code..." className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 w-full h-24 text-xs font-mono text-white resize-none"/>
                        </div>
                        <button onClick={startPvPCombat} disabled={!pvpCodeInput} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg disabled:opacity-50">FIGHT</button>
                    </div>
                </div>
            </div>
        )}

        {(gameState === 'COMBAT' || gameState === 'VICTORY' || gameState === 'DEFEAT') && (
            <>
                {(!enemy && gameState === 'COMBAT') ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                        <Icons.Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                        <h3 className="text-2xl font-bold fantasy-font text-slate-300">Summoning Foe...</h3>
                    </div>
                ) : (
                    <>
                    <BattleScene 
                        player={player} 
                        enemy={enemy} 
                        isPlayerTurn={isPlayerTurn} 
                        damageNumbers={damageNumbers}
                        activeEffect={activeEffect}
                        shakeScreen={shakeScreen}
                        flashScreen={flashScreen}
                        combatPhase={combatPhase}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm shadow-xl flex flex-col">
                            {/* Player Status / Ability Bar */}
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold flex items-center gap-2 text-slate-300">
                                    <Icons.BookOpen size={18} /> Abilities
                                </h3>
                                <span className="text-xs text-blue-400 font-mono">{Math.max(0, player.currentMp)} / {player.maxMp} MP</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {ABILITIES.map(ability => {
                                    const isUnlocked = player.unlockedAbilities.includes(ability.id);
                                    if (ability.element !== 'Physical' && ability.element !== player.element) return null;
                                    return (
                                        <AbilityCard 
                                            key={ability.id}
                                            ability={ability}
                                            isUnlocked={isUnlocked}
                                            cooldownRemaining={cooldowns[ability.id] || 0}
                                            disabled={!isPlayerTurn || gameState !== 'COMBAT' || !!activeEffect || combatPhase !== 'idle'}
                                            onClick={() => handlePlayerAbility(ability)}
                                        />
                                    );
                                })}
                            </div>

                            {/* END OF BATTLE ACTIONS */}
                            {gameState === 'VICTORY' && (
                                <div className="flex gap-2 mt-4">
                                    <button 
                                        onClick={returnToTown}
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Town
                                    </button>
                                    <button 
                                        onClick={() => startCombat(false)}
                                        className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 animate-bounce"
                                    >
                                        Next Battle <Icons.ChevronsRight size={16} />
                                    </button>
                                </div>
                            )}
                            {gameState === 'DEFEAT' && (
                                <button 
                                    onClick={respawn}
                                    className="w-full mt-4 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                    Respawn in Town (25% Gold Loss) <Icons.HeartPulse size={16} />
                                </button>
                            )}
                        </div>
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col h-48 md:h-auto backdrop-blur-sm shadow-xl">
                            <div ref={logRef} className="flex-1 overflow-y-auto flex flex-col-reverse gap-2 text-sm font-mono">
                                {combatLog.map((log) => (
                                    <div key={log.id} className={`p-2 rounded border-l-2 ${log.type === 'player-action' ? 'bg-blue-900/20 border-blue-500 text-blue-100' : log.type === 'enemy-action' ? 'bg-red-900/20 border-red-500 text-red-100' : 'border-slate-700 text-slate-400'}`}>
                                        {log.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default App;
