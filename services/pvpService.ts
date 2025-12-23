import { Player, Enemy, Weapon } from '../types';
import { WEAPONS } from '../constants';

// Simplified PVP Payload
interface PvpPayload {
  n: string; // name
  l: number; // level
  e: string; // element
  c: string; // classId
  w: string; // weaponId
  p: number; // prestige
}

export const encodePlayerToCode = (player: Player): string => {
  const pvpData: PvpPayload = {
    n: player.name,
    l: player.level,
    e: player.element,
    c: player.classId,
    w: player.weapon.id,
    p: player.prestige
  };
  
  try {
    const jsonStr = JSON.stringify(pvpData);
    return btoa(jsonStr);
  } catch (e) {
    console.error("Failed to encode player", e);
    return "";
  }
};

export const decodeCodeToEnemy = (code: string): Enemy | null => {
  try {
    // Basic clean up of potential whitespace
    const cleanCode = code.trim();
    const jsonStr = atob(cleanCode);
    const data = JSON.parse(jsonStr) as PvpPayload;

    // Validate required fields
    if (!data.n || !data.l || !data.c) return null;

    // Reconstruct stats based on level + prestige
    // We recreate the stats dynamically so the code is short
    const prestigeMult = 1 + (data.p * 0.5);
    const baseHp = 100 + (data.l * 30);
    const maxHp = Math.floor(baseHp * prestigeMult);
    
    // Reconstruct weapon
    const weapon = WEAPONS.find(w => w.id === data.w) || WEAPONS[0];

    return {
      name: `Rival ${data.n}`,
      description: `Lvl ${data.l} ${data.e} [Prestige ${data.p}]`,
      maxHp: maxHp,
      currentHp: maxHp, 
      maxMp: 100 + (data.l * 10),
      currentMp: 100 + (data.l * 10),
      level: data.l,
      element: data.e as any,
      iconName: 'Swords', // Generic PvP icon or derive from class
      xpReward: data.l * 100 * prestigeMult,
      goldReward: data.l * 50 * prestigeMult,
      isPvP: true,
      isBoss: false,
      pvpWeapon: weapon
    };
  } catch (e) {
    console.error("Invalid PvP Code", e);
    return null;
  }
};