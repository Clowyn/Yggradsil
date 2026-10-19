import type { BestiaryMonster, EncounterCombatant } from './types';

export const DND_BESTIARY: BestiaryMonster[] = [
  {
    id: 'goblin_skirmisher',
    name: 'Goblin Skirmisher',
    nameTr: 'Goblin Avcısı',
    type: 'Humanoid (Goblinoid)',
    typeTr: 'İnsansı (Goblinoid)',
    cr: '1/4',
    xp: 50,
    hp: 7,
    hpFormula: '2d6',
    ac: 15,
    initiativeBonus: 2,
    speed: '30 ft.',
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    actions: [
      {
        name: 'Scimitar',
        nameTr: 'Pala Darbesi',
        attackBonus: 4,
        damageDice: '1d6+2',
        damageType: 'slashing',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target.',
      },
      {
        name: 'Shortbow Volley',
        nameTr: 'Kısa Yay Yaylımı',
        attackBonus: 4,
        damageDice: '1d6+2',
        damageType: 'piercing',
        isAoE: true,
        description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft.',
      },
    ],
  },
  {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    nameTr: 'İskelet Savaşçı',
    type: 'Undead',
    typeTr: 'Hortlak',
    cr: '1/4',
    xp: 50,
    hp: 13,
    hpFormula: '2d8+4',
    ac: 13,
    initiativeBonus: 2,
    speed: '30 ft.',
    stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    actions: [
      {
        name: 'Shortsword',
        nameTr: 'Kısa Kılıç',
        attackBonus: 4,
        damageDice: '1d6+2',
        damageType: 'piercing',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft.',
      },
    ],
  },
  {
    id: 'orc_berserker',
    name: 'Orc Berserker',
    nameTr: 'Ork Vahşisi',
    type: 'Humanoid (Orc)',
    typeTr: 'İnsansı (Ork)',
    cr: '1/2',
    xp: 100,
    hp: 15,
    hpFormula: '2d8+6',
    ac: 13,
    initiativeBonus: 1,
    speed: '30 ft.',
    stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    actions: [
      {
        name: 'Greataxe Cleave',
        nameTr: 'Büyük Balta Biçmesi',
        attackBonus: 5,
        damageDice: '1d12+3',
        damageType: 'slashing',
        isAoE: true,
        description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., heavy cleave.',
      },
    ],
  },
  {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    nameTr: 'Ulu Kurt',
    type: 'Beast',
    typeTr: 'Canavar',
    cr: '1',
    xp: 200,
    hp: 37,
    hpFormula: '5d10+10',
    ac: 14,
    initiativeBonus: 2,
    speed: '50 ft.',
    stats: { str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7 },
    actions: [
      {
        name: 'Pack Bite',
        nameTr: 'Sürü Isırığı',
        attackBonus: 5,
        damageDice: '2d6+3',
        damageType: 'piercing',
        description: 'Melee Weapon Attack: +5 to hit. Target must succeed on DC 13 STR save or be knocked prone.',
      },
    ],
  },
  {
    id: 'ogre_brute',
    name: 'Ogre Brute',
    nameTr: 'Gulyabani Ezici',
    type: 'Giant',
    typeTr: 'Dev',
    cr: '2',
    xp: 450,
    hp: 59,
    hpFormula: '7d10+21',
    ac: 11,
    initiativeBonus: -1,
    speed: '40 ft.',
    stats: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
    actions: [
      {
        name: 'Greatclub Sweep',
        nameTr: 'Dev Sopa Süpürmesi',
        attackBonus: 6,
        damageDice: '2d8+4',
        damageType: 'bludgeoning',
        isAoE: true,
        description: 'Sweeping club strike across frontline targets.',
      },
    ],
  },
  {
    id: 'owlbear',
    name: 'Owlbear',
    nameTr: 'Baykuşayı',
    type: 'Monstrosity',
    typeTr: 'Ucube',
    cr: '3',
    xp: 700,
    hp: 59,
    hpFormula: '7d10+21',
    ac: 13,
    initiativeBonus: 1,
    speed: '40 ft.',
    stats: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    actions: [
      {
        name: 'Rend Claws',
        nameTr: 'Pençe Parçalaması',
        attackBonus: 7,
        damageDice: '2d8+5',
        damageType: 'slashing',
        description: 'Melee Weapon Attack: +7 to hit, ferocious claw rend.',
      },
    ],
  },
  {
    id: 'troll_regenerator',
    name: 'Venomous Troll',
    nameTr: 'Zehirli Trol',
    type: 'Giant',
    typeTr: 'Dev',
    cr: '5',
    xp: 1800,
    hp: 84,
    hpFormula: '8d10+40',
    ac: 15,
    initiativeBonus: 1,
    speed: '30 ft.',
    stats: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 },
    actions: [
      {
        name: 'Frenzied Claws',
        nameTr: 'Çılgın Pençeler',
        attackBonus: 7,
        damageDice: '2d6+4',
        damageType: 'slashing',
        isAoE: true,
        description: 'Multiattack claws lashing at nearby heroes.',
      },
    ],
  },
  {
    id: 'mind_flayer_arcanist',
    name: 'Mind Flayer Arcanist',
    nameTr: 'Zihin Yüzücü Arkanist',
    type: 'Aberration',
    typeTr: 'Sapkın Varlık',
    cr: '7',
    xp: 2900,
    hp: 71,
    hpFormula: '13d8+13',
    ac: 15,
    initiativeBonus: 1,
    speed: '30 ft.',
    stats: { str: 11, dex: 12, con: 12, int: 19, wis: 17, cha: 17 },
    actions: [
      {
        name: 'Mind Blast (AoE)',
        nameTr: 'Zihin Patlaması (Alan)',
        attackBonus: 7,
        damageDice: '4d8+4',
        damageType: 'psychic',
        isAoE: true,
        saveDC: 15,
        saveAbility: 'INT',
        description: '60-foot cone. Creatures must succeed on a DC 15 INT save or take 4d8+4 psychic damage.',
      },
    ],
  },
  {
    id: 'beholder_tyrant',
    name: 'Beholder Eye Tyrant',
    nameTr: 'Beholder Göz Tiranı',
    type: 'Aberration',
    typeTr: 'Sapkın Varlık',
    cr: '13',
    xp: 10000,
    hp: 180,
    hpFormula: '19d10+76',
    ac: 18,
    initiativeBonus: 2,
    speed: '0 ft., fly 20 ft. (hover)',
    stats: { str: 10, dex: 14, con: 18, int: 17, wis: 15, cha: 17 },
    actions: [
      {
        name: 'Eye Rays Barrage',
        nameTr: 'Göz Işınları Yaylımı',
        attackBonus: 9,
        damageDice: '6d8',
        damageType: 'necrotic',
        isAoE: true,
        saveDC: 16,
        saveAbility: 'DEX',
        description: 'Fires multiple magical eye rays across 3 targets (DC 16 DEX save).',
      },
    ],
  },
  {
    id: 'ancient_red_dragon',
    name: 'Ancient Red Dragon',
    nameTr: 'Kadim Kızıl Ejderha',
    type: 'Dragon',
    typeTr: 'Ejderha',
    cr: '24',
    xp: 62000,
    hp: 546,
    hpFormula: '28d20+252',
    ac: 22,
    initiativeBonus: 0,
    speed: '40 ft., climb 40 ft., fly 80 ft.',
    stats: { str: 30, dex: 10, con: 29, int: 18, wis: 15, cha: 23 },
    actions: [
      {
        name: 'Fire Breath (90ft Cone)',
        nameTr: 'Ateş Nefesi (90ft Koni)',
        attackBonus: 17,
        damageDice: '12d6',
        damageType: 'fire',
        isAoE: true,
        saveDC: 21,
        saveAbility: 'DEX',
        description: 'Exhales fire in a 90-foot cone. DC 21 DEX save for half damage.',
      },
      {
        name: 'Dragon Bite',
        nameTr: 'Ejderha Isırığı',
        attackBonus: 17,
        damageDice: '2d10+10',
        damageType: 'piercing',
        description: 'Melee Weapon Attack: +17 to hit, reach 15 ft.',
      },
    ],
  },
];

