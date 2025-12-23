import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, Enemy, Ability, GameState, CombatLogEntry, DamageNumber, ElementType, VisualEffect, Weapon, P2PMessage 
} from './types';
import { 
  ABILITIES, TYPE_ADVANTAGE, CHARACTER_CLASSES, BASE_XP_REQ, XP_SCALING, WEAPONS, ELEMENT_COLORS, ELEMENT_BG_COLORS
} from './constants';
import { generateEnemy, generateCombatFlavor } from './services/geminiService';
import { encodePlayerToCode, decodeCodeToEnemy } from './services/pvpService';
import { playSfx } from './services/audioService';
import { BattleScene } from './components/BattleScene';
import { AbilityCard } from './components/AbilityCard';
import * as Icons from 'lucide-react';
// @ts-ignore
import { Peer } from 'peerjs';

const FallbackIcon: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
  <div className={`w-4 h-4 rounded-full bg-gray-500 ${className ?? ''}`} style={{ width: size, height: size }} />
);

const getIcon = (name: string): React.ElementType => {
  // Cast to any to avoid build errors if specific icon names change in library versions
  const icons = Icons as any;
  return icons[name] ?? icons.CircleHelp ?? icons.HelpCircle ?? icons.AlertCircle ?? FallbackIcon;
};

const DEFAULT_WEAPON = WEAPONS[0];
const SAVE_KEY = 'EO_SAVE_V5_FUSION'; // Updated save key
const FUSION_COST = 500;

