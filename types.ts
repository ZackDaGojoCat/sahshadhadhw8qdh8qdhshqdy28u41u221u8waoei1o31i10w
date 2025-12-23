
export type ElementType = 'Physical' | 'Fire' | 'Water' | 'Earth' | 'Air' | 'Lightning' | 'Ice' | 'Light' | 'Dark' | 'Nature' | 'Metal' | 'Blood' | 'Time' | 'Arcane';

export interface Ability {
  id: string;
  name: string;
  description: string;
  element: ElementType;
  manaCost: number;
  damage?: number;
  heal?: number;
  cooldown: number; // Turns to wait
  unlockLevel: number;
  icon: string; 
  isCustom?: boolean; // Fused abilities
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  element: ElementType;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary' | 'godly';
  price: number; // New: Cost in Gold
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  baseHp: number;
  baseMp: number;
  element: ElementType;
  iconName: string; 
  startingAbilities: string[];
  startingWeaponId: string;
  requiredPrestige: number; // NEW: Unlock condition
}

export interface Entity {
  name: string;
  maxHp: number;
  currentHp: number;
  maxMp: number; 
  currentMp: number;
  level: number;
  element: ElementType;
  iconName?: string; 
  isBoss?: boolean;
}

export interface Player extends Entity {
  xp: number;
  maxXp: number;
  gold: number; 
  unlockedAbilities: string[];
  customAbilities: Ability[]; 
  classId: string;
  weapon: Weapon;
  winStreak: number; 
  prestige: number; // NEW: Ascension level
  lastEvolvedLevel: number; // NEW: Tracks when we last changed element
}

export interface Enemy extends Entity {
  description: string;
  xpReward: number;
  goldReward: number; 
  isPvP?: boolean; 
  pvpAbilities?: string[]; 
  pvpWeapon?: Weapon; 
}

export type GameState = 'CHARACTER_SELECT' | 'TOWN' | 'SHOP' | 'COMBAT' | 'VICTORY' | 'DEFEAT' | 'PVP_MENU' | 'ELEMENT_CHANGE' | 'ONLINE_LOBBY' | 'FUSION';

export interface CombatLogEntry {
  id: string;
  message: string;
  type: 'info' | 'player-action' | 'enemy-action' | 'system';
}

export interface DamageNumber {
  id: number;
  value: number | string;
  x: number;
  y: number;
  color: string;
}

export interface VisualEffect {
  id: string;
  type: 'projectile' | 'impact' | 'heal' | 'buff';
  element: ElementType;
  source: 'player' | 'enemy';
  target: 'player' | 'enemy';
  abilityId?: string; // NEW: Allows specific VFX per ability
}

export interface Position {
  x: number;
  y: number;
}

export interface MapCell {
  x: number;
  y: number;
  type: 'empty' | 'wall' | 'start' | 'enemy' | 'treasure' | 'boss';
  isRevealed: boolean;
}

// --- P2P TYPES ---
export type P2PMessageType = 'HANDSHAKE' | 'ATTACK' | 'TURN_END' | 'DEFEAT' | 'VICTORY';

export interface P2PMessage {
  type: P2PMessageType;
  payload?: any;
}

export interface HandshakePayload {
  player: Player;
}

export interface AttackPayload {
  abilityName: string;
  damage: number;
  heal: number;
  isCritical: boolean;
  element: ElementType;
}