/**
 * Parses and rolls a D&D dice formula such as "2d6+3", "4d8", "1d12-1".
 * When `isCrit` is true, doubles the number of dice rolled (standard D&D 5e critical hit rule).
 */
export function rollDiceFormula(
  formula: string,
  isCrit = false,
  rng: () => number = Math.random
): { total: number; rolls: number[]; modifier: number } {
  const cleaned = formula.trim().toLowerCase().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    const flat = parseInt(cleaned, 10);
    return {
      total: Number.isNaN(flat) ? 1 : Math.max(1, flat),
      rolls: [],
      modifier: 0,
    };
  }

  const baseCount = Math.max(1, parseInt(match[1], 10));
  const count = isCrit ? baseCount * 2 : baseCount;
  const sides = Math.max(2, parseInt(match[2], 10));
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls: number[] = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(rng() * sides) + 1;
    rolls.push(roll);
    sum += roll;
  }

  return {
    total: Math.max(1, sum + modifier),
    rolls,
    modifier,
  };
}

export interface TargetResolutionOutcome {
  combatantId: string;
  combatantName: string;
  ac: number;
  d20Roll: number;
  rollTotal: number;
  isCrit: boolean;
  isFumble: boolean;
  hitOrFailedSave: boolean;
  savedForHalf: boolean;
  damageApplied: number;
  previousHp: number;
  newHp: number;
}

