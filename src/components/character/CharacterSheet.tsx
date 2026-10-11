import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Heart, Zap, Sword, Sparkles, Award, User,
  Backpack, ChevronRight, Compass, Flame, Eye, Activity,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import type { Character, StatKey, ItemRarity } from '../../lib/types';
import { RARITY_COLORS } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface CharacterSheetProps {
  character: Character;
  onOpenCreation?: () => void;
}

interface CharacterStatRow {
  stat_key: StatKey;
  base_value: number;
  bonus_value: number;
}

interface EquippedItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  type: string;
  icon: string;
  properties?: Record<string, string>;
}

const STAT_LABELS: Record<StatKey, { en: string; tr: string; descEn: string; descTr: string }> = {
  STR: { en: 'Strength', tr: 'Kuvvet', descEn: 'Physical power and melee attacks', descTr: 'Fiziksel güç ve yakın dövüş' },
  DEX: { en: 'Dexterity', tr: 'Çeviklik', descEn: 'Agility, reflexes, and balance', descTr: 'Çeviklik, refleksler ve denge' },
  CON: { en: 'Constitution', tr: 'Dayanıklılık', descEn: 'Health, stamina, and vital force', descTr: 'Sağlık, direnç ve yaşamsal güç' },
  INT: { en: 'Intelligence', tr: 'Zeka', descEn: 'Reasoning, memory, and arcane lore', descTr: 'Mantık, hafıza ve büyü ilmi' },
  WIS: { en: 'Wisdom', tr: 'Bilgelik', descEn: 'Perception, insight, and willpower', descTr: 'Algı, sezgi ve irade' },
  CHA: { en: 'Charisma', tr: 'Karizma', descEn: 'Force of personality and presence', descTr: 'Kişilik gücü ve liderlik' },
};

const SKILL_MAP: Array<{ key: string; nameEn: string; nameTr: string; stat: StatKey }> = [
  { key: 'athletics', nameEn: 'Athletics', nameTr: 'Atletizm', stat: 'STR' },
  { key: 'acrobatics', nameEn: 'Acrobatics', nameTr: 'Akrobasi', stat: 'DEX' },
  { key: 'sleight_of_hand', nameEn: 'Sleight of Hand', nameTr: 'El Çabukluğu', stat: 'DEX' },
  { key: 'stealth', nameEn: 'Stealth', nameTr: 'Gizlilik', stat: 'DEX' },
  { key: 'arcana', nameEn: 'Arcana', nameTr: 'Büyü Bilgisi', stat: 'INT' },
  { key: 'history', nameEn: 'History', nameTr: 'Tarih', stat: 'INT' },
  { key: 'investigation', nameEn: 'Investigation', nameTr: 'Soruşturma', stat: 'INT' },
  { key: 'nature', nameEn: 'Nature', nameTr: 'Doğa', stat: 'INT' },
  { key: 'religion', nameEn: 'Religion', nameTr: 'Din', stat: 'INT' },
  { key: 'animal_handling', nameEn: 'Animal Handling', nameTr: 'Hayvan Terbiyesi', stat: 'WIS' },
  { key: 'insight', nameEn: 'Insight', nameTr: 'Sezgi', stat: 'WIS' },
  { key: 'medicine', nameEn: 'Medicine', nameTr: 'Tıp', stat: 'WIS' },
  { key: 'perception', nameEn: 'Perception', nameTr: 'Algı', stat: 'WIS' },
  { key: 'survival', nameEn: 'Survival', nameTr: 'Hayatta Kalma', stat: 'WIS' },
  { key: 'deception', nameEn: 'Deception', nameTr: 'Aldatma', stat: 'CHA' },
  { key: 'intimidation', nameEn: 'Intimidation', nameTr: 'Gözdağı', stat: 'CHA' },
  { key: 'performance', nameEn: 'Performance', nameTr: 'Performans', stat: 'CHA' },
  { key: 'persuasion', nameEn: 'Persuasion', nameTr: 'İkna', stat: 'CHA' },
];

