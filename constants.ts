
import { Ability, ElementType, CharacterClass, Weapon } from './types';

export const ELEMENT_COLORS: Record<ElementType, string> = {
  Physical: 'text-zinc-400 border-zinc-500 bg-zinc-900 shadow-zinc-500/50',
  Fire: 'text-orange-500 border-orange-500 bg-orange-950 shadow-orange-500/50',
  Water: 'text-blue-400 border-blue-400 bg-blue-950 shadow-blue-400/50',
  Earth: 'text-amber-700 border-amber-700 bg-stone-900 shadow-amber-700/50',
  Air: 'text-cyan-300 border-cyan-300 bg-cyan-950 shadow-cyan-300/50',
  Lightning: 'text-purple-400 border-purple-400 bg-purple-950 shadow-purple-400/50',
  Ice: 'text-sky-200 border-sky-300 bg-sky-950 shadow-sky-300/50',
  Light: 'text-yellow-100 border-yellow-200 bg-yellow-950 shadow-yellow-200/50',
  Dark: 'text-violet-900 border-violet-900 bg-black shadow-violet-900/50',
  Nature: 'text-lime-400 border-lime-500 bg-lime-950 shadow-lime-500/50',
  Metal: 'text-slate-300 border-slate-400 bg-slate-800 shadow-slate-400/50',
  Blood: 'text-red-600 border-red-700 bg-red-950 shadow-red-600/50',
  Time: 'text-fuchsia-300 border-fuchsia-400 bg-fuchsia-950 shadow-fuchsia-400/50',
  Arcane: 'text-pink-400 border-pink-500 bg-pink-950 shadow-pink-500/50',
};

export const ELEMENT_BG_COLORS: Record<ElementType, string> = {
  Physical: 'bg-zinc-600',
  Fire: 'bg-orange-600',
  Water: 'bg-blue-600',
  Earth: 'bg-amber-800',
  Air: 'bg-cyan-500',
  Lightning: 'bg-purple-600',
  Ice: 'bg-sky-500',
  Light: 'bg-yellow-500',
  Dark: 'bg-violet-950',
  Nature: 'bg-lime-600',
  Metal: 'bg-slate-500',
  Blood: 'bg-red-800',
  Time: 'bg-fuchsia-600',
  Arcane: 'bg-pink-600',
};

export const TYPE_ADVANTAGE: Record<ElementType, ElementType> = {
  Fire: 'Ice',      
  Ice: 'Nature',     
  Nature: 'Earth',
  Earth: 'Lightning', 
  Lightning: 'Water', 
  Water: 'Fire',    
  Air: 'Earth',     
  Physical: 'Physical',
  Light: 'Dark',
  Dark: 'Time',
  Time: 'Arcane',
  Arcane: 'Metal',
  Metal: 'Blood',
  Blood: 'Light'
};

