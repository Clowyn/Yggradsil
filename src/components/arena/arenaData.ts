export interface ArenaSpell {
  id: string;
  name: string;
  manaCost: number;
  description: string;
  type: 'attack' | 'heal' | 'buff';
  baseDamage?: number;
  baseHeal?: number;
  statusToApply?: {
    type: 'poison' | 'burn' | 'shield' | 'stun';
    value: number;
    remaining_turns: number;
  };
}

export interface ArenaItem {
  id: string;
  name: string;
  quantity: number;
  type: 'heal_hp' | 'heal_mana' | 'cleanse';
  value: number;
  description: string;
}

export function getArenaSpells(locale: string = 'tr'): ArenaSpell[] {
  const isTr = locale === 'tr';
  return [
    {
      id: 'spell-poison',
      name: isTr ? 'Gölge Zehri' : 'Shadow Poison',
      manaCost: 12,
      description: isTr
        ? 'Hedefe 8 hasar vurur ve tur başı 4 hasar veren Zehir durumu (3 tur) uygular.'
        : 'Deals 8 damage and inflicts Poison (4 dmg/turn for 3 turns).',
      type: 'attack',
      baseDamage: 8,
      statusToApply: {
        type: 'poison',
        value: 4,
        remaining_turns: 3,
      },
    },
    {
      id: 'spell-fireball',
      name: isTr ? 'Alev Topu' : 'Fireball',
      manaCost: 18,
      description: isTr
        ? 'Hedefe 18 güçlü alev hasarı fırlatır.'
        : 'Hurls an intense blast dealing 18 fire damage.',
      type: 'attack',
      baseDamage: 18,
    },
    {
      id: 'spell-heal',
      name: isTr ? 'İlahi Şifa' : 'Divine Heal',
      manaCost: 15,
      description: isTr
        ? 'Hedef müttefike veya kendine 25 can (HP) doldurur.'
        : 'Restores 25 HP to target ally or self.',
      type: 'heal',
      baseHeal: 25,
    },
    {
      id: 'spell-shield',
      name: isTr ? 'Mistik Kalkan' : 'Aegis Shield',
      manaCost: 10,
      description: isTr
        ? 'Hedefe 2 tur boyunca +4 Zırh (AC) kalkanı bahşeder.'
        : 'Grants +4 Armor Class (AC) shield to target for 2 turns.',
      type: 'buff',
      statusToApply: {
        type: 'shield',
        value: 4,
        remaining_turns: 2,
      },
    },
  ];
}

export function getInitialArenaItems(locale: string = 'tr'): ArenaItem[] {
  const isTr = locale === 'tr';
  return [
    {
      id: 'item-hp-pot',
      name: isTr ? 'Büyük Can İksiri' : 'Greater Health Potion',
      quantity: 3,
      type: 'heal_hp',
      value: 25,
      description: isTr ? 'Anında 25 Can (HP) tazeler.' : 'Instantly restores 25 HP.',
    },
    {
      id: 'item-mp-pot',
      name: isTr ? 'Mana İksiri' : 'Mana Potion',
      quantity: 3,
      type: 'heal_mana',
      value: 30,
      description: isTr ? 'Anında 30 Mana (MP) tazeler.' : 'Instantly restores 30 Mana.',
    },
    {
      id: 'item-antidote',
      name: isTr ? 'Panzehir' : 'Antidote',
      quantity: 2,
      type: 'cleanse',
      value: 0,
      description: isTr ? 'Üzerindeki Zehir etkisini anında arındırır.' : 'Instantly cleanses all active poison effects.',
    },
  ];
}

export const ARENA_SPELLS: ArenaSpell[] = getArenaSpells('tr');
export const INITIAL_ARENA_ITEMS: ArenaItem[] = getInitialArenaItems('tr');

export const ARCHETYPE_ROSTER = [
  {
    name: 'Valerius Ironclad',
    role: 'Warrior',
    avatar_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80',
    max_hp: 45,
    max_mana: 15,
    ac: 16,
    initiative_score: 14,
  },
  {
    name: 'Morrigan Shadowweaver',
    role: 'Mage',
    avatar_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80',
    max_hp: 28,
    max_mana: 50,
    ac: 12,
    initiative_score: 18,
  },
  {
    name: 'Kaelen Nightblade',
    role: 'Rogue',
    avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
    max_hp: 34,
    max_mana: 25,
    ac: 14,
    initiative_score: 19,
  },
  {
    name: 'Sister Elenore',
    role: 'Cleric',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    max_hp: 38,
    max_mana: 40,
    ac: 15,
    initiative_score: 12,
  },
  {
    name: 'Gorgar Bloodfist',
    role: 'Orc Berserker',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    max_hp: 50,
    max_mana: 10,
    ac: 13,
    initiative_score: 15,
  },
  {
    name: 'Malakor The Cursed',
    role: 'Necromancer',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    max_hp: 30,
    max_mana: 45,
    ac: 11,
    initiative_score: 13,
  },
  {
    name: 'Skarr Venomfang',
    role: 'Goblin Assassin',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    max_hp: 26,
    max_mana: 20,
    ac: 15,
    initiative_score: 20,
  },
  {
    name: 'Vaelen Sunreaver',
    role: 'Paladin',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    max_hp: 44,
    max_mana: 30,
    ac: 17,
    initiative_score: 11,
  },
];
