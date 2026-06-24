import { useState, useCallback, useMemo } from 'react';
import { type Node, type Edge, Position } from '@xyflow/react';
import { type StatKey, STAT_INFO } from '../lib/types';

// ─── Skill Status ──────────────────────────────────────────────

export type SkillStatus = 'locked' | 'unlockable' | 'unlocked';

export interface SkillDef {
  id: string;
  name: string;
  stat: StatKey;
  tier: number;
  description: string;
  xpCost: number;
  icon: string;
  prerequisites: string[];
  effects: { description: string; [key: string]: unknown };
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

const DEMO_SKILLS: SkillDef[] = [
  // ── STR ──
  {
    id: 'str-1', name: 'Power Strike', stat: 'STR', tier: 1,
    description: 'Channel raw strength into a devastating blow that sunders armor and bone alike.',
    xpCost: 100, icon: '⚔️', prerequisites: [],
    effects: { description: '+2 melee damage on critical hits', statBonus: { STR: 1 } },
  },
  {
    id: 'str-2', name: 'Iron Will', stat: 'STR', tier: 2,
    description: 'Your unyielding resolve fortifies your body against forces that would break lesser warriors.',
    xpCost: 200, icon: '🔩', prerequisites: ['str-1'],
    effects: { description: 'Advantage on STR saving throws', savingThrowBonus: { STR: 2 } },
  },
  {
    id: 'str-3', name: 'Titan Grip', stat: 'STR', tier: 2,
    description: 'Wield weapons of enormous size as though they were feathers, your grip unbreakable.',
    xpCost: 250, icon: '🤜', prerequisites: ['str-1'],
    effects: { description: 'Wield two-handed weapons in one hand', statBonus: { STR: 2 } },
  },
  {
    id: 'str-4', name: 'Earthquake Slam', stat: 'STR', tier: 3,
    description: 'Strike the earth with cataclysmic force, sending shockwaves that topple all who stand.',
    xpCost: 500, icon: '💥', prerequisites: ['str-2', 'str-3'],
    effects: { description: 'AoE knockdown in 15ft radius', specialAbility: 'Earthquake Slam' },
  },

  // ── DEX ──
  {
    id: 'dex-1', name: 'Swift Dodge', stat: 'DEX', tier: 1,
    description: 'Move with preternatural speed, slipping between attacks like smoke through fingers.',
    xpCost: 100, icon: '💨', prerequisites: [],
    effects: { description: '+1 AC when not wearing heavy armor', acBonus: 1 },
  },
  {
    id: 'dex-2', name: 'Shadow Step', stat: 'DEX', tier: 2,
    description: 'Dissolve into darkness and reform behind your foe, unseen and unheard.',
    xpCost: 200, icon: '🌑', prerequisites: ['dex-1'],
    effects: { description: 'Teleport 30ft through dim light or darkness', specialAbility: 'Shadow Step' },
  },
  {
    id: 'dex-3', name: 'Blade Dance', stat: 'DEX', tier: 2,
    description: 'Enter a whirling trance of steel, your blades an impenetrable storm of death.',
    xpCost: 250, icon: '🗡️', prerequisites: ['dex-1'],
    effects: { description: 'Extra attack when dual wielding', statBonus: { DEX: 1 } },
  },
  {
    id: 'dex-4', name: 'Wind Walker', stat: 'DEX', tier: 3,
    description: 'Become one with the wind itself—your movements leave no trace, no sound, no shadow.',
    xpCost: 450, icon: '🌪️', prerequisites: ['dex-2'],
    effects: { description: 'Advantage on stealth, +10ft movement', initiativeBonus: 3 },
  },

  // ── CON ──
  {
    id: 'con-1', name: 'Stone Skin', stat: 'CON', tier: 1,
    description: 'Your flesh hardens like ancient granite, turning blades and shrugging off blows.',
    xpCost: 100, icon: '🪨', prerequisites: [],
    effects: { description: 'Resistance to non-magical bludgeoning', hpBonus: 5 },
  },
  {
    id: 'con-2', name: 'Vital Surge', stat: 'CON', tier: 2,
    description: 'Draw upon deep reserves of life force, mending wounds with sheer vitality.',
    xpCost: 200, icon: '❤️‍🔥', prerequisites: ['con-1'],
    effects: { description: 'Heal 1d10 HP as a bonus action, 1/short rest', hpBonus: 10 },
  },
  {
    id: 'con-3', name: 'Undying Resolve', stat: 'CON', tier: 2,
    description: 'When death reaches for you, your body refuses to yield, clinging to life with iron tenacity.',
    xpCost: 300, icon: '💀', prerequisites: ['con-1'],
    effects: { description: 'Drop to 1 HP instead of 0, once per long rest', savingThrowBonus: { CON: 2 } },
  },
  {
    id: 'con-4', name: 'Fortress Body', stat: 'CON', tier: 3,
    description: 'Your body becomes an impregnable fortress—poison, disease, and exhaustion cannot touch you.',
    xpCost: 500, icon: '🏰', prerequisites: ['con-2', 'con-3'],
    effects: { description: 'Immunity to poison and disease', statBonus: { CON: 3 }, hpBonus: 20 },
  },

  // ── INT ──
  {
    id: 'int-1', name: 'Arcane Focus', stat: 'INT', tier: 1,
    description: 'Sharpen your mind into a crystal lens, amplifying the arcane energies you channel.',
    xpCost: 100, icon: '🔮', prerequisites: [],
    effects: { description: '+1 spell attack rolls', statBonus: { INT: 1 } },
  },
  {
    id: 'int-2', name: 'Mind Shield', stat: 'INT', tier: 2,
    description: 'Erect impenetrable psychic barriers around your consciousness, warding off all intrusion.',
    xpCost: 200, icon: '🧠', prerequisites: ['int-1'],
    effects: { description: 'Resistance to psychic damage, advantage on INT saves', savingThrowBonus: { INT: 2 } },
  },
  {
    id: 'int-3', name: 'Spell Weave', stat: 'INT', tier: 2,
    description: 'Intertwine multiple threads of magic simultaneously, casting with impossible speed.',
    xpCost: 300, icon: '🕸️', prerequisites: ['int-1'],
    effects: { description: 'Cast a cantrip as a bonus action', specialAbility: 'Spell Weave' },
  },
  {
    id: 'int-4', name: 'Omniscience', stat: 'INT', tier: 3,
    description: 'Touch the infinite well of knowledge—for a fleeting moment, you know everything.',
    xpCost: 600, icon: '👁️', prerequisites: ['int-2', 'int-3'],
    effects: { description: 'Gain proficiency in all INT skills for 1 minute, 1/long rest', statBonus: { INT: 3 } },
  },

  // ── WIS ──
  {
    id: 'wis-1', name: 'Nature Sense', stat: 'WIS', tier: 1,
    description: 'Attune your senses to the pulse of the natural world, reading signs invisible to others.',
    xpCost: 100, icon: '🌿', prerequisites: [],
    effects: { description: 'Advantage on Survival and Perception in natural terrain', statBonus: { WIS: 1 } },
  },
  {
    id: 'wis-2', name: 'Spirit Link', stat: 'WIS', tier: 2,
    description: 'Form a shimmering bond between souls, sharing strength and sensation across the veil.',
    xpCost: 200, icon: '👻', prerequisites: ['wis-1'],
    effects: { description: 'Telepathic bond with one ally within 120ft', specialAbility: 'Spirit Link' },
  },
  {
    id: 'wis-3', name: 'Prophecy', stat: 'WIS', tier: 2,
    description: 'Glimpse the threads of fate, seeing moments before they unfold with terrible clarity.',
    xpCost: 300, icon: '⏳', prerequisites: ['wis-1'],
    effects: { description: 'Once per day, reroll any d20 with advantage', savingThrowBonus: { WIS: 2 } },
  },
  {
    id: 'wis-4', name: 'Astral Sight', stat: 'WIS', tier: 3,
    description: 'Open your third eye to the Astral Plane, perceiving the true nature of all things.',
    xpCost: 500, icon: '✨', prerequisites: ['wis-2', 'wis-3'],
    effects: { description: 'See invisible/ethereal, true sight 60ft', statBonus: { WIS: 3 } },
  },

  // ── CHA ──
  {
    id: 'cha-1', name: 'Inspire', stat: 'CHA', tier: 1,
    description: 'Your words ignite courage and purpose in the hearts of those who hear you speak.',
    xpCost: 100, icon: '🎵', prerequisites: [],
    effects: { description: 'Grant ally 1d6 inspiration die', statBonus: { CHA: 1 } },
  },
  {
    id: 'cha-2', name: 'Silver Tongue', stat: 'CHA', tier: 2,
    description: 'Speak with honeyed eloquence that bends the will of even the most stubborn minds.',
    xpCost: 200, icon: '🗣️', prerequisites: ['cha-1'],
    effects: { description: 'Advantage on Persuasion and Deception checks', statBonus: { CHA: 1 } },
  },
  {
    id: 'cha-3', name: 'Commanding Aura', stat: 'CHA', tier: 2,
    description: 'Emanate an aura of absolute authority; even enemies falter before your regal bearing.',
    xpCost: 300, icon: '👑', prerequisites: ['cha-1'],
    effects: { description: 'Frighten enemies within 30ft, WIS save DC 15', specialAbility: 'Commanding Aura' },
  },
  {
    id: 'cha-4', name: 'Soul Blaze', stat: 'CHA', tier: 3,
    description: 'Unleash the full radiance of your soul—a blinding inferno of charisma made manifest.',
    xpCost: 550, icon: '🔥', prerequisites: ['cha-2', 'cha-3'],
    effects: { description: 'Charm all creatures in 60ft, 1/long rest', statBonus: { CHA: 3 } },
  },
];

// ─── Layout Constants ──────────────────────────────────────────

const BRANCH_SPACING = 320;
const TIER_SPACING = 180;
const ROOT_Y = 0;
const BRANCH_START_Y = 200;
const STAT_ORDER: StatKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

// ─── Hook ──────────────────────────────────────────────────────

interface UseSkillTreeOptions {
  unlockedSkillIds?: string[];
  availableXp?: number;
}

export function useSkillTree(options: UseSkillTreeOptions = {}) {
  const {
    unlockedSkillIds: initialUnlocked = ['str-1', 'dex-1'],
    availableXp: initialXp = 1500,
  } = options;

  const [unlockedSkills, setUnlockedSkills] = useState<Set<string>>(new Set(initialUnlocked));
  const [xp, setXp] = useState(initialXp);

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

    // ── Yggdrasil Core (root) ──
    result.push({
      id: 'yggdrasil-core',
      type: 'skillNode',
      position: { x: 0, y: ROOT_Y },
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
      const branchSkills = DEMO_SKILLS.filter((s) => s.stat === statKey);

      // Stat label node (branch root)
      const branchRootId = `branch-${statKey}`;
      result.push({
        id: branchRootId,
        type: 'skillNode',
        position: { x: branchX, y: BRANCH_START_Y },
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

      // Skill nodes in the branch
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
            x: branchX + xOffset,
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
  }, [getSkillStatus]);

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
      const branchSkills = DEMO_SKILLS.filter((s) => s.stat === statKey);
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
          const prereqSkill = DEMO_SKILLS.find((s) => s.id === prereqId);
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
  }, [getSkillStatus]);

  // Node click handler
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as SkillNodeData;
      if (!data?.skill) return;

      if (data.status === 'unlockable') {
        const skill = data.skill;
        setUnlockedSkills((prev) => {
          const next = new Set(prev);
          next.add(skill.id);
          return next;
        });
        setXp((prev) => prev - skill.xpCost);
      }
    },
    [],
  );

  return {
    nodes,
    edges,
    onNodeClick,
    xp,
    unlockedSkills: Array.from(unlockedSkills),
    totalSkills: DEMO_SKILLS.length,
    unlockedCount: unlockedSkills.size,
  };
}
