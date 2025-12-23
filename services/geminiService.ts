
import { Enemy, ElementType } from '../types';

// --- PROCEDURAL DATA LISTS ---

const ADJECTIVES_LOW = ["Weak", "Tiny", "Young", "Lost", "Tired", "Small", "Dusty", "Rusted", "Slow"];
const ADJECTIVES_MID = ["Wild", "Feral", "Dark", "Angry", "Cursed", "Strong", "Rabid", "Swift", "Brutal", "Sharpened", "Bloody"];
const ADJECTIVES_HIGH = ["Ancient", "Legendary", "Elder", "Giant", "Eternal", "Mythic", "Colossal", "Divine", "Infernal", "Timeless", "Cosmic"];

const MONSTER_DATA: Record<string, { names: string[], icons: string[] }> = {
    Fire: { 
        names: ['Imp', 'Drake', 'Phoenix', 'Efreet', 'Hellhound', 'Salamander', 'Pyro', 'Demon', 'Ember Spirit'], 
        icons: ['Flame', 'Zap', 'Skull', 'ThermometerSun'] 
    },
    Water: { 
        names: ['Slime', 'Siren', 'Serpent', 'Elemental', 'Kraken', 'Tidehunter', 'Naga', 'Turtle', 'Shark'], 
        icons: ['Droplets', 'Waves', 'Fish', 'Anchor'] 
    },
    Earth: { 
        names: ['Golem', 'Troll', 'Gnome', 'Gargoyle', 'Treant', 'Behemoth', 'Giant', 'Boar', 'Basilisk'], 
        icons: ['Mountain', 'Shield', 'Trees', 'Pickaxe'] 
    },
    Air: { 
        names: ['Harpy', 'Griffin', 'Sylph', 'Djinn', 'Eagle', 'Cloud', 'Spirit', 'Bat', 'Wyvern'], 
        icons: ['Wind', 'Feather', 'Cloud', 'Bird'] 
    },
    Lightning: { 
        names: ['Spark', 'Wisp', 'Construct', 'Storm', 'Thunderbird', 'Voltaic', 'Dynamo', 'Bolt'], 
        icons: ['Zap', 'Activity', 'Flashlight'] 
    },
    Ice: { 
        names: ['Yeti', 'Wolf', 'Wraith', 'Penguin', 'Bear', 'Frostguard', 'Cryomancer', 'Ice Golem'], 
        icons: ['Snowflake', 'ThermometerSnowflake', 'Hexagon'] 
    },
    Light: { 
        names: ['Angel', 'Paladin', 'Wisp', 'Spirit', 'Valkyrie', 'Lumin', 'Guardian', 'Seraph'], 
        icons: ['Sun', 'Star', 'Sparkles', 'Shield'] 
    },
    Dark: { 
        names: ['Shadow', 'Ghost', 'Skeleton', 'Vampire', 'Reaper', 'Shade', 'Necromancer', 'Lich'], 
        icons: ['Moon', 'Skull', 'Ghost', 'Eye'] 
    },
    Nature: {
        names: ['Ent', 'Dryad', 'Maneater', 'Fungus', 'Scorpion', 'Spider', 'Mantis', 'Bear'],
        icons: ['Flower', 'Trees', 'Sprout', 'Bug']
    },
    Metal: {
        names: ['Automaton', 'Armor Suit', 'Tank', 'Mecha', 'Gargantua', 'Android', 'Blade', 'Golem'],
        icons: ['Hammer', 'Shield', 'Settings', 'Bot']
    },
    Blood: {
        names: ['Vampire', 'Leech', 'Mosquito', 'Bat', 'Hemogoblin', 'Cultist', 'Butcher', 'Parasite'],
        icons: ['Droplets', 'Heart', 'Skull', 'Scissors']
    },
    Time: {
        names: ['Chronos', 'Warp', 'Glitch', 'Paradox', 'Watcher', 'Shifter', 'Phantom', 'Echo'],
        icons: ['Clock', 'Watch', 'Hourglass', 'Undo2']
    },
    Arcane: {
        names: ['Wizard', 'Orb', 'Eye', 'Construct', 'Sorcerer', 'Illusion', 'Mind Flayer', 'Djinn'],
        icons: ['Sparkles', 'Eye', 'Zap', 'Wand']
    },
    Physical: {
        names: ['Bandit', 'Warrior', 'Wolf', 'Bear', 'Knight', 'Mercenary', 'Rogue', 'Orc', 'Goblin'],
        icons: ['Sword', 'Shield', 'User', 'Axe']
    },
    // NEW ELEMENTS
    Cosmic: {
        names: ['Alien', 'Star Spawn', 'Void Walker', 'Nebula Spirit', 'Comet', 'Observer', 'Elder Thing'],
        icons: ['Star', 'Moon', 'Globe', 'Eye']
    },
    Chaos: {
        names: ['Anomaly', 'Glitch', 'Mutant', 'Horror', 'Shifter', 'Abomination', 'Entropy'],
        icons: ['Shuffle', 'Dices', 'HelpCircle', 'Zap']
    },
    Sand: {
        names: ['Mummy', 'Scorpion', 'Dune Worm', 'Sandman', 'Sphinx', 'Dust Devil', 'Vulture'],
        icons: ['Wind', 'Hourglass', 'Mountain', 'Sun']
    },
    Magma: {
        names: ['Lava Golem', 'Fire Giant', 'Magma Cube', 'Volcano Spirit', 'Salamander', 'Obsidian Knight'],
        icons: ['Flame', 'Mountain', 'Triangle', 'Zap']
    },
    Plague: {
        names: ['Rat King', 'Ooze', 'Fungus', 'Bloater', 'Plague Doctor', 'Swarm', 'Zombie'],
        icons: ['Biohazard', 'Skull', 'Bug', 'Cloud']
    },
    Illusion: {
        names: ['Doppelganger', 'Mirage', 'Phantom', 'Trickster', 'Mask', 'Reflection', 'Dream Eater'],
        icons: ['Eye', 'Ghost', 'Copy', 'Sparkles']
    },
    Gravity: { names: ['Singularity', 'Heavy', 'Crusher'], icons: ['ArrowDownCircle'] },
    Sound: { names: ['Banshee', 'Screamer', 'Siren'], icons: ['Volume2'] },
    Venom: { names: ['Snake', 'Spider', 'Assassin'], icons: ['Syringe'] },
    Crystal: { names: ['Gem Golem', 'Prism', 'Shard'], icons: ['Diamond'] },
    Steam: { names: ['Vent', 'Boiler', 'Mist'], icons: ['Cloud'] },
    Spirit: { names: ['Poltergeist', 'Specter', 'Soul'], icons: ['Ghost'] },
    Cyber: { names: ['Virus', 'Bot', 'Hacker'], icons: ['MonitorX'] },
    Quantum: { names: ['Particle', 'Wave', 'State'], icons: ['Activity'] },
    Dream: { names: ['Nightmare', 'Lucid', 'Sleep'], icons: ['Cloud'] }
};