// Replaced constant with a function to ensure fresh state on reset
const getInitialPlayer = (): Player => ({
    name: 'Hero',
    maxHp: 0, currentHp: 0,
    maxMp: 0, currentMp: 0,
    level: 1, xp: 0, maxXp: 0, gold: 0,
    element: 'Physical', unlockedAbilities: [], customAbilities: [],
    iconName: 'User', classId: '', weapon: DEFAULT_WEAPON,
    winStreak: 0, prestige: 0
});

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('CHARACTER_SELECT');
  const [player, setPlayer] = useState<Player>(getInitialPlayer());
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  // Wipe Guard to prevent autosave loop
  const isWiping = useRef(false);

  // PVP State (Offline)
  const [pvpCodeInput, setPvpCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // PVP State (Online/P2P)
  const [peer, setPeer] = useState<any>(null);
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [conn, setConn] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  // Fusion State
  const [fusionSlot1, setFusionSlot1] = useState<Ability | null>(null);
  const [fusionSlot2, setFusionSlot2] = useState<Ability | null>(null);

  // Combat State
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [activeEffect, setActiveEffect] = useState<VisualEffect | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [flashScreen, setFlashScreen] = useState<'red' | 'white' | null>(null);
  const [combatPhase, setCombatPhase] = useState<'idle' | 'player_lunge' | 'player_return' | 'enemy_lunge' | 'enemy_return'>('idle');
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // --- SAVE SYSTEM ---
  useEffect(() => {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
          try {
              const loadedPlayer = JSON.parse(saved);
              // Migration check for customAbilities
              if (!loadedPlayer.customAbilities) loadedPlayer.customAbilities = [];
              setPlayer(loadedPlayer);
              setGameState('TOWN');
          } catch(e) {
              setGameState('CHARACTER_SELECT');
          }
      } else {
          setGameState('CHARACTER_SELECT');
      }
  }, []);

  const saveGame = (p: Player) => {
      if (isWiping.current) return; // DO NOT SAVE IF WIPING
      localStorage.setItem(SAVE_KEY, JSON.stringify(p));
  };

  useEffect(() => {
      if (isWiping.current) return; // Guard
      if (player.classId && gameState !== 'CHARACTER_SELECT') {
          saveGame(player);
          // Trigger save indicator
          setShowSaveIndicator(true);
          const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
          return () => clearTimeout(timer);
      }
  }, [player, gameState]);

  // --- WIPE SYSTEM ---
  const handleWipeSave = () => {
      const confirmed = window.confirm("⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to WIPE your save?\n\nThis will delete:\n- Level & XP\n- Gold & Items\n- Prestige & Fused Spells\n\nThis cannot be undone.");
      if (confirmed) {
          const doubleCheck = window.confirm("Final check: Delete everything and start over?");
          if (doubleCheck) {
              isWiping.current = true; // Engage Guard
              localStorage.removeItem(SAVE_KEY);
              // Force reload to ensure memory is completely clean
              window.location.reload(); 
          }
      }
  };

  // --- ONLINE P2P SYSTEM ---
  
  // Initialize Peer
  useEffect(() => {
    if (gameState === 'ONLINE_LOBBY' && !peer) {
        const newPeer = new Peer();
        newPeer.on('open', (id: string) => {
            setMyPeerId(id);
            setConnectionStatus("Ready to connect");
        });

        newPeer.on('connection', (connection: any) => {
            setConn(connection);
            setupConnection(connection);
        });

        setPeer(newPeer);
    }
    
    // Cleanup on exit
    if (gameState !== 'ONLINE_LOBBY' && gameState !== 'COMBAT' && peer) {
       peer.destroy();
       setPeer(null);
       setConn(null);
       setIsOnline(false);
    }
  }, [gameState]);

  const connectToPeer = () => {
      if (!peer || !remotePeerId) return;
      setConnectionStatus("Connecting...");
      const connection = peer.connect(remotePeerId);
      setConn(connection);
      setupConnection(connection);
  };

  const setupConnection = (connection: any) => {
      connection.on('open', () => {
          setConnectionStatus("Connected!");
          setIsOnline(true);
          // Send Handshake with my stats
          const handshake: P2PMessage = {
              type: 'HANDSHAKE',
              payload: { player }
          };
          connection.send(handshake);
      });

      connection.on('data', (data: P2PMessage) => {
          handleP2PData(data);
      });

      connection.on('close', () => {
          alert("Opponent disconnected.");
          setGameState('TOWN');
          setIsOnline(false);
          setConn(null);
      });
  };

  const handleP2PData = (data: P2PMessage) => {
      if (data.type === 'HANDSHAKE') {
          const opponent = data.payload.player;
          // Convert opponent player to Enemy type for battle engine
          const pvpEnemy: Enemy = {
              name: opponent.name,
              maxHp: opponent.maxHp,
              currentHp: opponent.currentHp,
              maxMp: opponent.maxMp,
              currentMp: opponent.currentMp,
              level: opponent.level,
              element: opponent.element,
              iconName: opponent.iconName,
              description: `A rival player (Prestige ${opponent.prestige})`,
              xpReward: 0, goldReward: 0,
              isPvP: true,
              isBoss: false
          };
          setEnemy(pvpEnemy);
          setGameState('COMBAT');
          setCombatLog([]);
      }
      
      if (data.type === 'ATTACK') {
          const { abilityName, damage, heal, isCritical, element } = data.payload;
          
          // Show Enemy Attack Visuals
          logMessage(`Opponent used ${abilityName}!`, 'enemy-action');
          
          if (heal > 0) {
              setEnemy(e => e ? ({ ...e, currentHp: Math.min(e.maxHp, e.currentHp + heal) }) : null);
              setActiveEffect({ id: `heal-${Date.now()}`, type: 'heal', element: element, source: 'enemy', target: 'enemy' });
          } else {
              // Apply damage to ME
               setCombatPhase('enemy_lunge');
               setTimeout(() => {
                   setActiveEffect({ id: `atk-${Date.now()}`, type: 'projectile', element: element, source: 'enemy', target: 'player' });
                   setTimeout(() => {
                       setActiveEffect({ id: `imp-${Date.now()}`, type: 'impact', element: element, source: 'enemy', target: 'player' });
                       setPlayer(p => ({ ...p, currentHp: Math.max(0, p.currentHp - damage) }));
                       addDamageNumber(damage, 25, 50, '#ef4444');
                       triggerShake();
                       triggerFlash('red');
                       setCombatPhase('enemy_return');
                       setTimeout(() => {
                           setCombatPhase('idle');
                           setActiveEffect(null);
                           setIsPlayerTurn(true); // MY TURN NOW
                           
                           if (player.currentHp - damage <= 0) {
                               // I lost
                               setGameState('DEFEAT');
                               if (conn) conn.send({ type: 'VICTORY' });
                           }
                       }, 500);
                   }, 400);
               }, 300);
          }
      }

      if (data.type === 'VICTORY') {
           setGameState('VICTORY');
           logMessage("Opponent surrendered or was defeated!", 'system');
      }
  };


  // --- COMBAT LOGIC ---

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
      
      const prestigeMult = 1 + (player.prestige * 0.2); 

      const newPlayer: Player = {
          ...player,
          name: player.name || 'Hero', // Default name if empty
          maxHp: Math.floor(charClass.baseHp * prestigeMult),
          currentHp: Math.floor(charClass.baseHp * prestigeMult),
          maxMp: Math.floor(charClass.baseMp * prestigeMult),
          currentMp: Math.floor(charClass.baseMp * prestigeMult),
          level: 1,
          xp: 0,
          maxXp: BASE_XP_REQ,
          element: charClass.element,
          unlockedAbilities: charClass.startingAbilities,
          customAbilities: player.customAbilities || [], // Persist fused abilities unless wiped
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
    setIsOnline(false); // Reset online flag for local combat
    
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

    // HEAL LOGIC
    if (ability.heal) {
        setActiveEffect({ id: 'heal', type: 'heal', element: ability.element, source: 'player', target: 'player' });
        
        const healAmount = ability.heal! + (player.level * 8);
        
        if (isOnline && conn) {
            // Send Heal info to opponent
            const attackData: P2PMessage = {
                type: 'ATTACK',
                payload: {
                    abilityName: ability.name,
                    damage: 0,
                    heal: healAmount,
                    isCritical: false,
                    element: ability.element
                }
            };
            conn.send(attackData);
            setIsPlayerTurn(false); // End turn in online
        }

        setTimeout(() => {
            setPlayer(p => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + healAmount) }));
            addDamageNumber(`+${healAmount}`, 25, 50, '#4ade80');
            logMessage(`You healed for ${healAmount} HP.`, 'player-action');
            setActiveEffect(null);
            
            if (!isOnline) endPlayerTurn(); // Local turn end
        }, 800);
        return;
    }

    // ATTACK LOGIC
    setCombatPhase('player_lunge');

    setTimeout(() => {
        setActiveEffect({ id: 'atk-proj', type: 'projectile', element: ability.element, source: 'player', target: 'enemy' });
        
        const { damage, isCritical } = calculateDamage(player.level, ability.damage || 0, ability.element, enemy.element, player.weapon.damage);
        
        setTimeout(() => {
            setActiveEffect({ id: 'atk-impact', type: 'impact', element: ability.element, source: 'player', target: 'enemy' });
            
            // Apply damage locally to enemy visual
            setEnemy(e => e ? { ...e, currentHp: Math.max(0, e.currentHp - damage) } : null);
            addDamageNumber(damage, 75, 50, isCritical ? '#facc15' : '#fff');
            
            triggerShake();
            setCombatPhase('player_return'); 

            generateCombatFlavor(ability.name, "Player", enemy.name, damage, isCritical).then(flavor => {
                if (flavor) logMessage(flavor, 'player-action');
                else logMessage(`You hit for ${damage} damage using ${player.weapon.name}!`, 'player-action');
            });

            // ONLINE SEND
            if (isOnline && conn) {
                const attackData: P2PMessage = {
                    type: 'ATTACK',
                    payload: {
                        abilityName: ability.name,
                        damage: damage,
                        heal: 0,
                        isCritical: isCritical,
                        element: ability.element
                    }
                };
                conn.send(attackData);
                // In online, we don't automatically trigger 'enemyTurn'. We wait for data.
            }

            setTimeout(() => {
                setActiveEffect(null);
                setCombatPhase('idle');
                
                if (isOnline) {
                     setIsPlayerTurn(false); // Pass turn
                     if (enemy.currentHp - damage <= 0) {
                         // Win handling
                         handleVictory();
                     }
                } else {
                    if (enemy.currentHp - damage <= 0) {
                        handleVictory();
                    } else {
                        endPlayerTurn();
                    }
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
    if (!enemy || gameState !== 'COMBAT' || isOnline) return; // Disable local AI if online
    
    // Enemy Attack Logic
    setCombatPhase('enemy_lunge');

    setTimeout(() => {
        setActiveEffect({ id: 'enemy-proj', type: 'projectile', element: enemy.element, source: 'enemy', target: 'player' });

        const baseEnemyDmg = 10 + (enemy.level * 2.5); // Slightly harder
        const { damage, isCritical } = calculateDamage(enemy.level, baseEnemyDmg, enemy.element, player.element);

        setTimeout(() => {
            setActiveEffect({ id: 'enemy-impact', type: 'impact', element: enemy.element, source: 'enemy', target: 'player' });
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
    
    // Minimal rewards for PvP to prevent abuse
    const xpGain = isOnline ? 0 : enemy.xpReward;
    const goldGain = isOnline ? 0 : enemy.goldReward;
    
    if (isOnline) {
        logMessage("PvP Victory! Glory is its own reward.", 'system');
    } else {
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
             const prestigeMult = 1 + (player.prestige * 0.2);
             
             setPlayer(p => {
                 // ACCUMULATE ABILITIES: Keep old ones, add new ones if level matches
                 const newAbilities = ABILITIES.filter(a => 
                    (a.element === p.element || a.element === 'Physical') && a.unlockLevel <= newLevel
                 ).map(a => a.id);
                 
                 const combinedAbilities = Array.from(new Set([...p.unlockedAbilities, ...newAbilities]));
    
                 return {
                    ...p,
                    level: newLevel,
                    maxHp: Math.floor(p.maxHp + (30 * prestigeMult)),
                    currentHp: Math.floor(p.maxHp + (30 * prestigeMult)), // Full heal on level up
                    maxMp: Math.floor(p.maxMp + (15 * prestigeMult)),
                    currentMp: Math.floor(p.maxMp + (15 * prestigeMult)),
                    xp: newXp,
                    maxXp: newMaxXp,
                    unlockedAbilities: combinedAbilities
                };
            });
            logMessage(`LEVEL UP! You are now level ${newLevel}.`, 'system');
        } else {
            setPlayer(p => ({ ...p, xp: newXp }));
        }
    }
  };

  const handleElementChange = (newElement: ElementType) => {
      playSfx('revive');
      
      // Find the "Level 1" ability for this new element so the player has something to use
      const starterAbility = ABILITIES.find(a => a.element === newElement && a.unlockLevel === 1);
      
      setPlayer(p => {
          const newAbilities = [...p.unlockedAbilities];
          if (starterAbility && !newAbilities.includes(starterAbility.id)) {
              newAbilities.push(starterAbility.id);
          }
          
          return {
              ...p,
              element: newElement,
              unlockedAbilities: newAbilities,
              currentHp: p.maxHp, // Full heal as bonus
              currentMp: p.maxMp
          };
      });
      setGameState('TOWN');
  };

  const returnToTown = () => {
      playSfx('ui');
      setGameState('TOWN');
      setEnemy(null);
      setFusionSlot1(null);
      setFusionSlot2(null);
      setIsOnline(false);
      if (peer) {
          peer.destroy();
          setPeer(null);
      }
  }
  
  const handleRest = () => {
      playSfx('heal');
      setPlayer(p => ({ ...p, currentHp: p.maxHp, currentMp: p.maxMp }));
      alert("Restored HP and MP.");
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

  const handlePrestige = () => {
      if (player.level < 20) {
          alert("You must be level 20 to Ascend.");
          return;
      }
      if (!confirm("Are you sure? This will reset your Level to 1, but you will keep your Gold and gain a PERMANENT STAT BOOST.")) return;
      
      playSfx('revive');
      setPlayer(p => ({
          ...p,
          level: 1,
          prestige: p.prestige + 1,
          xp: 0,
          maxXp: BASE_XP_REQ,
      }));
      setGameState('CHARACTER_SELECT');
  };
  
  const handleFusion = () => {
      if (!fusionSlot1 || !fusionSlot2) return;
      if (player.gold < FUSION_COST) {
          alert("Not enough Gold!");
          return;
      }
      
      playSfx('revive'); // Sound like an upgrade
      
      // 1. Calculate New Stats
      const combinedDmg = (fusionSlot1.damage || 0) + (fusionSlot2.damage || 0);
      const combinedHeal = (fusionSlot1.heal || 0) + (fusionSlot2.heal || 0);
      const combinedMana = Math.floor((fusionSlot1.manaCost + fusionSlot2.manaCost) * 0.9);
      const cooldown = Math.max(fusionSlot1.cooldown, fusionSlot2.cooldown);
      
      // 2. Determine Name
      const prefix = fusionSlot1.name.split(" ")[0]; // First word of first
      const suffix = fusionSlot2.name.split(" ").pop(); // Last word of second
      let newName = `${prefix} ${suffix}`;
      if (prefix === suffix) newName = `Double ${prefix}`;
      
      // 3. Create Ability Object
      const newAbility: Ability = {
          id: `custom_${Date.now()}`,
          name: newName,
          description: `Fused power of ${fusionSlot1.name} and ${fusionSlot2.name}.`,
          element: fusionSlot1.element, // Inherit from primary
          manaCost: combinedMana,
          damage: Math.floor(combinedDmg * 1.1), // 10% Bonus
          heal: Math.floor(combinedHeal * 1.1),
          cooldown: cooldown,
          unlockLevel: 1, // Always available once fused
          icon: fusionSlot1.icon, // Inherit Icon
          isCustom: true
      };
      
      setPlayer(p => ({
          ...p,
          gold: p.gold - FUSION_COST,
          customAbilities: [...p.customAbilities, newAbility],
          unlockedAbilities: [...p.unlockedAbilities, newAbility.id]
      }));
      
      alert(`FUSION SUCCESSFUL! Created ${newAbility.name}!`);
      setFusionSlot1(null);
      setFusionSlot2(null);
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

  const copyPeerId = () => {
      navigator.clipboard.writeText(myPeerId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  }
  
  // Helper to get ALL relevant abilities (Locked AND Unlocked)
  const getAllRelevantAbilities = () => {
      // 1. Get all base abilities that match the player's current element, physical, OR are already unlocked (from previous classes)
      const relevantBaseAbilities = ABILITIES.filter(a => 
          a.element === 'Physical' || 
          a.element === player.element ||
          player.unlockedAbilities.includes(a.id)
      );

      // 2. Combine with custom abilities
      const allAbilities = [...relevantBaseAbilities, ...player.customAbilities];

      // 3. Remove duplicates (in case a custom ability somehow clashes, though unlikely due to ID gen)
      //    and Sort by Unlock Level then Name
      const uniqueAbilities = Array.from(new Map(allAbilities.map(a => [a.id, a])).values());
      
      return uniqueAbilities.sort((a, b) => {
          if (a.unlockLevel !== b.unlockLevel) return a.unlockLevel - b.unlockLevel;
          return a.name.localeCompare(b.name);
      });
  };

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [combatLog]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center overflow-hidden font-sans">
      <header className="w-full p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold fantasy-font bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer" onClick={() => setGameState('TOWN')}>
                    Elemental Odyssey
                </h1>
                {showSaveIndicator && (
                    <span className="text-[10px] text-emerald-500 font-mono border border-emerald-900/50 bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <Icons.Save size={10} /> Saved
                    </span>
                )}
            </div>
            {player.classId && (
                <div className="flex items-center gap-4">
                     <div className="flex flex-col items-end leading-none">
                         <span className="text-xs font-bold text-slate-300">{player.name}</span>
                         <span className="text-[10px] text-purple-400">Prestige {player.prestige}</span>
                     </div>
                    <div className="text-yellow-400 font-mono font-bold flex items-center gap-1 text-xs md:text-sm border border-yellow-900/50 bg-yellow-900/20 px-2 py-1 rounded">
                         <Icons.Coins size={14} /> {player.gold}
                    </div>
                </div>
            )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 flex flex-col gap-6 relative">
        
        {/* CHARACTER SELECT */}
        {gameState === 'CHARACTER_SELECT' && (
            <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold fantasy-font mb-2 text-center text-white">Choose Your Destiny</h2>
                <div className="mb-6 w-full max-w-sm">
                   <label className="text-xs text-slate-500 uppercase font-bold">Hero Name</label>
                   <input 
                      value={player.name} 
                      onChange={e => setPlayer(p => ({...p, name: e.target.value}))}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-center text-white focus:border-blue-500 outline-none"
                      placeholder="Enter Name"
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {CHARACTER_CLASSES.map((cls) => {
                        const Icon = getIcon(cls.iconName);
                        // @ts-ignore
                        const borderColor = (ELEMENT_COLORS[cls.element] || "").split(' ')[1];
                        // @ts-ignore
                        const glowColor = (ELEMENT_COLORS[cls.element] || "").split(' ')[3];
                        // @ts-ignore
                        const textColor = (ELEMENT_COLORS[cls.element] || "").split(' ')[0];
                        
                        const isLocked = cls.requiredPrestige > player.prestige;
                        const isGodly = cls.requiredPrestige > 0;

                        return (
                            <div 
                                key={cls.id}
                                onClick={() => !isLocked && selectCharacter(cls.id)}
                                className={`
                                    relative bg-slate-900 border-2 rounded-xl overflow-hidden transition-all group p-6 flex flex-col items-center text-center
                                    ${isLocked 
                                        ? 'opacity-50 border-slate-800 grayscale cursor-not-allowed' 
                                        : `cursor-pointer hover:shadow-xl hover:scale-105 ${borderColor} ${glowColor}`}
                                    ${isGodly && !isLocked ? 'prestige-border' : ''}
                                `}
                            >
                                <div className={`relative z-10 w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 transition-transform ${glowColor} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                    <Icon size={48} className={textColor} />
                                </div>
                                <h3 className={`relative z-10 text-2xl font-bold fantasy-font mb-2 ${isGodly ? 'text-yellow-200' : 'text-slate-100'}`}>{cls.name}</h3>
                                <p className="relative z-10 text-sm text-slate-400 mb-4">{cls.description}</p>
                                
                                {isLocked && (
                                    <div className="absolute inset-0 z-20 bg-slate-950/80 flex items-center justify-center flex-col">
                                        <Icons.Lock size={32} className="text-slate-500 mb-2"/>
                                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Requires Prestige {cls.requiredPrestige}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* TOWN HUB */}
        {gameState === 'TOWN' && (
             <div className="flex-1 flex flex-col items-center justify-center animate-fade-in gap-6">
                 <div className="text-center relative">
                    <h2 className="text-4xl font-bold fantasy-font mb-2 text-white">The Hub</h2>
                    
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-slate-400">Current Level <span className="text-blue-400 font-bold text-xl">{player.level}</span></p>
                        {/* XP BAR */}
                        <div className="w-48 h-2 bg-slate-800 rounded-full border border-slate-700 overflow-hidden relative group">
                             <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (player.xp / player.maxXp) * 100)}%` }}></div>
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                 <span className="text-[8px] font-mono text-white">{Math.floor(player.xp)} / {Math.floor(player.maxXp)} XP</span>
                             </div>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2">
                         <span className={`px-2 py-0.5 rounded border border-white/20 text-xs font-bold ${ELEMENT_BG_COLORS[player.element]} text-white`}>{player.element}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                     <button onClick={() => startCombat(false)} className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center gap-4 transition-all group hover:scale-[1.02] shadow-xl relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="p-4 bg-red-900/30 rounded-full text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors relative z-10">
                             <Icons.Swords size={48} />
                         </div>
                         <div className="relative z-10">
                             <h3 className="font-bold text-2xl mb-1">Hunt Monsters</h3>
                             <p className="text-sm text-slate-500">Find a random enemy.</p>
                         </div>
                     </button>

                     <button onClick={() => startCombat(true)} className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center gap-4 transition-all group hover:scale-[1.02] shadow-xl relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="p-4 bg-purple-900/30 rounded-full text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors relative z-10">
                             <Icons.Skull size={48} />
                         </div>
                         <div className="relative z-10">
                             <h3 className="font-bold text-2xl mb-1">Challenge Boss</h3>
                             <p className="text-sm text-slate-500">Harder fight. Better Loot.</p>
                         </div>
                     </button>

                     <button onClick={handleRest} className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
                         <div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-400"><Icons.TentTree /></div>
                         <div className="text-left">
                             <h4 className="font-bold">Rest & Heal</h4>
                             <p className="text-xs text-slate-500">Recover full HP/MP</p>
                         </div>
                     </button>

                     <button onClick={() => setGameState('SHOP')} className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-4 hover:border-yellow-500/50 transition-colors">
                         <div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-400"><Icons.Anvil /></div>
                         <div className="text-left">
                             <h4 className="font-bold">Blacksmith</h4>
                             <p className="text-xs text-slate-500">Buy Equipment</p>
                         </div>
                     </button>

                     {/* FUSION BUTTON */}
                     <button onClick={() => setGameState('FUSION')} className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-4 hover:border-pink-500/50 transition-colors col-span-1 md:col-span-2">
                         <div className="p-2 bg-pink-900/20 rounded-lg text-pink-400"><Icons.Atom /></div>
                         <div className="text-left flex-1">
                             <h4 className="font-bold text-pink-300">Altar of Fusion</h4>
                             <p className="text-xs text-slate-500">Combine abilities to create new power.</p>
                         </div>
                     </button>
                     
                     <button 
                        onClick={handlePrestige}
                        disabled={player.level < 20}
                        className={`col-span-1 md:col-span-2 p-6 rounded-xl flex items-center justify-center gap-4 transition-all relative overflow-hidden group ${player.level >= 20 ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border border-purple-500 cursor-pointer hover:scale-[1.02] shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-slate-900 border border-slate-800 opacity-50 cursor-not-allowed'}`}
                     >
                         {player.level >= 20 && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}
                         <div className={`p-2 rounded-lg ${player.level >= 20 ? 'text-yellow-300' : 'text-slate-600'}`}>
                             <Icons.Crown size={24} />
                         </div>
                         <div className="text-center relative z-10">
                             <h4 className={`font-bold ${player.level >= 20 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500' : 'text-slate-500'}`}>
                                ASCEND (Prestige)
                             </h4>
                             <p className="text-xs text-slate-400">Requires Level 20. Resets Level, boosts Stats.</p>
                         </div>
                     </button>

                     <button onClick={openPvPMenu} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4 hover:border-blue-500/50 transition-colors col-span-1 md:col-span-2 justify-center">
                         <div className="text-blue-500 font-bold flex gap-2 items-center text-sm"><Icons.Swords size={16}/> ENTER OFFLINE ARENA</div>
                     </button>

                    {/* REAL TIME PVP BUTTON */}
                     <button onClick={() => setGameState('ONLINE_LOBBY')} className="p-4 bg-indigo-950 border border-indigo-700 rounded-xl flex items-center gap-4 hover:border-indigo-400 transition-colors col-span-1 md:col-span-2 justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                         <div className="text-indigo-400 font-bold flex gap-2 items-center text-sm animate-pulse"><Icons.Globe size={16}/> ENTER ONLINE PVP LOBBY</div>
                     </button>

                     {/* WIPE SAVE BUTTON */}
                     <button onClick={handleWipeSave} className="p-4 bg-slate-950/50 border border-red-900/50 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/20 hover:border-red-600 transition-colors col-span-1 md:col-span-2 mt-4 group">
                         <Icons.Trash2 size={16} className="text-red-700 group-hover:text-red-500" />
                         <span className="text-xs font-bold text-red-800 group-hover:text-red-500 uppercase tracking-widest">Wipe Save Data</span>
                     </button>
                 </div>
             </div>
        )}

        {/* ELEMENT EVOLUTION SELECT */}
        {gameState === 'ELEMENT_CHANGE' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                 <h2 className="text-3xl md:text-5xl font-bold fantasy-font mb-4 text-center bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">Elemental Evolution</h2>
                 <p className="text-slate-400 mb-8 text-center max-w-lg">
                    You have reached a milestone (Level {player.level}). You may now change your affinity. 
                    You will <strong>keep your current abilities</strong>, but future growth will align with your new element.
                 </p>

                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                     {Object.keys(ELEMENT_COLORS).filter(e => e !== 'Physical').map((elem) => {
                         const element = elem as ElementType;
                         // @ts-ignore
                         const colorClass = ELEMENT_COLORS[element];
                         // @ts-ignore
                         const bgClass = ELEMENT_BG_COLORS[element];
                         
                         const isCurrent = player.element === element;

                         return (
                             <button 
                                key={element} 
                                onClick={() => handleElementChange(element)}
                                className={`
                                    relative p-4 rounded-xl border-2 transition-all duration-300 group
                                    ${isCurrent ? 'border-white bg-slate-800 scale-105 shadow-2xl' : `border-slate-800 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800`}
                                `}
                             >
                                 <div className={`text-center font-bold ${isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                     {element}
                                 </div>
                                 <div className={`mt-2 h-1 w-full rounded-full ${bgClass} opacity-50`}></div>
                                 {isCurrent && <div className="absolute top-2 right-2 text-xs text-green-400 font-mono">[CURRENT]</div>}
                             </button>
                         )
                     })}
                 </div>
                 <button onClick={() => setGameState('TOWN')} className="mt-8 text-slate-500 hover:text-white underline">Keep Current Element</button>
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
                     {WEAPONS.filter(w => w.price > 0 && w.damage > player.weapon.damage).map(weapon => {
                        const WeaponIcon = getIcon(weapon.icon);
                        const isGodly = weapon.rarity === 'godly';
                        return (
                         <div key={weapon.id} className={`bg-slate-900 p-4 rounded-xl border ${isGodly ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-slate-700'} flex items-center gap-4`}>
                             <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                 <WeaponIcon size={24} className={isGodly ? "text-yellow-400" : "text-slate-300"} />
                             </div>
                             <div className="flex-1">
                                 <h4 className={`font-bold ${isGodly ? "text-yellow-200" : "text-slate-200"}`}>{weapon.name}</h4>
                                 <p className="text-xs text-slate-500">+{weapon.damage} DMG • {weapon.element}</p>
                             </div>
                             <button onClick={() => handleBuyWeapon(weapon)} disabled={player.gold < weapon.price} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center ${player.gold >= weapon.price ? 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-500' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`}>
                                 <span>{player.gold >= weapon.price ? 'Buy' : 'Locked'}</span> 
                                 <span>{weapon.price}g</span>
                             </button>
                         </div>
                        );
                     })}
                 </div>
             </div>
        )}

        {/* FUSION UI */}
        {gameState === 'FUSION' && (
            <div className="flex-1 flex flex-col items-center animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                     <button onClick={returnToTown} className="p-2 hover:bg-slate-800 rounded-full"><Icons.ArrowLeft /></button>
                     <h2 className="text-3xl font-bold fantasy-font text-pink-300">Altar of Fusion</h2>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                     {/* SLOT 1 */}
                     <div className={`w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center p-2 text-center cursor-pointer transition-colors ${fusionSlot1 ? 'border-pink-500 bg-pink-900/20' : 'border-slate-700 hover:border-slate-500'}`} onClick={() => setFusionSlot1(null)}>
                         {fusionSlot1 ? (
                             <div>
                                 <div className="font-bold text-xs">{fusionSlot1.name}</div>
                                 <div className="text-[10px] text-slate-400 mt-1">{fusionSlot1.element}</div>
                             </div>
                         ) : <span className="text-slate-600 text-xs">Select Ability 1</span>}
                     </div>

                     <Icons.Plus className="text-slate-500" />

                     {/* SLOT 2 */}
                     <div className={`w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center p-2 text-center cursor-pointer transition-colors ${fusionSlot2 ? 'border-pink-500 bg-pink-900/20' : 'border-slate-700 hover:border-slate-500'}`} onClick={() => setFusionSlot2(null)}>
                         {fusionSlot2 ? (
                             <div>
                                 <div className="font-bold text-xs">{fusionSlot2.name}</div>
                                 <div className="text-[10px] text-slate-400 mt-1">{fusionSlot2.element}</div>
                             </div>
                         ) : <span className="text-slate-600 text-xs">Select Ability 2</span>}
                     </div>
                </div>

                <div className="mb-6">
                    <button 
                        onClick={handleFusion}
                        disabled={!fusionSlot1 || !fusionSlot2 || player.gold < FUSION_COST}
                        className={`
                            px-8 py-3 rounded-xl font-bold text-lg shadow-xl transition-all
                            ${(!fusionSlot1 || !fusionSlot2 || player.gold < FUSION_COST)
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:scale-105 animate-pulse'
                            }
                        `}
                    >
                        {(!fusionSlot1 || !fusionSlot2) ? 'Select Abilities' : `FUSE (${FUSION_COST}g)`}
                    </button>
                </div>

                <div className="w-full max-w-2xl">
                    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Available Abilities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                         {getAllRelevantAbilities().map(ab => (
                             <div 
                                key={ab.id} 
                                onClick={() => {
                                    if (!player.unlockedAbilities.includes(ab.id)) return;
                                    if (!fusionSlot1) setFusionSlot1(ab);
                                    else if (!fusionSlot2 && fusionSlot1.id !== ab.id) setFusionSlot2(ab);
                                }}
                                className={`
                                    ${player.unlockedAbilities.includes(ab.id) ? 'cursor-pointer hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'}
                                    ${(fusionSlot1?.id === ab.id || fusionSlot2?.id === ab.id) ? 'grayscale opacity-40 pointer-events-none' : ''}
                                `}
                             >
                                 <AbilityCard ability={ab} isUnlocked={player.unlockedAbilities.includes(ab.id)} disabled={!player.unlockedAbilities.includes(ab.id)} />
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        )}

        {/* ONLINE LOBBY */}
        {gameState === 'ONLINE_LOBBY' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-4 text-center">
                 <button onClick={returnToTown} className="mb-4 text-slate-400 hover:text-white flex items-center gap-2"><Icons.ArrowLeft size={16}/> Back to Hub</button>
                 
                 <div className="bg-indigo-950/50 border border-indigo-500/30 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(79,70,229,0.15)]">
                     <h2 className="text-3xl font-bold fantasy-font mb-2 text-indigo-300">Online PvP Lobby</h2>
                     <p className="text-xs text-indigo-200/50 mb-6">Peer-to-Peer Real Time Battle</p>
                     
                     <div className="bg-black/40 rounded-xl p-4 mb-6">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                         <div className={`font-mono text-sm ${connectionStatus === 'Connected!' ? 'text-green-400' : 'text-yellow-400'}`}>{connectionStatus}</div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* HOST */}
                         <div className="flex flex-col gap-2">
                             <div className="text-sm font-bold text-indigo-200">HOST GAME</div>
                             <div className="bg-slate-900 border border-slate-700 p-2 rounded flex items-center gap-2">
                                 <input readOnly value={myPeerId || "Initializing..."} className="bg-transparent w-full text-xs font-mono text-slate-400 outline-none" />
                                 <button onClick={copyPeerId} className="p-1 hover:bg-slate-700 rounded text-slate-300"><Icons.Copy size={14}/></button>
                             </div>
                             <p className="text-[10px] text-slate-500 text-left">Share this ID with your friend so they can join you.</p>
                         </div>

                         {/* JOIN */}
                         <div className="flex flex-col gap-2">
                             <div className="text-sm font-bold text-indigo-200">JOIN GAME</div>
                             <div className="flex gap-2">
                                 <input 
                                    value={remotePeerId} 
                                    onChange={(e) => setRemotePeerId(e.target.value)}
                                    placeholder="Enter Host ID" 
                                    className="bg-slate-900 border border-slate-700 p-2 rounded w-full text-xs font-mono text-white outline-none focus:border-indigo-500" 
                                 />
                             </div>
                             <button onClick={connectToPeer} disabled={!remotePeerId || !peer} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors disabled:opacity-50">
                                 CONNECT & FIGHT
                             </button>
                         </div>
                     </div>
                 </div>
            </div>
        )}

        {/* OFFLINE PVP MENU */}
        {gameState === 'PVP_MENU' && (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-4">
                 <button onClick={returnToTown} className="mb-4 text-slate-400 hover:text-white flex items-center gap-2"><Icons.ArrowLeft size={16}/> Back to Hub</button>
                <div className="relative bg-slate-900 p-1 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                    <div className="bg-slate-950 rounded-xl p-8 border border-slate-800 relative z-10">
                        <h2 className="text-3xl font-bold fantasy-font mb-6 text-center text-blue-400">Offline Arena</h2>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 mb-6">
                            <label className="block text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-2">Your Battle Token</label>
                            <div className="flex gap-2">
                                <input readOnly value={generatedCode} className="bg-slate-950 border border-slate-800 rounded px-4 py-2 w-full text-xs font-mono text-slate-400 truncate"/>
                                <button onClick={copyCode} className="px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0">
                                    {copySuccess ? "Copied!" : "Copy Token"}
                                </button>
                            </div>
                        </div>
                        <div className="mb-8">
                            <label className="block text-[10px] uppercase font-bold text-red-400 tracking-widest mb-2">Challenger Token</label>
                            <textarea value={pvpCodeInput} onChange={(e) => setPvpCodeInput(e.target.value)} placeholder="Paste opponent's Battle Token here..." className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 w-full h-24 text-xs font-mono text-white resize-none focus:border-red-500 outline-none"/>
                        </div>
                        <button onClick={startPvPCombat} disabled={!pvpCodeInput} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg disabled:opacity-50 transition-all hover:scale-[1.02]">FIGHT OPPONENT</button>
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
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold flex items-center gap-2 text-slate-300">
                                    <Icons.BookOpen size={18} /> Abilities
                                </h3>
                                <span className="text-xs text-blue-400 font-mono">{Math.max(0, player.currentMp)} / {player.maxMp} MP</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {getAllRelevantAbilities().map(ability => {
                                    const isUnlocked = player.unlockedAbilities.includes(ability.id);
                                    
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

                            {gameState === 'VICTORY' && (
                                <div className="flex gap-2 mt-4">
                                    {/* Disable Element Evolve in PvP */}
                                    {(!isOnline && player.level % 5 === 0 && player.level > 1) ? (
                                        <button onClick={() => setGameState('ELEMENT_CHANGE')} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold rounded-lg transition-all animate-pulse border border-white/20">
                                            ✨ EVOLVE ELEMENT ✨
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={returnToTown} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">Town</button>
                                            {!isOnline && (
                                                <button onClick={() => startCombat(false)} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 animate-bounce">
                                                    Next Battle <Icons.ChevronsRight size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {gameState === 'DEFEAT' && (
                                <button onClick={respawn} className="w-full mt-4 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2">
                                    Respawn in Town {isOnline ? '' : '(25% Gold Loss)'} <Icons.HeartPulse size={16} />
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