export const WEAPONS: Weapon[] = [
    // Common
    { id: 'rusty_sword', name: 'Rusty Sword', damage: 5, element: 'Physical', icon: 'Sword', rarity: 'common', price: 0 },
    { id: 'training_wand', name: 'Old Wand', damage: 4, element: 'Physical', icon: 'Wand', rarity: 'common', price: 0 },
    { id: 'chipped_dagger', name: 'Chipped Dagger', damage: 5, element: 'Physical', icon: 'Scissors', rarity: 'common', price: 0 },
    { id: 'heavy_club', name: 'Heavy Club', damage: 7, element: 'Physical', icon: 'Hammer', rarity: 'common', price: 0 },
    
    // Uncommon (Shop Lv 1)
    { id: 'iron_broadsword', name: 'Iron Broadsword', damage: 12, element: 'Physical', icon: 'Sword', rarity: 'common', price: 150 },
    { id: 'steel_saber', name: 'Steel Saber', damage: 18, element: 'Physical', icon: 'Sword', rarity: 'rare', price: 300 },
    { id: 'battle_axe', name: 'Battle Axe', damage: 16, element: 'Physical', icon: 'Axe', rarity: 'rare', price: 250 },
    { id: 'magic_staff', name: 'Magic Staff', damage: 15, element: 'Physical', icon: 'Wand', rarity: 'rare', price: 280 },
    
    // Rare Elemental (Shop Lv 2)
    { id: 'flame_tongue', name: 'Flame Tongue', damage: 25, element: 'Fire', icon: 'Flame', rarity: 'rare', price: 600 },
    { id: 'frost_bite', name: 'Frost Bite', damage: 25, element: 'Ice', icon: 'Snowflake', rarity: 'rare', price: 600 },
    { id: 'gaia_hammer', name: 'Gaia Hammer', damage: 30, element: 'Earth', icon: 'Hammer', rarity: 'rare', price: 650 },
    { id: 'zephyr_blade', name: 'Zephyr Blade', damage: 22, element: 'Air', icon: 'Feather', rarity: 'rare', price: 580 },
    { id: 'thunder_spear', name: 'Thunder Spear', damage: 28, element: 'Lightning', icon: 'Zap', rarity: 'rare', price: 620 },
    { id: 'tidal_staff', name: 'Tidal Staff', damage: 24, element: 'Water', icon: 'Droplets', rarity: 'rare', price: 600 },
    { id: 'venom_daggers', name: 'Venom Daggers', damage: 26, element: 'Physical', icon: 'Scissors', rarity: 'rare', price: 550 },
    { id: 'holy_mace', name: 'Morning Star', damage: 26, element: 'Light', icon: 'Sun', rarity: 'rare', price: 620 },
    { id: 'soul_scythe', name: 'Soul Scythe', damage: 29, element: 'Dark', icon: 'Moon', rarity: 'rare', price: 650 },

    // Legendary (Shop Lv 3 / Boss Only)
    { id: 'excalibur', name: 'Excalibur', damage: 50, element: 'Physical', icon: 'Crown', rarity: 'legendary', price: 2000 },
    { id: 'infernal_claymore', name: 'Infernal Claymore', damage: 55, element: 'Fire', icon: 'Flame', rarity: 'legendary', price: 2200 },
    { id: 'mjolnir', name: 'Mjolnir', damage: 60, element: 'Lightning', icon: 'Hammer', rarity: 'legendary', price: 2500 },
    { id: 'absolute_zero', name: 'Absolute Zero', damage: 52, element: 'Ice', icon: 'Snowflake', rarity: 'legendary', price: 2300 },
    { id: 'gaia_wrath', name: 'Gaias Wrath', damage: 58, element: 'Earth', icon: 'Mountain', rarity: 'legendary', price: 2400 },
    { id: 'poseidon_trident', name: 'Trident', damage: 54, element: 'Water', icon: 'Anchor', rarity: 'legendary', price: 2200 },
    { id: 'bringer_of_light', name: 'Dawnbreaker', damage: 56, element: 'Light', icon: 'Sun', rarity: 'legendary', price: 2400 },
    { id: 'void_edge', name: 'Void Edge', damage: 59, element: 'Dark', icon: 'Skull', rarity: 'legendary', price: 2500 },

    // GODLY (Prestige Exclusive)
    { id: 'infinity_blade', name: 'Infinity Blade', damage: 100, element: 'Arcane', icon: 'Infinity', rarity: 'godly', price: 10000 },
    { id: 'world_ender', name: 'World Ender', damage: 120, element: 'Dark', icon: 'Globe', rarity: 'godly', price: 15000 },
    { id: 'chronos_scepter', name: 'Scepter of Aeons', damage: 90, element: 'Time', icon: 'Clock', rarity: 'godly', price: 12000 },
];