export interface MultiTargetAttackSummary {
  id: string;
  attackerName: string;
  actionName: string;
  mode: 'attack' | 'save';
  damageDice: string;
  damageType: string;
  outcomes: TargetResolutionOutcome[];
  totalDamageDealt: number;
  timestamp: string;
}

/**
 * Resolves a single-click multi-target attack roll (vs AC) or AoE saving throw (vs DC)
 * across all selected target combatants and calculates updated HP values.
 */
export function resolveMultiTargetAttack(params: {
  attackerName: string;
  actionName: string;
  mode: 'attack' | 'save';
  attackBonus: number;
  saveDC: number;
  saveAbility?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  damageDice: string;
  damageType: string;
  targets: EncounterCombatant[];
  rng?: () => number;
}): MultiTargetAttackSummary {
  const rng = params.rng || Math.random;
  const outcomes: TargetResolutionOutcome[] = [];
  let totalDamageDealt = 0;

  // For AoE saving throws, roll base damage once (standard 5e rule)
  const sharedSaveDamage =
    params.mode === 'save' ? rollDiceFormula(params.damageDice, false, rng).total : 0;

  for (const target of params.targets) {
    const d20Roll = Math.floor(rng() * 20) + 1;

    if (params.mode === 'attack') {
      const isCrit = d20Roll === 20;
      const isFumble = d20Roll === 1;
      const rollTotal = d20Roll + params.attackBonus;
      const hit = isCrit || (!isFumble && rollTotal >= target.ac);

      const damageApplied = hit
        ? rollDiceFormula(params.damageDice, isCrit, rng).total
        : 0;

      const previousHp = target.hp_current;
      const newHp = Math.max(0, previousHp - damageApplied);
      totalDamageDealt += damageApplied;

      outcomes.push({
        combatantId: target.id,
        combatantName: target.name,
        ac: target.ac,
        d20Roll,
        rollTotal,
        isCrit,
        isFumble,
        hitOrFailedSave: hit,
        savedForHalf: false,
        damageApplied,
        previousHp,
        newHp,
      });
    } else {
      // Saving throw mode (1d20 vs saveDC; on save takes half damage)
      const rollTotal = d20Roll;
      const saved = rollTotal >= params.saveDC;
      const damageApplied = saved
        ? Math.max(1, Math.floor(sharedSaveDamage / 2))
        : sharedSaveDamage;

      const previousHp = target.hp_current;
      const newHp = Math.max(0, previousHp - damageApplied);
      totalDamageDealt += damageApplied;

      outcomes.push({
        combatantId: target.id,
        combatantName: target.name,
        ac: target.ac,
        d20Roll,
        rollTotal,
        isCrit: d20Roll === 1, // Nat 1 on save
        isFumble: false,
        hitOrFailedSave: !saved,
        savedForHalf: saved,
        damageApplied,
        previousHp,
        newHp,
      });
    }
  }

  return {
    id: `atk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    attackerName: params.attackerName,
    actionName: params.actionName,
    mode: params.mode,
    damageDice: params.damageDice,
    damageType: params.damageType,
    outcomes,
    totalDamageDealt,
    timestamp: new Date().toISOString(),
  };
}