export function CharacterSheet({ character, onOpenCreation }: CharacterSheetProps) {
  const { locale } = useAuth();
  const isTr = locale === 'tr';

  const [dbStats, setDbStats] = useState<CharacterStatRow[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const { data: statsData } = await supabase
          .from('character_stats')
          .select('stat_key, base_value, bonus_value')
          .eq('character_id', character.id);

        if (isMounted && statsData && statsData.length > 0) {
          setDbStats(statsData as CharacterStatRow[]);
        }

        const { data: itemsData } = await supabase
          .from('inventory_items')
          .select(`
            id,
            equipped,
            item_definition:item_definitions(
              name,
              rarity,
              type,
              icon_url,
              properties
            )
          `)
          .eq('character_id', character.id)
          .eq('equipped', true);

        if (isMounted) {
          if (itemsData && itemsData.length > 0) {
            const mapped: EquippedItem[] = itemsData.map((row) => {
              const def = Array.isArray(row.item_definition) ? row.item_definition[0] : row.item_definition;
              return {
                id: row.id,
                name: def?.name || 'Equipped Item',
                rarity: (def?.rarity as ItemRarity) || 'common',
                type: def?.type || 'gear',
                icon: def?.icon_url || '🗡️',
                properties: (def?.properties as Record<string, string>) || {},
              };
            });
            setEquippedItems(mapped);
          } else {
            setEquippedItems([
              { id: 'eq-1', name: 'Reforged Longsword', rarity: 'rare', type: 'weapon', icon: '🗡️', properties: { Damage: '1d8+2' } },
              { id: 'eq-2', name: 'Shadowmail Vestment', rarity: 'uncommon', type: 'armor', icon: '🛡️', properties: { AC: '+3' } },
              { id: 'eq-3', name: 'Ring of Minor Warding', rarity: 'rare', type: 'ring', icon: '💍', properties: { SaveBonus: '+1' } },
            ]);
          }
          setLoadingDetails(false);
        }
      } catch (err) {
        console.warn('Could not load detailed character stats/items:', err);
        if (isMounted) {
          setLoadingDetails(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [character.id]);

  // Ability scores with fallbacks to race + subclass
  const stats = useMemo(() => {
    const statKeys: StatKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const raceBonuses = (character.race?.stat_bonuses as Record<string, number>) || {};
    const classBases = (character.subclass?.base_stats as Record<string, number>) || {};

    const result: Record<StatKey, { score: number; mod: number; modStr: string }> = {} as Record<
      StatKey,
      { score: number; mod: number; modStr: string }
    >;

    statKeys.forEach((key) => {
      const dbStat = dbStats.find((s) => s.stat_key === key);
      let score: number;
      if (dbStat) {
        score = dbStat.base_value + dbStat.bonus_value;
      } else {
        const raceBonus = raceBonuses[key] || 0;
        const classBase = classBases[key] || 10;
        score = classBase + raceBonus;
      }
      const mod = Math.floor((score - 10) / 2);
      result[key] = {
        score,
        mod,
        modStr: mod >= 0 ? `+${mod}` : `${mod}`,
      };
    });

    return result;
  }, [character, dbStats]);

  const level = character.level || 1;
  const profBonus = Math.floor((level - 1) / 4) + 2;
  const profBonusStr = `+${profBonus}`;

  // Calculated Vitals
  const conMod = stats.CON.mod;
  const dexMod = stats.DEX.mod;
  const wisMod = stats.WIS.mod;

  const maxHP = 50 + conMod * 5 + (level - 1) * 6;
  const currentHP = maxHP; // Active full health by default
  const armorBonus = equippedItems.find((i) => i.type === 'armor') ? 3 : 0;
  const armorClass = 10 + dexMod + armorBonus;
  const initiative = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  const speed = 30;
  const passivePerception = 10 + wisMod + profBonus;

  // XP calculations
  const nextLevelXp = level * 1000;
  const xpCurrent = character.xp_total || 0;
  const xpAvailable = character.xp_available ?? 0;
  const xpProgressPercent = Math.min(100, Math.round((xpCurrent / nextLevelXp) * 100));

  // Saving Throw Proficiencies (Subclass primary stat bias)
  const isProficientSave = (key: StatKey) => {
    const primaryCategory = character.subclass?.category?.key;
    if (primaryCategory === 'combat') return key === 'STR' || key === 'CON';
    if (primaryCategory === 'magic') return key === 'INT' || key === 'WIS';
    if (primaryCategory === 'covert') return key === 'DEX' || key === 'INT';
    return key === 'CON' || key === 'WIS';
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Header & Identity Card ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-panel cyber-cut rounded-lg p-6 border border-gold/40 relative overflow-hidden bg-black/80 shadow-[0_4px_30px_rgba(0,240,255,0.15)]"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar or Class Emblem */}
            <div className="relative">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-b from-[#2a1f0e] to-[#0a0a0f] border-2 border-gold flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.25)] overflow-hidden">
                {character.avatar_url ? (
                  <img
                    src={character.avatar_url}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl select-none">
                    {character.race?.icon_url || '🧙'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gold text-black font-cinzel font-bold text-xs px-2 py-0.5 rounded-md shadow-md border border-white/20">
                Lv. {level}
              </div>
            </div>

            {/* Name and Archetype Titles */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-cinzel font-bold text-gold-gradient tracking-wide">
                  {character.name}
                </h1>
                {character.race?.tier && (
                  <span className="text-[10px] font-inter uppercase tracking-widest px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                    {isTr ? character.race.tier.name_tr : character.race.tier.name_en}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-parchment/80 font-inter">
                <span className="flex items-center gap-1.5 text-white/90 font-medium">
                  <User size={14} className="text-gold" />
                  {character.race?.name || (isTr ? 'Bilinmeyen Irk' : 'Unknown Race')}
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5 text-gold font-medium">
                  <Flame size={14} className="text-gold" />
                  {character.subclass
                    ? isTr
                      ? character.subclass.name_tr
                      : character.subclass.name_en
                    : isTr
                    ? 'Sınıfsız'
                    : 'Unclassed'}
                </span>
                {character.subclass?.category && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/15">
                      {isTr
                        ? character.subclass.category.name_tr
                        : character.subclass.category.name_en}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <Link
              to="/spells"
              className="px-3.5 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            >
              <Sparkles size={14} className="text-cyan-400" />
              {isTr ? 'Büyü Ağacı' : 'Spell Matrix'}
            </Link>
            <Link
              to="/stat-tree"
              className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,255,157,0.15)]"
            >
              <Award size={14} className="text-emerald-400" />
              {isTr ? 'Nöral Statlar' : 'Neural Stats'}
            </Link>
            <Link
              to="/inventory"
              className="px-3.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-400/40 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)]"
            >
              <Backpack size={14} className="text-purple-400" />
              {isTr ? 'Kuantum Kargo' : 'Quantum Cargo'}
            </Link>
            {onOpenCreation && (
              <button
                type="button"
                onClick={onOpenCreation}
                className="px-3.5 py-2 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-400/40 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,0,85,0.15)]"
              >
                <Compass size={14} className="text-pink-400" />
                {isTr ? 'Yeni Ajan Oluştur' : 'New Operator'}
              </button>
            )}
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs mb-1.5 font-inter">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">
                {isTr ? 'Deneyim (XP):' : 'Experience Points:'}
              </span>
              <span className="text-gold font-bold">{xpCurrent.toLocaleString()} XP</span>
              <span className="text-gray-500">/ {nextLevelXp.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {isTr ? 'Harcanabilir XP:' : 'Available XP:'} {xpAvailable.toLocaleString()}
              </span>
              <span className="text-gray-400 font-semibold">{xpProgressPercent}%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 via-gold to-yellow-300 shadow-[0_0_8px_rgba(255,215,0,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* ─── Vitals Hero Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* HP */}
        <div className="holo-card p-3.5 border border-red-500/40 bg-red-950/20 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(255,0,85,0.15)]">
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-orbitron font-bold mb-1">
            <Heart size={14} className="text-red-500 fill-red-500/20" />
            <span>{isTr ? 'Can Puanı' : 'Hit Points'}</span>
          </div>
          <div className="text-2xl font-orbitron font-extrabold text-red-200">
            {currentHP} <span className="text-xs text-red-400/80">/ {maxHP}</span>
          </div>
          <div className="w-full bg-black/50 h-1.5 rounded-full mt-2 overflow-hidden border border-red-900/50">
            <div className="bg-gradient-to-r from-red-600 to-red-400 h-full w-full shadow-[0_0_6px_#ff0055]" />
          </div>
        </div>

        {/* Armor Class */}
        <div className="holo-card p-3.5 border border-cyan-400/40 bg-cyan-950/20 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-orbitron font-bold mb-1">
            <Shield size={14} className="text-cyan-400" />
            <span>{isTr ? 'Zırh Sınıfı (AC)' : 'Armor Class'}</span>
          </div>
          <div className="text-2xl font-orbitron font-extrabold text-cyan-200">{armorClass}</div>
          <span className="text-[10px] text-cyan-400/70 font-mono mt-1">
            {armorBonus > 0 ? (isTr ? '+3 Zırh dahil' : '+3 Armor bonus') : (isTr ? 'Temel Refleks' : 'Base Dexterity')}
          </span>
        </div>

        {/* Initiative */}
        <div className="holo-card p-3.5 border border-amber-500/40 bg-amber-950/20 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-orbitron font-bold mb-1">
            <Sword size={14} className="text-amber-400" />
            <span>{isTr ? 'İnisiyatif' : 'Initiative'}</span>
          </div>
          <div className="text-2xl font-orbitron font-extrabold text-amber-200">{initiative}</div>
          <span className="text-[10px] text-amber-400/70 font-mono mt-1">DEX mod</span>
        </div>

        {/* Speed */}
        <div className="holo-card p-3.5 border border-emerald-500/40 bg-emerald-950/20 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,255,157,0.15)]">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-orbitron font-bold mb-1">
            <Activity size={14} className="text-emerald-400" />
            <span>{isTr ? 'Hız' : 'Speed'}</span>
          </div>
          <div className="text-2xl font-orbitron font-extrabold text-emerald-200">{speed} <span className="text-xs">ft</span></div>
          <span className="text-[10px] text-emerald-400/70 font-mono mt-1">{isTr ? 'Standart hareket' : 'Base Movement'}</span>
        </div>

        {/* Proficiency Bonus */}
        <div className="holo-card p-3.5 border border-purple-500/40 bg-purple-950/20 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-orbitron font-bold mb-1">
            <Zap size={14} className="text-purple-400" />
            <span>{isTr ? 'Yeterlilik' : 'Proficiency'}</span>
          </div>
          <div className="text-2xl font-orbitron font-extrabold text-purple-200">{profBonusStr}</div>
          <span className="text-[10px] text-purple-400/70 font-mono mt-1">Tier {Math.ceil(level / 4)} bonus</span>
        </div>

        {/* Passive Perception */}
        <div className="holo-card p-3.5 border border-cyan-400/40 bg-cyan-950/20 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-orbitron font-bold mb-1">
            <Eye size={14} className="text-cyan-400" />
            <span>{isTr ? 'Pasif Algı' : 'Passive Sense'}</span>
          </div>
          <div className="text-2xl font-orbitron font-extrabold text-cyan-300">{passivePerception}</div>
          <span className="text-[10px] text-cyan-400/70 font-mono mt-1">10 + WIS + Prof</span>
        </div>
      </div>

      {/* ─── Ability Scores & Saving Throws ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => {
          const statData = stats[key];
          const label = STAT_LABELS[key];
          const proficient = isProficientSave(key);
          const saveBonus = statData.mod + (proficient ? profBonus : 0);
          const saveBonusStr = saveBonus >= 0 ? `+${saveBonus}` : `${saveBonus}`;

          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              className="holo-card p-4 border border-cyan-400/20 hover:border-cyan-400/50 transition-all flex flex-col items-center relative overflow-hidden bg-black/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            >
              <span className="text-xs font-orbitron font-bold text-gray-300 uppercase tracking-widest">
                {isTr ? label.tr : label.en}
              </span>
              <span className="text-xs text-cyan-400 font-mono mt-0.5 font-bold">{key}</span>

              {/* Modifier Big Badge */}
              <div className="my-2 text-2xl font-orbitron font-black text-cyan-300 drop-shadow-[0_0_8px_#00f0ff]">
                {statData.modStr}
              </div>

              {/* Raw Score */}
              <div className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                Score: <strong className="text-white">{statData.score}</strong>
              </div>

              {/* Saving Throw Pill */}
              <div
                className={`mt-3 w-full pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-inter px-1 ${
                  proficient ? 'text-gold font-semibold' : 'text-gray-400'
                }`}
                title={proficient ? 'Proficient Saving Throw' : 'Saving Throw'}
              >
                <span className="flex items-center gap-1">
                  {proficient && <CheckCircle2 size={10} className="text-gold" />}
                  {isTr ? 'Kurtarma' : 'Save'}
                </span>
                <span className="font-mono font-bold">{saveBonusStr}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Two-Column Detail Grid: Skills Matrix & Gear / Level Up ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Skills Matrix (7 cols) */}
        <div className="lg:col-span-7 holo-card p-5 border border-cyan-400/20 bg-black/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-400/15">
            <div className="flex items-center gap-2">
              <Award className="text-cyan-400" size={18} />
              <h3 className="text-sm font-orbitron font-bold text-white uppercase tracking-wider">
                {isTr ? 'Yetenekler ve Beceriler' : 'Skills & Proficiencies'}
              </h3>
            </div>
            <span className="text-[11px] text-parchment-dim font-mono">
              {isTr ? '18 Temel RYO Yeteneği' : '18 Core RPG Skills'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-inter">
            {SKILL_MAP.map((skill) => {
              const statMod = stats[skill.stat].mod;
              const skillProficient = isProficientSave(skill.stat);
              const totalBonus = statMod + (skillProficient ? profBonus : 0);
              const totalBonusStr = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;

              return (
                <div
                  key={skill.key}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-gold/20 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        skillProficient ? 'bg-gold shadow-[0_0_6px_#ffd700]' : 'bg-gray-700'
                      }`}
                    />
                    <span className="text-parchment font-medium truncate">
                      {isTr ? skill.nameTr : skill.nameEn}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">
                      ({skill.stat})
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold ml-2 ${
                      skillProficient ? 'text-gold' : 'text-gray-300'
                    }`}
                  >
                    {totalBonusStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Equipped Gear Preview & Class Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Equipped Items Preview */}
          <div className="holo-card p-5 border border-cyan-400/20 bg-black/60 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-400/15">
              <div className="flex items-center gap-2">
                <Shield className="text-cyan-400" size={18} />
                <h3 className="text-sm font-orbitron font-bold text-white uppercase tracking-wider">
                  {isTr ? 'Kuşanılmış Eşyalar' : 'Equipped Gear'}
                </h3>
              </div>
              <Link
                to="/inventory"
                className="text-xs text-gold/80 hover:text-gold flex items-center gap-1 transition-colors"
              >
                <span>{isTr ? 'Tüm Envanter' : 'Open Inventory'}</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {loadingDetails ? (
              <div className="py-6 text-center text-xs text-gray-500 font-inter">
                {isTr ? 'Donanımlar yükleniyor...' : 'Loading equipment...'}
              </div>
            ) : equippedItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 font-inter">
                {isTr ? 'Kuşanılmış eşya bulunmuyor.' : 'No items currently equipped.'}
              </div>
            ) : (
              <div className="space-y-2">
                {equippedItems.map((item) => {
                  const color = RARITY_COLORS[item.rarity] || '#ffffff';
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between hover:bg-white/[0.06] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div
                            className="text-xs font-bold leading-tight"
                            style={{ color }}
                          >
                            {item.name}
                          </div>
                          <span className="text-[10px] text-gray-400 capitalize">
                            {item.rarity} {item.type}
                          </span>
                        </div>
                      </div>
                      {item.properties && Object.keys(item.properties).length > 0 && (
                        <div className="text-[10px] text-gray-300 font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10">
                          {Object.entries(item.properties)
                            .map(([k, v]) => `${k}: ${v}`)
                            .slice(0, 1)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Level Up & Progression Preview Card */}
          <div className="glass rounded-xl p-5 border border-gold/30 bg-gradient-to-br from-gold/10 via-black/40 to-black/60 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-gold" size={18} />
              <h3 className="text-sm font-cinzel font-bold text-gold uppercase tracking-wider">
                {isTr ? 'Gelişim & Seviye Atlatma' : 'Progression & Level Up'}
              </h3>
            </div>

            <p className="text-xs text-parchment/80 font-inter leading-relaxed mb-4">
              {isTr
                ? `Seviye ${level + 1} için gereken deneyim: ${Math.max(
                    0,
                    nextLevelXp - xpCurrent
                  ).toLocaleString()} XP. Seviye atlandığında Can Puanınız +${5 + conMod} artacak ve Büyü Ağacında yeni yetenek yuvaları açılacaktır.`
                : `XP required for Level ${level + 1}: ${Math.max(
                    0,
                    nextLevelXp - xpCurrent
                  ).toLocaleString()} XP. Upon leveling up, you gain +${5 + conMod} HP and unlock deeper nodes in your class tree.`}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gold/20 text-xs font-inter">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <AlertCircle size={14} />
                <span>
                  {xpAvailable > 0
                    ? isTr
                      ? `${xpAvailable} XP harcanmayı bekliyor!`
                      : `${xpAvailable} XP available to spend!`
                    : isTr
                    ? 'Tüm XP harcandı'
                    : 'All XP utilized'}
                </span>
              </div>
              <Link
                to="/spells"
                className="text-xs text-gold hover:underline font-cinzel font-bold flex items-center gap-1"
              >
                <span>{isTr ? 'Büyüleri Gör' : 'View Spells'}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