export const ABILITIES: Ability[] = [
  // --- PHYSICAL (7) ---
  { id: 'strike', name: 'Heavy Strike', description: 'A basic physical blow.', element: 'Physical', manaCost: 0, damage: 10, cooldown: 0, unlockLevel: 1, icon: 'Hammer' },
  { id: 'quick_slash', name: 'Quick Slash', description: 'A fast attack, costs no mana.', element: 'Physical', manaCost: 0, damage: 8, cooldown: 0, unlockLevel: 2, icon: 'Sword' },
  { id: 'pommel_bash', name: 'Pommel Bash', description: 'Stun the enemy with a blunt hit.', element: 'Physical', manaCost: 15, damage: 25, cooldown: 2, unlockLevel: 3, icon: 'Circle' },
  { id: 'shield_bash', name: 'Shield Bash', description: 'Slam with your shield.', element: 'Physical', manaCost: 25, damage: 35, cooldown: 2, unlockLevel: 4, icon: 'Shield' },
  { id: 'execute', name: 'Execute', description: 'A deadly strike to finish foes.', element: 'Physical', manaCost: 40, damage: 70, cooldown: 4, unlockLevel: 5, icon: 'Skull' },
  { id: 'bladestorm', name: 'Bladestorm', description: 'Spinning attack.', element: 'Physical', manaCost: 50, damage: 85, cooldown: 3, unlockLevel: 6, icon: 'RotateCcw' },
  { id: 'berserk', name: 'Berserk Barrage', description: 'Unleash a flurry of wild attacks.', element: 'Physical', manaCost: 60, damage: 120, cooldown: 5, unlockLevel: 7, icon: 'Swords' },

  // --- FIRE (7) ---
  { id: 'ember', name: 'Ember Bolt', description: 'Launch a small bolt of fire.', element: 'Fire', manaCost: 10, damage: 20, cooldown: 0, unlockLevel: 1, icon: 'Flame' },
  { id: 'flame_burst', name: 'Flame Burst', description: 'An explosion of heat.', element: 'Fire', manaCost: 20, damage: 35, cooldown: 2, unlockLevel: 2, icon: 'Sun' },
  { id: 'combustion', name: 'Combustion', description: 'Ignite the air itself.', element: 'Fire', manaCost: 30, damage: 50, cooldown: 2, unlockLevel: 3, icon: 'Zap' },
  { id: 'phoenix_blade', name: 'Phoenix Strike', description: 'Wreathe your weapon in flame.', element: 'Fire', manaCost: 35, damage: 65, cooldown: 2, unlockLevel: 4, icon: 'Sword' },
  { id: 'fireball', name: 'Great Fireball', description: 'A classic ball of destruction.', element: 'Fire', manaCost: 50, damage: 95, cooldown: 3, unlockLevel: 5, icon: 'Flame' },
  { id: 'supernova', name: 'Supernova', description: 'A blinding explosion.', element: 'Fire', manaCost: 70, damage: 120, cooldown: 4, unlockLevel: 6, icon: 'Sun' },
  { id: 'inferno', name: 'Hellfire', description: 'Engulf the enemy in a firestorm.', element: 'Fire', manaCost: 90, damage: 150, cooldown: 5, unlockLevel: 7, icon: 'Zap' },

  // --- WATER (7) - BUFFED ---
  { id: 'bubble', name: 'Water Bubble', description: 'A concentrated burst of water.', element: 'Water', manaCost: 10, damage: 25, cooldown: 0, unlockLevel: 1, icon: 'Droplets' },
  { id: 'heal', name: 'Mend', description: 'Restore health with magic.', element: 'Water', manaCost: 30, heal: 50, damage: 0, cooldown: 3, unlockLevel: 2, icon: 'Heart' },
  { id: 'aqua_jet', name: 'Aqua Jet', description: 'High pressure water stream.', element: 'Water', manaCost: 25, damage: 55, cooldown: 2, unlockLevel: 3, icon: 'Droplets' },
  { id: 'whirlpool', name: 'Whirlpool', description: 'Trap the enemy in a spin.', element: 'Water', manaCost: 40, damage: 70, cooldown: 3, unlockLevel: 4, icon: 'RotateCw' },
  { id: 'tidal_strike', name: 'Tidal Wave', description: 'Crash into the foe like the ocean.', element: 'Water', manaCost: 50, damage: 95, cooldown: 3, unlockLevel: 5, icon: 'Waves' },
  { id: 'leviathan', name: 'Leviathans Call', description: 'Summon a beast from the deep.', element: 'Water', manaCost: 70, damage: 130, cooldown: 4, unlockLevel: 6, icon: 'Anchor' },
  { id: 'tsunami', name: 'Tsunami', description: 'Drown the enemy in power.', element: 'Water', manaCost: 85, damage: 165, cooldown: 5, unlockLevel: 7, icon: 'CloudRain' },

  // --- EARTH (7) ---
  { id: 'pebble', name: 'Pebble Shot', description: 'Flick a stone at speed.', element: 'Earth', manaCost: 5, damage: 12, cooldown: 0, unlockLevel: 1, icon: 'Circle' },
  { id: 'rock_throw', name: 'Boulder Toss', description: 'Hurl a heavy rock.', element: 'Earth', manaCost: 20, damage: 30, cooldown: 1, unlockLevel: 2, icon: 'Mountain' },
  { id: 'harden', name: 'Stone Skin', description: 'Repair your armor (Heal).', element: 'Earth', manaCost: 40, heal: 80, damage: 0, cooldown: 4, unlockLevel: 3, icon: 'Shield' },
  { id: 'sand_blast', name: 'Sand Blast', description: 'Erode their defenses.', element: 'Earth', manaCost: 35, damage: 55, cooldown: 2, unlockLevel: 4, icon: 'Wind' },
  { id: 'fissure', name: 'Fissure', description: 'Crack the earth open.', element: 'Earth', manaCost: 55, damage: 90, cooldown: 3, unlockLevel: 5, icon: 'Triangle' },
  { id: 'terra_force', name: 'Terra Force', description: 'The weight of the world.', element: 'Earth', manaCost: 70, damage: 115, cooldown: 4, unlockLevel: 6, icon: 'Mountain' },
  { id: 'earthquake', name: 'Earthquake', description: 'Shatter the ground completely.', element: 'Earth', manaCost: 90, damage: 150, cooldown: 5, unlockLevel: 7, icon: 'Mountain' },

  // --- AIR (7) ---
  { id: 'gust', name: 'Gust', description: 'A sharp blast of wind.', element: 'Air', manaCost: 10, damage: 18, cooldown: 0, unlockLevel: 1, icon: 'Wind' },
  { id: 'aerial_ace', name: 'Aerial Ace', description: 'Strike from the sky.', element: 'Air', manaCost: 25, damage: 40, cooldown: 1, unlockLevel: 2, icon: 'Feather' },
  { id: 'vacuum', name: 'Vacuum Blade', description: 'Create a vacuum that slices.', element: 'Air', manaCost: 40, damage: 65, cooldown: 2, unlockLevel: 3, icon: 'Sword' },
  { id: 'cyclone', name: 'Cyclone', description: 'A focused vortex.', element: 'Air', manaCost: 50, damage: 80, cooldown: 3, unlockLevel: 4, icon: 'Tornado' },
  { id: 'tornado', name: 'Tornado', description: 'Lift the enemy in a spin.', element: 'Air', manaCost: 65, damage: 100, cooldown: 3, unlockLevel: 5, icon: 'Tornado' },
  { id: 'sky_fall', name: 'Sky Fall', description: 'Drop from the heavens.', element: 'Air', manaCost: 80, damage: 130, cooldown: 4, unlockLevel: 6, icon: 'ArrowDown' },
  { id: 'hurricane', name: 'Hurricane', description: 'The wrath of the skies.', element: 'Air', manaCost: 95, damage: 160, cooldown: 5, unlockLevel: 7, icon: 'Wind' },

  // --- LIGHTNING (7) ---
  { id: 'spark', name: 'Spark', description: 'A small jolt of electricity.', element: 'Lightning', manaCost: 12, damage: 22, cooldown: 0, unlockLevel: 1, icon: 'Zap' },
  { id: 'shock', name: 'Static Shock', description: 'Paralyzing energy.', element: 'Lightning', manaCost: 25, damage: 45, cooldown: 1, unlockLevel: 2, icon: 'Activity' },
  { id: 'overload', name: 'Overload', description: 'Surge of power.', element: 'Lightning', manaCost: 35, damage: 60, cooldown: 2, unlockLevel: 3, icon: 'Zap' },
  { id: 'thunderbolt', name: 'Thunderbolt', description: 'A loud crash of lightning.', element: 'Lightning', manaCost: 45, damage: 75, cooldown: 2, unlockLevel: 4, icon: 'ZapOff' },
  { id: 'chain_lightning', name: 'Chain Lightning', description: 'Arcs of raw energy.', element: 'Lightning', manaCost: 65, damage: 105, cooldown: 3, unlockLevel: 5, icon: 'Share2' },
  { id: 'plasma_cannon', name: 'Plasma Cannon', description: 'Focused beam of electricity.', element: 'Lightning', manaCost: 80, damage: 135, cooldown: 4, unlockLevel: 6, icon: 'Target' },
  { id: 'thor_wrath', name: 'Gods Wrath', description: 'Summon the ultimate storm.', element: 'Lightning', manaCost: 100, damage: 170, cooldown: 5, unlockLevel: 7, icon: 'Hammer' },

  // --- ICE (7) ---
  { id: 'ice_shard', name: 'Ice Shard', description: 'A sharp splinter of ice.', element: 'Ice', manaCost: 12, damage: 20, cooldown: 0, unlockLevel: 1, icon: 'Snowflake' },
  { id: 'frost', name: 'Frostbite', description: 'Chilling cold touch.', element: 'Ice', manaCost: 25, damage: 40, cooldown: 1, unlockLevel: 2, icon: 'ThermometerSnowflake' },
  { id: 'ice_wall', name: 'Glacial Barrier', description: 'Heal wounds with frozen magic.', element: 'Ice', manaCost: 40, heal: 70, damage: 0, cooldown: 4, unlockLevel: 3, icon: 'Shield' },
  { id: 'ice_age', name: 'Ice Age', description: 'Flash freeze the area.', element: 'Ice', manaCost: 50, damage: 80, cooldown: 3, unlockLevel: 4, icon: 'Snowflake' },
  { id: 'blizzard', name: 'Blizzard', description: 'A storm of razor hail.', element: 'Ice', manaCost: 65, damage: 100, cooldown: 3, unlockLevel: 5, icon: 'CloudSnow' },
  { id: 'permafrost', name: 'Permafrost', description: 'Eternal cold.', element: 'Ice', manaCost: 80, damage: 130, cooldown: 4, unlockLevel: 6, icon: 'Thermometer' },
  { id: 'absolute_zero', name: 'Absolute Zero', description: 'Freeze time itself.', element: 'Ice', manaCost: 95, damage: 160, cooldown: 5, unlockLevel: 7, icon: 'Snowflake' },

  // --- LIGHT (7) ---
  { id: 'ray_of_light', name: 'Ray of Light', description: 'A focused beam of light.', element: 'Light', manaCost: 12, damage: 20, cooldown: 0, unlockLevel: 1, icon: 'Sun' },
  { id: 'blessing', name: 'Blessing', description: 'Divine healing.', element: 'Light', manaCost: 30, heal: 55, damage: 0, cooldown: 3, unlockLevel: 2, icon: 'Heart' },
  { id: 'holy_shock', name: 'Holy Shock', description: 'Shock the enemy with holy power.', element: 'Light', manaCost: 25, damage: 45, cooldown: 1, unlockLevel: 3, icon: 'Zap' },
  { id: 'radiance', name: 'Radiance', description: 'Burn with holy fire.', element: 'Light', manaCost: 40, damage: 65, cooldown: 2, unlockLevel: 4, icon: 'Sun' },
  { id: 'divine_intervention', name: 'Divine Intervention', description: 'A massive heal from the gods.', element: 'Light', manaCost: 60, heal: 120, damage: 0, cooldown: 5, unlockLevel: 5, icon: 'PlusCircle' },
  { id: 'sunburst', name: 'Sunburst', description: 'Explosive light energy.', element: 'Light', manaCost: 70, damage: 115, cooldown: 4, unlockLevel: 6, icon: 'Star' },
  { id: 'judgment_day', name: 'Judgment Day', description: 'The final verdict.', element: 'Light', manaCost: 95, damage: 165, cooldown: 5, unlockLevel: 7, icon: 'Scale' },

  // --- DARK (7) ---
  { id: 'gloom', name: 'Gloom Bolt', description: 'A bolt of pure darkness.', element: 'Dark', manaCost: 12, damage: 22, cooldown: 0, unlockLevel: 1, icon: 'Moon' },
  { id: 'dark_pulse', name: 'Dark Pulse', description: 'A wave of bad energy.', element: 'Dark', manaCost: 25, damage: 45, cooldown: 1, unlockLevel: 2, icon: 'Activity' },
  { id: 'shadow_mend', name: 'Shadow Mend', description: 'Stitch wounds with shadow.', element: 'Dark', manaCost: 40, heal: 75, damage: 0, cooldown: 4, unlockLevel: 3, icon: 'Heart' },
  { id: 'doom', name: 'Doom', description: 'Impending heavy damage.', element: 'Dark', manaCost: 45, damage: 75, cooldown: 2, unlockLevel: 4, icon: 'Skull' },
  { id: 'void_ray', name: 'Void Ray', description: 'Channel the void.', element: 'Dark', manaCost: 60, damage: 100, cooldown: 3, unlockLevel: 5, icon: 'ZapOff' },
  { id: 'eclipse', name: 'Eclipse', description: 'Block out the sun.', element: 'Dark', manaCost: 75, damage: 130, cooldown: 4, unlockLevel: 6, icon: 'Moon' },
  { id: 'cataclysm', name: 'Cataclysm', description: 'Unleash total destruction.', element: 'Dark', manaCost: 100, damage: 170, cooldown: 5, unlockLevel: 7, icon: 'Skull' },

  // --- NATURE (7) ---
  { id: 'vine_whip', name: 'Vine Whip', description: 'Strike with thorny vines.', element: 'Nature', manaCost: 12, damage: 18, cooldown: 0, unlockLevel: 1, icon: 'Flower' },
  { id: 'leech_seed', name: 'Leech Seed', description: 'Drain life from the enemy.', element: 'Nature', manaCost: 25, damage: 20, heal: 20, cooldown: 2, unlockLevel: 2, icon: 'Sprout' },
  { id: 'razor_leaf', name: 'Razor Leaf', description: 'Sharp leaves slice the air.', element: 'Nature', manaCost: 35, damage: 50, cooldown: 1, unlockLevel: 3, icon: 'Feather' },
  { id: 'photosynthesis', name: 'Regrowth', description: 'Absorb nature energy to heal.', element: 'Nature', manaCost: 50, heal: 90, damage: 0, cooldown: 4, unlockLevel: 4, icon: 'Sun' },
  { id: 'root_crush', name: 'Root Crush', description: 'Roots burst from the ground.', element: 'Nature', manaCost: 60, damage: 85, cooldown: 3, unlockLevel: 5, icon: 'Trees' },
  { id: 'solar_beam', name: 'Solar Beam', description: 'Concentrated solar power.', element: 'Nature', manaCost: 80, damage: 125, cooldown: 4, unlockLevel: 6, icon: 'Zap' },
  { id: 'wrath_of_gaia', name: 'Wrath of Gaia', description: 'The forest strikes back.', element: 'Nature', manaCost: 100, damage: 165, cooldown: 5, unlockLevel: 7, icon: 'Mountain' },

  // --- METAL (7) ---
  { id: 'iron_fist', name: 'Iron Fist', description: 'A punch as hard as steel.', element: 'Metal', manaCost: 10, damage: 20, cooldown: 0, unlockLevel: 1, icon: 'HandMetal' },
  { id: 'shrapnel', name: 'Shrapnel', description: 'Explosive metal fragments.', element: 'Metal', manaCost: 20, damage: 35, cooldown: 1, unlockLevel: 2, icon: 'Hexagon' },
  { id: 'steel_barrier', name: 'Steel Barrier', description: 'Repair armor plating.', element: 'Metal', manaCost: 40, heal: 60, damage: 0, cooldown: 3, unlockLevel: 3, icon: 'Shield' },
  { id: 'blade_dance', name: 'Blade Dance', description: 'A whirlwind of sharp edges.', element: 'Metal', manaCost: 50, damage: 70, cooldown: 2, unlockLevel: 4, icon: 'Swords' },
  { id: 'spike_rain', name: 'Spike Rain', description: 'Heavy spikes fall from above.', element: 'Metal', manaCost: 65, damage: 95, cooldown: 3, unlockLevel: 5, icon: 'ArrowDown' },
  { id: 'guillotine', name: 'Guillotine', description: 'A massive falling blade.', element: 'Metal', manaCost: 80, damage: 130, cooldown: 4, unlockLevel: 6, icon: 'Crop' },
  { id: 'titan_smash', name: 'Titan Smash', description: 'Crush with titanic force.', element: 'Metal', manaCost: 100, damage: 170, cooldown: 5, unlockLevel: 7, icon: 'Hammer' },

  // --- BLOOD (7) ---
  { id: 'claw_rake', name: 'Claw Rake', description: 'Tear flesh.', element: 'Blood', manaCost: 5, damage: 25, cooldown: 0, unlockLevel: 1, icon: 'Scissors' },
  { id: 'transfusion', name: 'Transfusion', description: 'Steal life essence.', element: 'Blood', manaCost: 30, damage: 30, heal: 30, cooldown: 2, unlockLevel: 2, icon: 'Droplets' },
  { id: 'blood_boil', name: 'Blood Boil', description: 'Boil the enemy from within.', element: 'Blood', manaCost: 40, damage: 60, cooldown: 2, unlockLevel: 3, icon: 'Flame' },
  { id: 'hemorrhage', name: 'Hemorrhage', description: 'Cause massive bleeding.', element: 'Blood', manaCost: 55, damage: 80, cooldown: 3, unlockLevel: 4, icon: 'Activity' },
  { id: 'sanguine_pact', name: 'Sanguine Pact', description: 'Forbidden healing.', element: 'Blood', manaCost: 50, heal: 100, damage: 0, cooldown: 4, unlockLevel: 5, icon: 'Heart' },
  { id: 'crimson_nova', name: 'Crimson Nova', description: 'Explode in a mist of red.', element: 'Blood', manaCost: 80, damage: 135, cooldown: 4, unlockLevel: 6, icon: 'Sun' },
  { id: 'exsanguinate', name: 'Exsanguinate', description: 'Drain every drop.', element: 'Blood', manaCost: 110, damage: 180, cooldown: 5, unlockLevel: 7, icon: 'Droplets' },

  // --- TIME (7) ---
  { id: 'tick_tock', name: 'Tick Tock', description: 'Time ticks away HP.', element: 'Time', manaCost: 15, damage: 20, cooldown: 0, unlockLevel: 1, icon: 'Clock' },
  { id: 'rewind', name: 'Rewind', description: 'Reverse damage taken.', element: 'Time', manaCost: 40, heal: 70, damage: 0, cooldown: 3, unlockLevel: 2, icon: 'Undo2' },
  { id: 'accelerate', name: 'Accelerate', description: 'Speed up attacks.', element: 'Time', manaCost: 35, damage: 50, cooldown: 1, unlockLevel: 3, icon: 'FastForward' },
  { id: 'decay', name: 'Rapid Decay', description: 'Age the enemy instantly.', element: 'Time', manaCost: 50, damage: 75, cooldown: 2, unlockLevel: 4, icon: 'Hourglass' },
  { id: 'paradox', name: 'Paradox', description: 'Reality glitches violently.', element: 'Time', manaCost: 70, damage: 110, cooldown: 3, unlockLevel: 5, icon: 'HelpCircle' },
  { id: 'future_strike', name: 'Future Strike', description: 'An attack from tomorrow.', element: 'Time', manaCost: 85, damage: 140, cooldown: 4, unlockLevel: 6, icon: 'ArrowRight' },
  { id: 'time_stop', name: 'Chrono Break', description: 'Shatter the timeline.', element: 'Time', manaCost: 100, damage: 175, cooldown: 5, unlockLevel: 7, icon: 'Watch' },

  // --- ARCANE (7) ---
  { id: 'magic_missile', name: 'Magic Missile', description: 'A bolt of pure energy.', element: 'Arcane', manaCost: 10, damage: 18, cooldown: 0, unlockLevel: 1, icon: 'Sparkles' },
  { id: 'mystic_orb', name: 'Mystic Orb', description: 'Launch a volatile sphere.', element: 'Arcane', manaCost: 25, damage: 40, cooldown: 1, unlockLevel: 2, icon: 'Circle' },
  { id: 'barrier', name: 'Mana Barrier', description: 'Convert mana to health.', element: 'Arcane', manaCost: 40, heal: 60, damage: 0, cooldown: 3, unlockLevel: 3, icon: 'Shield' },
  { id: 'rune_blast', name: 'Rune Blast', description: 'Detonate ancient runes.', element: 'Arcane', manaCost: 45, damage: 65, cooldown: 2, unlockLevel: 4, icon: 'Hexagon' },
  { id: 'aether_ray', name: 'Aether Ray', description: 'Beam of raw magic.', element: 'Arcane', manaCost: 65, damage: 100, cooldown: 3, unlockLevel: 5, icon: 'Zap' },
  { id: 'disintegrate', name: 'Disintegrate', description: 'Dust to dust.', element: 'Arcane', manaCost: 85, damage: 140, cooldown: 4, unlockLevel: 6, icon: 'Wind' },
  { id: 'supernova_arcane', name: 'Cosmic Burst', description: 'The energy of stars.', element: 'Arcane', manaCost: 100, damage: 170, cooldown: 5, unlockLevel: 7, icon: 'Star' },
];

