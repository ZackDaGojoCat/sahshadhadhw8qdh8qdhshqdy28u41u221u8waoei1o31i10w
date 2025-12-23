import { Player, Enemy, Weapon } from '../types';
import { WEAPONS } from '../constants';

export const encodePlayerToCode = (player: Player): string => {
  const pvpData = {
    n: player.name,
    l: player.level,
    hp: player.maxHp,
    mp: player.maxMp,
    e: player.element,
    i: player.iconName,
    c: player.classId,
    a: player.unlockedAbilities, // Unlocked abilities
    w: player.weapon.id // Equipped weapon ID
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
    const jsonStr = atob(code);
    const data = JSON.parse(jsonStr);

    // Validate required fields roughly
    if (!data.n || !data.hp) return null;

    // Reconstruct weapon
    const weapon = WEAPONS.find(w => w.id === data.w) || WEAPONS[0];

    return {
      name: `Challenger ${data.n}`,
      description: `A level ${data.l} ${data.e} warrior wielding ${weapon.name}.`,
      maxHp: data.hp,
      currentHp: data.hp, // Start fresh
      maxMp: data.mp,
      currentMp: data.mp,
      level: data.l,
      element: data.e,
      iconName: data.i,
      xpReward: data.l * 80, // Higher XP reward for PvP
      goldReward: data.l * 40,
      isPvP: true,
      isBoss: false,
      pvpAbilities: data.a || [],
      pvpWeapon: weapon
    };
  } catch (e) {
    console.error("Invalid PvP Code", e);
    return null;
  }
};