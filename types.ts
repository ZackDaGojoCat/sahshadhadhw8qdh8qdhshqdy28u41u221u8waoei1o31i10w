

export type ElementType = 'Physical' | 'Fire' | 'Water' | 'Earth' | 'Air' | 'Lightning' | 'Ice' | 'Light' | 'Dark';

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
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  element: ElementType;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
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
  gold: number; // New: Currency
  unlockedAbilities: string[]; 
  classId: string;
  weapon: Weapon;
  winStreak: number; // Track consecutive wins
}

export interface Enemy extends Entity {
  description: string;
  xpReward: number;
  goldReward: number; // New: Gold drop
  isPvP?: boolean; 
  pvpAbilities?: string[]; 
  pvpWeapon?: Weapon; 
}

export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'TOWN' | 'SHOP' | 'COMBAT' | 'VICTORY' | 'DEFEAT' | 'PVP_MENU';

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