export const CHARACTER_CLASSES: CharacterClass[] = [
  // --- BASE CLASSES ---
  {
    id: 'knight',
    name: 'Ember Knight',
    description: 'A warrior who channels fire through their blade.',
    baseHp: 150,
    baseMp: 40,
    element: 'Fire',
    iconName: 'Shield',
    startingAbilities: ['strike', 'ember'],
    startingWeaponId: 'rusty_sword',
    requiredPrestige: 0
  },
  {
    id: 'mage',
    name: 'Tide Caller',
    description: 'A master of water magic.',
    baseHp: 90,
    baseMp: 100,
    element: 'Water',
    iconName: 'Sparkles',
    startingAbilities: ['bubble', 'heal'], // Changed to Bubble to give damage start
    startingWeaponId: 'training_wand',
    requiredPrestige: 0
  },
  {
    id: 'rogue',
    name: 'Ronin',
    description: 'A swift wanderer who strikes like the wind.',
    baseHp: 110,
    baseMp: 60,
    element: 'Air',
    iconName: 'Feather',
    startingAbilities: ['quick_slash', 'gust'],
    startingWeaponId: 'chipped_dagger',
    requiredPrestige: 0
  },
  {
    id: 'guardian',
    name: 'Stone Guardian',
    description: 'Unbreakable defense. High health pool.',
    baseHp: 180,
    baseMp: 30,
    element: 'Earth',
    iconName: 'Mountain',
    startingAbilities: ['strike', 'pebble'],
    startingWeaponId: 'heavy_club',
    requiredPrestige: 0
  },
  {
    id: 'storm',
    name: 'Storm Bringer',
    description: 'High burst damage, low HP glass cannon.',
    baseHp: 100,
    baseMp: 80,
    element: 'Lightning',
    iconName: 'Zap',
    startingAbilities: ['quick_slash', 'spark'],
    startingWeaponId: 'training_wand',
    requiredPrestige: 0
  },
  {
    id: 'frost',
    name: 'Frost Warden',
    description: 'Uses ice to control the battlefield.',
    baseHp: 130,
    baseMp: 70,
    element: 'Ice',
    iconName: 'Snowflake',
    startingAbilities: ['strike', 'ice_shard'],
    startingWeaponId: 'rusty_sword',
    requiredPrestige: 0
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior of the light. Balanced Offense/Defense.',
    baseHp: 160,
    baseMp: 60,
    element: 'Light',
    iconName: 'Sun',
    startingAbilities: ['strike', 'ray_of_light'],
    startingWeaponId: 'heavy_club',
    requiredPrestige: 0
  },
  {
    id: 'necro',
    name: 'Necromancer',
    description: 'Master of dark arts and life draining.',
    baseHp: 85,
    baseMp: 110,
    element: 'Dark',
    iconName: 'Skull',
    startingAbilities: ['gloom', 'dark_pulse'],
    startingWeaponId: 'training_wand',
    requiredPrestige: 0
  },
  {
    id: 'sylvan',
    name: 'Sylvan Archer',
    description: 'Guardian of the forest. High dexterity.',
    baseHp: 115,
    baseMp: 70,
    element: 'Nature',
    iconName: 'Sprout',
    startingAbilities: ['quick_slash', 'vine_whip'],
    startingWeaponId: 'chipped_dagger',
    requiredPrestige: 0
  },
  {
    id: 'ironclad',
    name: 'Ironclad',
    description: 'A walking tank made of steel.',
    baseHp: 200,
    baseMp: 20,
    element: 'Metal',
    iconName: 'Hammer',
    startingAbilities: ['strike', 'iron_fist'],
    startingWeaponId: 'heavy_club',
    requiredPrestige: 0
  },
  {
    id: 'bloodmage',
    name: 'Blood Mage',
    description: 'Sacrifices health for power. Dangerous.',
    baseHp: 140,
    baseMp: 90,
    element: 'Blood',
    iconName: 'Droplets',
    startingAbilities: ['claw_rake', 'transfusion'],
    startingWeaponId: 'chipped_dagger',
    requiredPrestige: 0
  },
  {
    id: 'chrono',
    name: 'Time Walker',
    description: 'Manipulates time to evade and strike.',
    baseHp: 105,
    baseMp: 100,
    element: 'Time',
    iconName: 'Clock',
    startingAbilities: ['quick_slash', 'tick_tock'],
    startingWeaponId: 'training_wand',
    requiredPrestige: 0
  },
  {
    id: 'arcanist',
    name: 'Arcanist',
    description: 'Scholar of pure magic energy.',
    baseHp: 95,
    baseMp: 120,
    element: 'Arcane',
    iconName: 'Book',
    startingAbilities: ['magic_missile', 'mystic_orb'],
    startingWeaponId: 'training_wand',
    requiredPrestige: 0
  },

  // --- PRESTIGE GOD CLASSES ---
  {
    id: 'celestial',
    name: 'Celestial Paragon',
    description: 'An entity of pure light and physical perfection.',
    baseHp: 300,
    baseMp: 150,
    element: 'Light',
    iconName: 'Sun',
    startingAbilities: ['radiance', 'sunburst', 'divine_intervention'],
    startingWeaponId: 'bringer_of_light',
    requiredPrestige: 1
  },
  {
    id: 'void_lord',
    name: 'Void Lord',
    description: 'Consumes existence. Darkness personified.',
    baseHp: 250,
    baseMp: 200,
    element: 'Dark',
    iconName: 'Ghost',
    startingAbilities: ['void_ray', 'cataclysm', 'eclipse'],
    startingWeaponId: 'void_edge',
    requiredPrestige: 1
  },
  {
    id: 'tempest',
    name: 'Tempest God',
    description: 'Commands storms of air and lightning.',
    baseHp: 200,
    baseMp: 220,
    element: 'Lightning',
    iconName: 'CloudLightning',
    startingAbilities: ['chain_lightning', 'thor_wrath', 'hurricane'],
    startingWeaponId: 'mjolnir',
    requiredPrestige: 1
  },
  {
    id: 'chronomancer',
    name: 'Grand Chronomancer',
    description: 'Weaves time to erase enemies from history.',
    baseHp: 220,
    baseMp: 250,
    element: 'Time',
    iconName: 'Hourglass',
    startingAbilities: ['time_stop', 'paradox', 'future_strike'],
    startingWeaponId: 'chronos_scepter',
    requiredPrestige: 1
  },
  {
    id: 'arcane_monarch',
    name: 'Arcane Monarch',
    description: 'The ruler of all magic.',
    baseHp: 200,
    baseMp: 300,
    element: 'Arcane',
    iconName: 'Crown',
    startingAbilities: ['supernova_arcane', 'disintegrate', 'aether_ray'],
    startingWeaponId: 'infinity_blade',
    requiredPrestige: 1
  }
];

export const BASE_XP_REQ = 50;
export const XP_SCALING = 1.3;
