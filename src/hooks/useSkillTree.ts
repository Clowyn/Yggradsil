import { useState, useCallback, useMemo, useEffect } from 'react';
import { type Node, type Edge, Position } from '@xyflow/react';
import { type StatKey, STAT_INFO } from '../lib/types';
import { supabase, isSupabaseOffline } from '../lib/supabase';
import { playSound } from '../lib/audio';
import { arcaneToast } from '../lib/toast';

// ─── Skill Status ──────────────────────────────────────────────

export type SkillStatus = 'locked' | 'unlockable' | 'unlocked';

export interface SkillDef {
  id: string;
  dbId?: string;
  name: string;
  nameTr?: string;
  stat: StatKey;
  tier: number;
  description: string;
  descriptionTr?: string;
  xpCost: number;
  icon: string;
  prerequisites: string[];
  effects: {
    description: string;
    statBonus?: Partial<Record<StatKey, number>>;
    stat_bonuses?: Partial<Record<StatKey, number>>;
    savingThrowBonus?: Partial<Record<StatKey, number>>;
    hpBonus?: number;
    acBonus?: number;
    initiativeBonus?: number;
    specialAbility?: string;
    [key: string]: unknown;
  };
}

export interface SkillNodeData {
  skill: SkillDef;
  status: SkillStatus;
  statColor: string;
  statKey: StatKey;
  nodeKind: 'root' | 'branch' | 'skill';
  [key: string]: unknown;
}

export interface SkillEdgeData {
  status: 'unlocked' | 'partial' | 'locked';
  color: string;
  [key: string]: unknown;
}

// ─── Stat metadata extensions ─────────────────────────────────

const STAT_META: Record<StatKey, { fullName: string; emoji: string; description: string }> = {
  STR: { fullName: 'Strength', emoji: '⚔️', description: 'Raw physical power and martial prowess' },
  DEX: { fullName: 'Dexterity', emoji: '🏹', description: 'Speed, reflexes, and agile finesse' },
  CON: { fullName: 'Constitution', emoji: '🛡️', description: 'Endurance, vitality, and fortitude' },
  INT: { fullName: 'Intelligence', emoji: '📖', description: 'Arcane knowledge and mental acuity' },
  WIS: { fullName: 'Wisdom', emoji: '🔮', description: 'Insight, perception, and spiritual awareness' },
  CHA: { fullName: 'Charisma', emoji: '✨', description: 'Force of personality and leadership' },
};

// ─── Demo Skill Definitions ───────────────────────────────────