const FLAVOR_TEMPLATES = [
    "{attacker} strikes {target} with {action}!",
    "{attacker} unleashes {action} on {target}!",
    "A powerful {action} from {attacker} hits {target}!",
    "{target} staggers from {attacker}'s {action}!",
    "{attacker} uses {action}. Direct hit!",
    "{attacker} channels power into {action}, blasting {target}!",
    "With a roar, {attacker} lands a {action} on {target}!"
];

const CRIT_TEMPLATES = [
    "CRITICAL HIT! {attacker} crushes {target} with {action}!",
    "{attacker} finds a weak spot with {action}! Massive damage!",
    "Devastating blow! {attacker}'s {action} deals huge damage!",
    "{target} is reeling from a critical {action} by {attacker}!"
];

// --- GENERATOR FUNCTIONS ---

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateEnemy = async (playerLevel: number): Promise<Enemy> => {
    // 1. Determine Difficulty & Adjectives
    let adjList = ADJECTIVES_LOW;
    let statMult = 1;
    
    if (playerLevel > 3) { adjList = ADJECTIVES_MID; statMult = 1.2; }
    if (playerLevel > 7) { adjList = ADJECTIVES_HIGH; statMult = 1.5; }

    const adjective = getRandomElement(adjList);

    // 2. Determine Element (Include NEW ELEMENTS in the pool)
    const elements: ElementType[] = [
        'Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Ice', 'Light', 'Dark', 'Physical',
        'Nature', 'Metal', 'Blood', 'Time', 'Arcane', 'Gravity', 'Sound', 'Venom',
        'Crystal', 'Steam', 'Spirit', 'Cyber', 'Quantum', 'Dream',
        'Cosmic', 'Chaos', 'Sand', 'Magma', 'Plague', 'Illusion'
    ];
    const element = getRandomElement(elements);
    
    // 3. Pick Monster Name & Icon
    // Fallback to Physical if explicit data missing (though we covered most)
    const data = MONSTER_DATA[element] || MONSTER_DATA.Physical;
    const baseName = getRandomElement(data.names || ['Monster']);
    const icon = getRandomElement(data.icons || ['Skull']);

    const fullName = `${adjective} ${baseName}`;

    // 4. Calculate Stats
    // Base HP grows with level + some variance
    const baseHp = 50 + (playerLevel * 25);
    const hpVariance = 0.8 + (Math.random() * 0.4); // 0.8x to 1.2x
    const maxHp = Math.floor(baseHp * hpVariance * statMult);

    return {
        name: fullName,
        description: `A ${adjective.toLowerCase()} creature of ${element.toLowerCase()}.`,
        maxHp: maxHp,
        currentHp: maxHp,
        maxMp: 40 + (playerLevel * 5),
        currentMp: 40 + (playerLevel * 5),
        level: playerLevel,
        element: element,
        xpReward: 20 + (playerLevel * 10),
        goldReward: 15 + (playerLevel * 8) + Math.floor(Math.random() * 20),
        iconName: icon,
        isBoss: false
    };
};

export const generateCombatFlavor = async (action: string, attacker: string, target: string, damage: number, isCritical: boolean) => {
    const templates = isCritical ? CRIT_TEMPLATES : FLAVOR_TEMPLATES;
    const template = getRandomElement(templates);

    return template
        .replace("{attacker}", attacker)
        .replace("{target}", target)
        .replace("{action}", action)
        .replace("{damage}", damage.toString());
};