export const DEMO_SKILLS: SkillDef[] = [
  // ── STR ──
  {
    id: 'str-1', name: 'Power Strike', nameTr: 'Güçlü Darbe', stat: 'STR', tier: 1,
    description: 'Channel raw strength into a devastating blow that sunders armor and bone alike.',
    xpCost: 100, icon: '⚔️', prerequisites: [],
    effects: { description: '+2 melee damage on critical hits', statBonus: { STR: 1 } },
  },
  {
    id: 'str-2', name: 'Iron Will', nameTr: 'Demir İrade', stat: 'STR', tier: 2,
    description: 'Your unyielding resolve fortifies your body against forces that would break lesser warriors.',
    xpCost: 200, icon: '🔩', prerequisites: ['str-1'],
    effects: { description: 'Advantage on STR saving throws', savingThrowBonus: { STR: 2 } },
  },
  {
    id: 'str-3', name: 'Titan Grip', nameTr: 'Titan Tutuşu', stat: 'STR', tier: 2,
    description: 'Wield weapons of enormous size as though they were feathers, your grip unbreakable.',
    xpCost: 250, icon: '🤜', prerequisites: ['str-1'],
    effects: { description: 'Wield two-handed weapons in one hand', statBonus: { STR: 2 } },
  },
  {
    id: 'str-4', name: 'Earthquake Slam', nameTr: 'Deprem Darbesi', stat: 'STR', tier: 3,
    description: 'Strike the earth with cataclysmic force, sending shockwaves that topple all who stand.',
    xpCost: 500, icon: '💥', prerequisites: ['str-2', 'str-3'],
    effects: { description: 'AoE knockdown in 15ft radius', specialAbility: 'Earthquake Slam' },
  },

  // ── DEX ──
  {
    id: 'dex-1', name: 'Swift Dodge', nameTr: 'Çevik Kaçınma', stat: 'DEX', tier: 1,
    description: 'Move with preternatural speed, slipping between attacks like smoke through fingers.',
    xpCost: 100, icon: '💨', prerequisites: [],
    effects: { description: '+1 AC when not wearing heavy armor', acBonus: 1 },
  },
  {
    id: 'dex-2', name: 'Shadow Step', nameTr: 'Gölge Adımı', stat: 'DEX', tier: 2,
    description: 'Dissolve into darkness and reform behind your foe, unseen and unheard.',
    xpCost: 200, icon: '🌑', prerequisites: ['dex-1'],
    effects: { description: 'Teleport 30ft through dim light or darkness', specialAbility: 'Shadow Step' },
  },
  {
    id: 'dex-3', name: 'Blade Dance', nameTr: 'Kılıç Dansı', stat: 'DEX', tier: 2,
    description: 'Enter a whirling trance of steel, your blades an impenetrable storm of death.',
    xpCost: 250, icon: '🗡️', prerequisites: ['dex-1'],
    effects: { description: 'Extra attack when dual wielding', statBonus: { DEX: 1 } },
  },
  {
    id: 'dex-4', name: 'Wind Walker', nameTr: 'Rüzgar Yürüyen', stat: 'DEX', tier: 3,
    description: 'Become one with the wind itself—your movements leave no trace, no sound, no shadow.',
    xpCost: 450, icon: '🌪️', prerequisites: ['dex-2'],
    effects: { description: 'Advantage on stealth, +10ft movement', initiativeBonus: 3 },
  },

  // ── CON ──
  {
    id: 'con-1', name: 'Stone Skin', nameTr: 'Taş Deri', stat: 'CON', tier: 1,
    description: 'Your flesh hardens like ancient granite, turning blades and shrugging off blows.',
    xpCost: 100, icon: '🪨', prerequisites: [],
    effects: { description: 'Resistance to non-magical bludgeoning', hpBonus: 5 },
  },
  {
    id: 'con-2', name: 'Vital Surge', nameTr: 'Yaşam Dalgalanması', stat: 'CON', tier: 2,
    description: 'Draw upon deep reserves of life force, mending wounds with sheer vitality.',
    xpCost: 200, icon: '❤️‍🔥', prerequisites: ['con-1'],
    effects: { description: 'Heal 1d10 HP as a bonus action, 1/short rest', hpBonus: 10 },
  },
  {
    id: 'con-3', name: 'Undying Resolve', nameTr: 'Ölümsüz Azim', stat: 'CON', tier: 2,
    description: 'When death reaches for you, your body refuses to yield, clinging to life with iron tenacity.',
    xpCost: 300, icon: '💀', prerequisites: ['con-1'],
    effects: { description: 'Drop to 1 HP instead of 0, once per long rest', savingThrowBonus: { CON: 2 } },
  },
  {
    id: 'con-4', name: 'Fortress Body', nameTr: 'Kale Beden', stat: 'CON', tier: 3,
    description: 'Your body becomes an impregnable fortress—poison, disease, and exhaustion cannot touch you.',
    xpCost: 500, icon: '🏰', prerequisites: ['con-2', 'con-3'],
    effects: { description: 'Immunity to poison and disease', statBonus: { CON: 3 }, hpBonus: 20 },
  },

  // ── INT ──
  {
    id: 'int-1', name: 'Arcane Focus', nameTr: 'Arkan Odak', stat: 'INT', tier: 1,
    description: 'Sharpen your mind into a crystal lens, amplifying the arcane energies you channel.',
    xpCost: 100, icon: '🔮', prerequisites: [],
    effects: { description: '+1 spell attack rolls', statBonus: { INT: 1 } },
  },
  {
    id: 'int-2', name: 'Mind Shield', nameTr: 'Zihin Kalkanı', stat: 'INT', tier: 2,
    description: 'Erect impenetrable psychic barriers around your consciousness, warding off all intrusion.',
    xpCost: 200, icon: '🧠', prerequisites: ['int-1'],
    effects: { description: 'Resistance to psychic damage, advantage on INT saves', savingThrowBonus: { INT: 2 } },
  },
  {
    id: 'int-3', name: 'Spell Weave', nameTr: 'Büyü Dokuma', stat: 'INT', tier: 2,
    description: 'Intertwine multiple threads of magic simultaneously, casting with impossible speed.',
    xpCost: 300, icon: '🕸️', prerequisites: ['int-1'],
    effects: { description: 'Cast a cantrip as a bonus action', specialAbility: 'Spell Weave' },
  },
  {
    id: 'int-4', name: 'Omniscience', nameTr: 'Mutlak Bilgi', stat: 'INT', tier: 3,
    description: 'Touch the infinite well of knowledge—for a fleeting moment, you know everything.',
    xpCost: 600, icon: '👁️', prerequisites: ['int-2', 'int-3'],
    effects: { description: 'Gain proficiency in all INT skills for 1 minute, 1/long rest', statBonus: { INT: 3 } },
  },

  // ── WIS ──
  {
    id: 'wis-1', name: 'Nature Sense', nameTr: 'Doğa Sezgisi', stat: 'WIS', tier: 1,
    description: 'Attune your senses to the pulse of the natural world, reading signs invisible to others.',
    xpCost: 100, icon: '🌿', prerequisites: [],
    effects: { description: 'Advantage on Survival and Perception in natural terrain', statBonus: { WIS: 1 } },
  },
  {
    id: 'wis-2', name: 'Spirit Link', nameTr: 'Ruh Bağı', stat: 'WIS', tier: 2,
    description: 'Form a shimmering bond between souls, sharing strength and sensation across the veil.',
    xpCost: 200, icon: '👻', prerequisites: ['wis-1'],
    effects: { description: 'Telepathic bond with one ally within 120ft', specialAbility: 'Spirit Link' },
  },
  {
    id: 'wis-3', name: 'Prophecy', nameTr: 'Kehanet', stat: 'WIS', tier: 2,
    description: 'Glimpse the threads of fate, seeing moments before they unfold with terrible clarity.',
    xpCost: 300, icon: '⏳', prerequisites: ['wis-1'],
    effects: { description: 'Once per day, reroll any d20 with advantage', savingThrowBonus: { WIS: 2 } },
  },
  {
    id: 'wis-4', name: 'Astral Sight', nameTr: 'Astral Görüş', stat: 'WIS', tier: 3,
    description: 'Open your third eye to the Astral Plane, perceiving the true nature of all things.',
    xpCost: 500, icon: '✨', prerequisites: ['wis-2', 'wis-3'],
    effects: { description: 'See invisible/ethereal, true sight 60ft', statBonus: { WIS: 3 } },
  },

  // ── CHA ──
  {
    id: 'cha-1', name: 'Inspire', nameTr: 'İlham', stat: 'CHA', tier: 1,
    description: 'Your words ignite courage and purpose in the hearts of those who hear you speak.',
    xpCost: 100, icon: '🎵', prerequisites: [],
    effects: { description: 'Grant ally 1d6 inspiration die', statBonus: { CHA: 1 } },
  },
  {
    id: 'cha-2', name: 'Silver Tongue', nameTr: 'Gümüş Dil', stat: 'CHA', tier: 2,
    description: 'Speak with honeyed eloquence that bends the will of even the most stubborn minds.',
    xpCost: 200, icon: '🗣️', prerequisites: ['cha-1'],
    effects: { description: 'Advantage on Persuasion and Deception checks', statBonus: { CHA: 1 } },
  },
  {
    id: 'cha-3', name: 'Commanding Aura', nameTr: 'Hükmeden Aura', stat: 'CHA', tier: 2,
    description: 'Emanate an aura of absolute authority; even enemies falter before your regal bearing.',
    xpCost: 300, icon: '👑', prerequisites: ['cha-1'],
    effects: { description: 'Frighten enemies within 30ft, WIS save DC 15', specialAbility: 'Commanding Aura' },
  },
  {
    id: 'cha-4', name: 'Soul Blaze', nameTr: 'Ruh Alevi', stat: 'CHA', tier: 3,
    description: 'Unleash the full radiance of your soul—a blinding inferno of charisma made manifest.',
    xpCost: 550, icon: '🔥', prerequisites: ['cha-2', 'cha-3'],
    effects: { description: 'Charm all creatures in 60ft, 1/long rest', statBonus: { CHA: 3 } },
  },
];

// ─── Aggregated Bonus Computation ──────────────────────────────

export interface AggregatedSkillBonuses {
  statBonuses: Record<StatKey, number>;
  savingThrowBonuses: Record<StatKey, number>;
  hpBonus: number;
  acBonus: number;
  initiativeBonus: number;
  unlockedDefs: SkillDef[];
}

export function computeSkillBonuses(
  unlockedIdentifiers: Iterable<string>,
  catalog: SkillDef[] = DEMO_SKILLS
): AggregatedSkillBonuses {
  const statBonuses: Record<StatKey, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
  const savingThrowBonuses: Record<StatKey, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
  let hpBonus = 0;
  let acBonus = 0;
  let initiativeBonus = 0;
  const unlockedDefs: SkillDef[] = [];
  const seenIds = new Set<string>();

  for (const identifier of unlockedIdentifiers) {
    const norm = identifier.trim().toLowerCase();
    const matched = catalog.find(
      (s) =>
        s.id.toLowerCase() === norm ||
        s.dbId?.toLowerCase() === norm ||
        s.name.toLowerCase() === norm ||
        s.nameTr?.toLowerCase() === norm
    );
    if (!matched || seenIds.has(matched.id)) continue;
    seenIds.add(matched.id);
    unlockedDefs.push(matched);

    const sb = matched.effects?.statBonus || matched.effects?.stat_bonuses;
    if (sb) {
      (Object.keys(sb) as StatKey[]).forEach((k) => {
        if (statBonuses[k] !== undefined && typeof sb[k] === 'number') {
          statBonuses[k] += sb[k]!;
        }
      });
    }

    const stb = matched.effects?.savingThrowBonus;
    if (stb) {
      (Object.keys(stb) as StatKey[]).forEach((k) => {
        if (savingThrowBonuses[k] !== undefined && typeof stb[k] === 'number') {
          savingThrowBonuses[k] += stb[k]!;
        }
      });
    }

    if (typeof matched.effects?.hpBonus === 'number') {
      hpBonus += matched.effects.hpBonus;
    }
    if (typeof matched.effects?.acBonus === 'number') {
      acBonus += matched.effects.acBonus;
    }
    if (typeof matched.effects?.initiativeBonus === 'number') {
      initiativeBonus += matched.effects.initiativeBonus;
    }
  }

  return {
    statBonuses,
    savingThrowBonuses,
    hpBonus,
    acBonus,
    initiativeBonus,
    unlockedDefs,
  };
}

// ─── Layout Constants ──────────────────────────────────────────

const BRANCH_SPACING = 320;
const TIER_SPACING = 180;
const ROOT_Y = 0;
const BRANCH_START_Y = 200;
const STAT_ORDER: StatKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

// ─── Hook ──────────────────────────────────────────────────────

interface UseSkillTreeOptions {
  characterId?: string | null;
  unlockedSkillIds?: string[];
  availableXp?: number;
}

export function useSkillTree(options: UseSkillTreeOptions = {}) {
  const {
    characterId = null,
    unlockedSkillIds: initialUnlocked = ['str-1', 'dex-1'],
    availableXp: initialXp = 1500,
  } = options;

  const [skillsCatalog, setSkillsCatalog] = useState<SkillDef[]>(DEMO_SKILLS);
  const [unlockedSkills, setUnlockedSkills] = useState<Set<string>>(() => {
    if (characterId) {
      try {
        const cached = localStorage.getItem(`dnd_unlocked_skills_${characterId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as string[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return new Set(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    return new Set(initialUnlocked);
  });
  const [xp, setXp] = useState<number>(initialXp);

  // Sync XP when character's availableXp prop changes
  useEffect(() => {
    if (options.availableXp !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setXp(options.availableXp);
    }
  }, [options.availableXp]);

  // Load skill definitions & character_skills from Supabase
  const fetchCharacterSkills = useCallback(async () => {
    const resolvedKeys = new Set<string>();

    // Read local cache for this character first so offline or slow network never drops local state
    if (characterId) {
      try {
        const cached = localStorage.getItem(`dnd_unlocked_skills_${characterId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as string[];
          if (Array.isArray(parsed)) {
            parsed.forEach((k) => resolvedKeys.add(k));
          }
        }
      } catch {
        // ignore
      }
    }

    if (isSupabaseOffline()) {
      setUnlockedSkills(resolvedKeys.size > 0 ? resolvedKeys : new Set(['str-1', 'dex-1']));
      return;
    }

    try {
      const { data: defsData, error: defsErr } = await supabase
        .from('skill_definitions')
        .select('*');

      let activeCatalog = DEMO_SKILLS;
      if (!defsErr && defsData && defsData.length > 0) {
        const mappedCatalog: SkillDef[] = DEMO_SKILLS.map((demo) => {
          const dbMatch = defsData.find(
            (d) =>
              d.skill_key === demo.id ||
              d.name_en?.toLowerCase() === demo.name.toLowerCase() ||
              d.name_tr?.toLowerCase() === demo.nameTr?.toLowerCase()
          );
          if (!dbMatch) return demo;
          return {
            ...demo,
            dbId: dbMatch.id,
            name: dbMatch.name_en || demo.name,
            nameTr: dbMatch.name_tr || demo.nameTr,
            description: dbMatch.description_en || demo.description,
            descriptionTr: dbMatch.description_tr || demo.descriptionTr,
            xpCost: typeof dbMatch.xp_cost === 'number' ? dbMatch.xp_cost : demo.xpCost,
            tier: typeof dbMatch.tier === 'number' ? dbMatch.tier : demo.tier,
            prerequisites:
              Array.isArray(dbMatch.prerequisites) && dbMatch.prerequisites.length > 0
                ? dbMatch.prerequisites
                : demo.prerequisites,
            icon: (dbMatch as { icon?: string }).icon || demo.icon,
            effects:
              dbMatch.effects && Object.keys(dbMatch.effects).length > 0
                ? { ...demo.effects, ...(dbMatch.effects as Record<string, unknown>) }
                : demo.effects,
          };
        });
        activeCatalog = mappedCatalog;
        setSkillsCatalog(mappedCatalog);
      }

      if (!characterId) return;

      const { data: charSkills, error: csErr } = await supabase
        .from('character_skills')
        .select('*, skill_definition:skill_definitions(*)')
        .eq('character_id', characterId)
        .eq('unlocked', true);

      if (!csErr && charSkills && charSkills.length > 0) {
        charSkills.forEach((row) => {
          const def = Array.isArray(row.skill_definition)
            ? row.skill_definition[0]
            : row.skill_definition;
          if (def?.skill_key) {
            resolvedKeys.add(def.skill_key);
          } else if (def?.name_en) {
            const match = activeCatalog.find(
              (s) => s.name.toLowerCase() === def.name_en.toLowerCase()
            );
            if (match) resolvedKeys.add(match.id);
          } else {
            const matchById = activeCatalog.find((s) => s.dbId === row.skill_definition_id);
            if (matchById) resolvedKeys.add(matchById.id);
          }
        });
      }

      const finalSet = resolvedKeys.size > 0 ? resolvedKeys : new Set(['str-1', 'dex-1']);
      setUnlockedSkills(finalSet);
      if (resolvedKeys.size > 0) {
        try {
          localStorage.setItem(
            `dnd_unlocked_skills_${characterId}`,
            JSON.stringify(Array.from(finalSet))
          );
        } catch {
          // ignore
        }
      }
    } catch {
      // Fallback to local cache or defaults when network fails
      setUnlockedSkills(resolvedKeys.size > 0 ? resolvedKeys : new Set(['str-1', 'dex-1']));
    }
  }, [characterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCharacterSkills();

    if (!characterId) return;

    const channel = supabase
      .channel(`character-skills-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_skills',
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          fetchCharacterSkills();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, fetchCharacterSkills]);

  // Determine skill status
  const getSkillStatus = useCallback(
    (skill: SkillDef): SkillStatus => {
      if (unlockedSkills.has(skill.id)) return 'unlocked';
      const prerequisitesMet = skill.prerequisites.every((prereq) => unlockedSkills.has(prereq));
      if (prerequisitesMet && xp >= skill.xpCost) return 'unlockable';
      return 'locked';
    },
    [unlockedSkills, xp],
  );

  // Build nodes
  const nodes = useMemo<Node<SkillNodeData>[]>(() => {
    const result: Node<SkillNodeData>[] = [];
    const totalWidth = (STAT_ORDER.length - 1) * BRANCH_SPACING;
    const startX = -totalWidth / 2;

    // ── Yggdrasil Core (root: 100x100) ──
    result.push({
      id: 'yggdrasil-core',
      type: 'skillNode',
      position: { x: -50, y: ROOT_Y },
      data: {
        skill: {
          id: 'yggdrasil-core',
          name: 'Yggdrasil Core',
          stat: 'STR' as StatKey,
          description: 'The World Tree — source of all power. All skill branches grow from this ancient root.',
          xpCost: 0,
          icon: '🌳',
          tier: 0,
          prerequisites: [],
          effects: { description: 'The root of all power' },
        },
        status: 'unlocked' as SkillStatus,
        statColor: '#ffd700',
        statKey: 'STR' as StatKey,
        nodeKind: 'root',
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    // ── Stat branch roots + skill nodes ──
    STAT_ORDER.forEach((statKey, branchIndex) => {
      const branchX = startX + branchIndex * BRANCH_SPACING;
      const info = STAT_INFO[statKey];
      const meta = STAT_META[statKey];
      const branchSkills = skillsCatalog.filter((s) => s.stat === statKey);

      // Stat label node (branch root: 90x90)
      const branchRootId = `branch-${statKey}`;
      result.push({
        id: branchRootId,
        type: 'skillNode',
        position: { x: branchX - 45, y: BRANCH_START_Y },
        data: {
          skill: {
            id: branchRootId,
            name: meta.fullName,
            stat: statKey,
            description: meta.description,
            xpCost: 0,
            icon: meta.emoji,
            tier: 0,
            prerequisites: [],
            effects: { description: `${meta.fullName} branch of the World Tree` },
          },
          status: 'unlocked' as SkillStatus,
          statColor: info.color,
          statKey: statKey,
          nodeKind: 'branch',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      // Skill nodes in the branch (skill node: 80x80)
      branchSkills.forEach((skill) => {
        const tier = skill.tier;
        const sameTierSkills = branchSkills.filter((s) => s.tier === tier);
        const indexInTier = sameTierSkills.indexOf(skill);
        const tierCount = sameTierSkills.length;

        const spread = 120;
        const xOffset = tierCount > 1
          ? (indexInTier - (tierCount - 1) / 2) * spread
          : 0;

        result.push({
          id: skill.id,
          type: 'skillNode',
          position: {
            x: branchX + xOffset - 40,
            y: BRANCH_START_Y + tier * TIER_SPACING,
          },
          data: {
            skill,
            status: getSkillStatus(skill),
            statColor: info.color,
            statKey: statKey,
            nodeKind: 'skill',
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });

    return result;
  }, [getSkillStatus, skillsCatalog]);

  // Build edges
  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];

    STAT_ORDER.forEach((statKey) => {
      const branchRootId = `branch-${statKey}`;
      const info = STAT_INFO[statKey];

      // Core → branch root
      result.push({
        id: `edge-core-${statKey}`,
        source: 'yggdrasil-core',
        target: branchRootId,
        type: 'skillEdge',
        data: { status: 'unlocked', color: info.color } as SkillEdgeData,
      });

      // Branch root → tier-1 skills
      const branchSkills = skillsCatalog.filter((s) => s.stat === statKey);
      const tier1Skills = branchSkills.filter((s) => s.tier === 1);

      tier1Skills.forEach((skill) => {
        const targetStatus = getSkillStatus(skill);
        const edgeStatus: SkillEdgeData['status'] =
          targetStatus === 'unlocked'
            ? 'unlocked'
            : targetStatus === 'unlockable'
              ? 'partial'
              : 'locked';

        result.push({
          id: `edge-${branchRootId}-${skill.id}`,
          source: branchRootId,
          target: skill.id,
          type: 'skillEdge',
          data: { status: edgeStatus, color: info.color } as SkillEdgeData,
        });
      });

      // Prerequisite edges
      branchSkills.forEach((skill) => {
        skill.prerequisites.forEach((prereqId) => {
          const prereqSkill = skillsCatalog.find((s) => s.id === prereqId);
          if (!prereqSkill) return;
          const sourceStatus = getSkillStatus(prereqSkill);
          const targetStatus = getSkillStatus(skill);
          const edgeStatus: SkillEdgeData['status'] =
            sourceStatus === 'unlocked' && targetStatus === 'unlocked'
              ? 'unlocked'
              : sourceStatus === 'unlocked' && targetStatus === 'unlockable'
                ? 'partial'
                : 'locked';

          result.push({
            id: `edge-${prereqId}-${skill.id}`,
            source: prereqId,
            target: skill.id,
            type: 'skillEdge',
            data: { status: edgeStatus, color: info.color } as SkillEdgeData,
          });
        });
      });
    });

    return result;
  }, [getSkillStatus, skillsCatalog]);

  // Node click handler with live Supabase persistence
  const onNodeClick = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as SkillNodeData;
      if (!data?.skill) return;

      if (data.status === 'unlockable') {
        const skill = data.skill;
        playSound('unlock');

        const nextUnlocked = new Set(unlockedSkills);
        nextUnlocked.add(skill.id);
        setUnlockedSkills(nextUnlocked);

        const nextXp = Math.max(0, xp - skill.xpCost);
        setXp(nextXp);

        if (characterId) {
          try {
            localStorage.setItem(
              `dnd_unlocked_skills_${characterId}`,
              JSON.stringify(Array.from(nextUnlocked))
            );
          } catch {
            // ignore
          }

          try {
            const { error: rpcErr } = await supabase.rpc('unlock_skill', {
              char_id: characterId,
              p_skill_key: skill.id,
              xp_val_cost: skill.xpCost,
            });

            if (rpcErr) {
              // Fallback: direct table update + character_skills insert
              await supabase
                .from('characters')
                .update({
                  xp_available: nextXp,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', characterId);

              let targetDefId = skill.dbId;
              if (!targetDefId) {
                const { data: existingDef } = await supabase
                  .from('skill_definitions')
                  .select('id')
                  .or(`skill_key.eq.${skill.id},name_en.eq.${skill.name}`)
                  .maybeSingle();
                targetDefId = existingDef?.id;
              }

              if (targetDefId) {
                await supabase.from('character_skills').upsert(
                  {
                    character_id: characterId,
                    skill_definition_id: targetDefId,
                    unlocked: true,
                    unlocked_at: new Date().toISOString(),
                  },
                  { onConflict: 'character_id,skill_definition_id' }
                );
              }
            }
          } catch (err) {
            console.warn('Skill unlock persisted locally (DB fallback):', err);
          }
        }

        arcaneToast.success(`${skill.name} unlocked! (${skill.effects.description})`);
      }
    },
    [unlockedSkills, xp, characterId],
  );

  return {
    nodes,
    edges,
    onNodeClick,
    xp,
    unlockedSkills: Array.from(unlockedSkills),
    totalSkills: skillsCatalog.length,
    unlockedCount: unlockedSkills.size,
  };
}
