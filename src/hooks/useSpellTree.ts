import { useState, useEffect, useCallback, useMemo } from 'react';
import { type Node, type Edge, Position } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import type { SpellTree, SpellNode, CharacterSpell } from '../lib/types';
import { CLASS_CATEGORIES, SUBCLASSES } from '../lib/constants';

export const BRANCH_COLORS: Record<string, string> = {
  Offense: '#ef4444',
  Defense: '#3b82f6',
  Utility: '#10b981',
  Ultimate: '#eab308',
  Base: '#8b5cf6',
};

const TREE_SPACING = 2500;
const SUBCLASS_Y = 250;

const MOCK_SPELLS: SpellNode[] = [
  {
    id: 'mock-blood-bolt',
    spell_tree_id: 'mock-blood-mage-tree',
    spell_key: 'blood_bolt',
    name_tr: 'Kan Cıvatası',
    name_en: 'Blood Bolt',
    description_tr: 'Hedefe kan enerjisinden bir cıvata fırlatır.',
    description_en: 'Fires a bolt of blood energy at the target.',
    branch: 'Offense',
    min_level: 1,
    xp_cost: 100,
    tier: 1,
    prerequisites: [],
    position: { x: 0, y: 150 },
    effects: { damage: '1d10', damage_type: 'necrotic' },
    icon: '💉'
  },
  {
    id: 'mock-vampiric-touch',
    spell_tree_id: 'mock-blood-mage-tree',
    spell_key: 'vampiric_touch',
    name_tr: 'Vampir Dokunuşu',
    name_en: 'Vampiric Touch',
    description_tr: 'Hedefin yaşam enerjisini çeker ve seni iyileştirir.',
    description_en: 'Drains the life force of the target to heal you.',
    branch: 'Defense',
    min_level: 5,
    xp_cost: 200,
    tier: 2,
    prerequisites: ['blood_bolt'],
    position: { x: 0, y: 300 },
    effects: { damage: '3d6', healing: 'half' },
    icon: '🧛'
  },
  {
    id: 'mock-entangle',
    spell_tree_id: 'mock-druid-tree',
    spell_key: 'entangle',
    name_tr: 'Sarmaşık',
    name_en: 'Entangle',
    description_tr: 'Sarmaşıklar yaratarak düşmanları sabitler.',
    description_en: 'Grasping weeds and vines entangle foes.',
    branch: 'Defense',
    min_level: 1,
    xp_cost: 100,
    tier: 1,
    prerequisites: [],
    position: { x: 0, y: 150 },
    effects: { area: '20-foot square', condition: 'restrained' },
    icon: '🌿'
  },
  {
    id: 'mock-thorn-whip',
    spell_tree_id: 'mock-druid-tree',
    spell_key: 'thorn_whip',
    name_tr: 'Dikenli Kırbaç',
    name_en: 'Thorn Whip',
    description_tr: 'Dikenli bir kırbaç yaratarak hedefe vurur ve yakınlaştırır.',
    description_en: 'Create a long, vine-like whip covered in thorns to strike and pull targets closer.',
    branch: 'Offense',
    min_level: 5,
    xp_cost: 200,
    tier: 2,
    prerequisites: ['entangle'],
    position: { x: 0, y: 300 },
    effects: { damage: '2d6', pull: '10 feet' },
    icon: '🌵'
  }
];

const MOCK_SPELL_TREES: SpellTree[] = [
  {
    id: 'mock-blood-mage-tree',
    name_tr: 'Kan Büyücüsü Ağacı',
    name_en: 'Blood Mage Tree',
    description_tr: 'Kan büyücüsü güçleri.',
    description_en: 'Blood mage powers.',
    assignments: [
      {
        id: 'mock-assign-blood-mage',
        spell_tree_id: 'mock-blood-mage-tree',
        class_key: 'mage',
        subclass_key: 'blood_mage',
        min_level: 1
      }
    ]
  },
  {
    id: 'mock-druid-tree',
    name_tr: 'Druid Ağacı',
    name_en: 'Druid Tree',
    description_tr: 'Doğa ve element güçleri.',
    description_en: 'Nature and elemental powers.',
    assignments: [
      {
        id: 'mock-assign-druid',
        spell_tree_id: 'mock-druid-tree',
        class_key: 'mage',
        subclass_key: 'druid',
        min_level: 1
      }
    ]
  }
];

const MOCK_CHARACTER = {
  id: 'mock-character-id',
  name: 'Mock Mage',
  level: 5,
  xp_available: 1000,
  subclass: {
    key: 'blood_mage',
    category: {
      key: 'mage'
    }
  },
  race: {
    key: 'human'
  }
};

function calculateSpellCoordinates(
  spells: SpellNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Determine unique primary branches deterministically
  const allBranches = Array.from(
    new Set(spells.map((s) => s.branch).filter(Boolean) as string[])
  );
  const primaryBranches = allBranches
    .filter((b) => !['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b))
    .sort();

  const k = primaryBranches.length;
  const colMap: Record<string, number> = {};
  primaryBranches.forEach((b, idx) => {
    colMap[b] = idx - (k - 1) / 2;
  });

  const getCol = (branch: string | undefined): number => {
    if (!branch || ['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(branch)) {
      return 0;
    }
    const parts = branch.split(',').map((x) => x.trim());
    let sum = 0;
    let count = 0;
    parts.forEach((p) => {
      if (p in colMap) {
        sum += colMap[p];
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  };

  // Compute intra-tier topological depth with cycle detection
  const depthMap: Record<string, number> = {};
  const visiting = new Set<string>();

  const getDepth = (spellKey: string): number => {
    if (spellKey in depthMap) return depthMap[spellKey];
    if (visiting.has(spellKey)) return 0;
    visiting.add(spellKey);

    const s = spells.find((x) => x.spell_key === spellKey);
    if (!s) {
      visiting.delete(spellKey);
      return 0;
    }
    if (!s.prerequisites || s.prerequisites.length === 0) {
      visiting.delete(spellKey);
      depthMap[spellKey] = 0;
      return 0;
    }
    let maxD = 0;
    s.prerequisites.forEach((pKey) => {
      const parent = spells.find((x) => x.spell_key === pKey);
      if (parent && parent.tier === s.tier) {
        maxD = Math.max(maxD, getDepth(pKey) + 1);
      }
    });
    visiting.delete(spellKey);
    depthMap[spellKey] = maxD;
    return maxD;
  };

  // Dynamic Layout Spacing Constants
  const ROW_HEIGHT = 180;
  const TIER_GAP = 220;
  const Y_OFFSET = 120;

  // Group spells by tier and calculate max depths for each tier
  const maxDepthByTier: Record<number, number> = {};
  const tiersSet = new Set<number>();
  spells.forEach((s) => {
    const tier = s.tier;
    tiersSet.add(tier);
    const d = getDepth(s.spell_key);
    maxDepthByTier[tier] = Math.max(maxDepthByTier[tier] || 0, d);
  });

  // Sort the unique tiers ascending
  const uniqueTiers = Array.from(tiersSet).sort((a, b) => a - b);

  // Compute starting Y position for each tier dynamically
  const tierStartY: Record<number, number> = {};
  let currentY = Y_OFFSET;
  
  uniqueTiers.forEach((tier) => {
    tierStartY[tier] = currentY;
    const maxDepth = maxDepthByTier[tier] || 0;
    currentY += (maxDepth * ROW_HEIGHT) + TIER_GAP;
  });

  // Group spells by their calculated Y coordinate
  const levelsMap: Record<number, SpellNode[]> = {};
  spells.forEach((s) => {
    const d = getDepth(s.spell_key);
    const y = tierStartY[s.tier] + d * ROW_HEIGHT;

    if (!levelsMap[y]) {
      levelsMap[y] = [];
    }
    levelsMap[y].push(s);
  });

  // Position spells on each Y level horizontally, sorted by column
  Object.entries(levelsMap).forEach(([yStr, levelSpells]) => {
    const y = parseFloat(yStr);
    const M = levelSpells.length;

    const getSortKey = (s: SpellNode): number => {
      if (!s.prerequisites || s.prerequisites.length === 0) {
        return getCol(s.branch);
      }
      let sum = 0;
      let count = 0;
      s.prerequisites.forEach((pKey) => {
        const parent = spells.find((x) => x.spell_key === pKey);
        if (parent) {
          sum += getCol(parent.branch);
          count++;
        }
      });
      return count > 0 ? sum / count : getCol(s.branch);
    };

    const sortedSpells = [...levelSpells].sort((a, b) => {
      const colA = getCol(a.branch);
      const colB = getCol(b.branch);
      if (colA !== colB) return colA - colB;

      const skA = getSortKey(a);
      const skB = getSortKey(b);
      if (skA !== skB) return skA - skB;

      return a.spell_key.localeCompare(b.spell_key);
    });

    // Space out nodes horizontally centering at 0
    // Use 150px gap between nodes. If there are many nodes, cap horizontal width to 900px
    const X_GAP = Math.max(135, Math.min(180, 1400 / Math.max(M - 1, 1)));
    sortedSpells.forEach((s, idx) => {
      const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
      positions[s.spell_key] = { x, y };
    });
  });

  return positions;
}

export function useSpellTree(characterId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const [spellTrees, setSpellTrees] = useState<SpellTree[]>([]);
  const [spells, setSpells] = useState<SpellNode[]>([]);
  const [characterSpells, setCharacterSpells] = useState<CharacterSpell[]>([]);
  const [character, setCharacter] = useState<any | null>(null);

  // Fallback mock states (for interactivity in offline mode)
  const [mockUnlockedKeys, setMockUnlockedKeys] = useState<Set<string>>(new Set(['blood_bolt']));
  const [mockXp, setMockXp] = useState<number>(1000);

  useEffect(() => {
    if (!characterId) {
      setIsFallbackMode(true);
      setSpellTrees(MOCK_SPELL_TREES);
      setSpells(MOCK_SPELLS);
      setCharacter(MOCK_CHARACTER);
      setCharacterSpells([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('*, subclass:subclass_definitions(*, category:class_categories(*)), race:race_definitions(*)')
          .eq('id', characterId)
          .single();

        if (charError) throw charError;

        const { data: treesData, error: treesError } = await supabase
          .from('spell_trees')
          .select('*, assignments:spell_tree_assignments(*)');

        if (treesError) throw treesError;

        let spellsData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const to = from + limit - 1;
          const { data: chunk, error: spellsError } = await supabase
            .from('spells')
            .select('*')
            .range(from, to);

          if (spellsError) throw spellsError;
          if (chunk && chunk.length > 0) {
            spellsData = [...spellsData, ...chunk];
            if (chunk.length < limit) {
              hasMore = false;
            } else {
              from += limit;
            }
          } else {
            hasMore = false;
          }
        }

        const { data: charSpellsData, error: charSpellsError } = await supabase
          .from('character_spells')
          .select('*, spell:spells(*)')
          .eq('character_id', characterId);

        if (charSpellsError) throw charSpellsError;

        setCharacter(charData);
        setSpellTrees(treesData || []);
        setSpells(spellsData || []);
        setCharacterSpells(charSpellsData || []);
        setIsFallbackMode(false);
      } catch (err: any) {
        const errMsg = err?.message || err?.details || String(err);
        if (errMsg.includes('relation not found') || errMsg.includes('schema cache')) {
          console.warn('Database error (relation/schema cache), falling back to mock data:', err);
        } else {
          console.warn('Supabase fetch failed, falling back to mock data:', err);
        }
        setIsFallbackMode(true);
        setSpellTrees(MOCK_SPELL_TREES);
        setSpells(MOCK_SPELLS);
        setCharacter(MOCK_CHARACTER);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [characterId]);

  // Compute effective character and unlocked spells depending on mode
  const effectiveCharacter = useMemo(() => {
    if (!isFallbackMode) return character;
    return {
      ...MOCK_CHARACTER,
      xp_available: mockXp
    };
  }, [isFallbackMode, character, mockXp]);

  const effectiveCharacterSpells = useMemo(() => {
    if (!isFallbackMode) return characterSpells;
    return Array.from(mockUnlockedKeys).map(key => {
      const def = MOCK_SPELLS.find(s => s.spell_key === key);
      return {
        id: `char-spell-${key}`,
        character_id: characterId || 'mock-character-id',
        spell_id: def?.id || '',
        unlocked: true,
        spell: def
      } as CharacterSpell;
    });
  }, [isFallbackMode, characterSpells, mockUnlockedKeys, characterId]);

  // Extract unlocked spell keys for easy lookup
  const unlockedSpellKeys = useMemo(() => {
    const keys = new Set<string>();
    effectiveCharacterSpells.forEach(cs => {
      if (cs.unlocked) {
        if (cs.spell?.spell_key) {
          keys.add(cs.spell.spell_key);
        } else {
          const def = spells.find(d => d.id === cs.spell_id);
          if (def) keys.add(def.spell_key);
        }
      }
    });
    return keys;
  }, [effectiveCharacterSpells, spells]);

  // Filter spell trees based on character's details
  const visibleTrees = useMemo(() => {
    if (!effectiveCharacter) return spellTrees;

    const classCategoryKey = effectiveCharacter.subclass?.category?.key;
    const raceKey = effectiveCharacter.race?.key;

    return spellTrees.filter(tree => {
      if (!tree.assignments || tree.assignments.length === 0) {
        return true;
      }
      return tree.assignments.some(assign => {
        // Check min_level
        if (effectiveCharacter.level < (assign.min_level ?? 1)) {
          return false;
        }
        // Check class_key
        if (assign.class_key && classCategoryKey !== assign.class_key) {
          return false;
        }
        // Check race_key
        if (assign.race_key && raceKey !== assign.race_key) {
          return false;
        }
        return true;
      });
    });
  }, [spellTrees, effectiveCharacter]);

  // Filter out spells that are not linked to the visible spell trees
  const visibleSpells = useMemo(() => {
    const visibleTreeIds = new Set(visibleTrees.map(t => t.id));
    return spells.filter(spell => visibleTreeIds.has(spell.spell_tree_id));
  }, [spells, visibleTrees]);

  // Determine the status of a specific spell node
  const getSpellStatus = useCallback((spell: SpellNode) => {
    // Structural nodes (class/subclass) are always considered unlocked
    if (spell.id.startsWith('class-') || spell.id.startsWith('subclass-')) {
      return 'unlocked';
    }

    if (unlockedSpellKeys.has(spell.spell_key)) {
      return 'unlocked';
    }

    // Level prerequisite check
    const level = effectiveCharacter?.level ?? 1;
    const levelPrereq = (spell as any).level_prerequisite ?? (spell as any).min_level ?? 0;
    if (level < levelPrereq) {
      return 'locked';
    }

    // Prerequisites check
    if (spell.prerequisites && spell.prerequisites.length > 0) {
      const allPrereqsMet = spell.prerequisites.every(prereqKey => unlockedSpellKeys.has(prereqKey));
      if (!allPrereqsMet) {
        return 'locked';
      }
    }

    // XP check
    const xpAvailable = effectiveCharacter?.xp_available ?? 0;
    if (xpAvailable < spell.xp_cost) {
      return 'locked';
    }

    return 'unlockable';
  }, [unlockedSpellKeys, effectiveCharacter]);

  // Unlocking mechanism
  const unlockSpell = useCallback(async (spell: SpellNode) => {
    if (!effectiveCharacter) return;
    const status = getSpellStatus(spell);
    if (status !== 'unlockable') return;

    if (isFallbackMode) {
      setMockUnlockedKeys(prev => {
        const next = new Set(prev);
        next.add(spell.spell_key);
        return next;
      });
      setMockXp(prev => prev - spell.xp_cost);
    } else {
      try {
        const { error: rpcError } = await supabase.rpc('unlock_spell', {
          char_id: effectiveCharacter.id,
          spell_val_id: spell.id,
          xp_val_cost: spell.xp_cost
        });

        if (rpcError) throw rpcError;

        // Update local React state immediately to trigger re-renders
        const newXp = effectiveCharacter.xp_available - spell.xp_cost;
        setCharacter((prev: any) => prev ? { ...prev, xp_available: newXp } : null);
        setCharacterSpells(prev => [
          ...prev,
          {
            id: `char-spell-${spell.spell_key}`,
            character_id: effectiveCharacter.id,
            spell_id: spell.id,
            unlocked: true,
            spell: spell
          }
        ]);
      } catch (err) {
        console.error('Failed to unlock spell:', err);
        alert('Failed to unlock spell. Please try again.');
      }
    }
  }, [effectiveCharacter, getSpellStatus, isFallbackMode]);

  // Node click handler for React Flow integration
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as any;
    if (data?.isDimmed) return; // Prevent interaction with dimmed trees
    if (data && data.spell) {
      unlockSpell(data.spell);
    }
  }, [unlockSpell]);

  // Generate nodes and edges for React Flow
  const nodes = useMemo<Node[]>(() => {
    if (!effectiveCharacter) return [];

    const classCategoryKey = effectiveCharacter.subclass?.category?.key;
    const subclassKey = effectiveCharacter.subclass?.key;

    const activeSubclasses = SUBCLASSES.filter(sub => sub.category_key === classCategoryKey);

    const classNodes: Node[] = CLASS_CATEGORIES.filter(c => c.key === classCategoryKey).map((cls) => ({
      id: `class-${cls.key}`,
      type: 'spellNode',
      position: { x: 0, y: 0 },
      data: {
        spell: {
          id: `class-${cls.key}`,
          spell_key: `class_${cls.key}`,
          name_en: cls.name_en,
          name_tr: cls.name_tr,
          icon: '👑',
          branch: 'Base',
          tier: 0,
          min_level: 0,
          xp_cost: 0,
          description_en: 'Class Root',
          description_tr: 'Sınıf Kökü',
        },
        status: 'unlocked',
        nodeColor: '#ffd700',
        isDimmed: false,
        isActiveSubclassTree: true,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const subclassNodes: Node[] = activeSubclasses.map((sub) => {
      const sibIdx = activeSubclasses.findIndex(s => s.key === sub.key);
      const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
      const subclassY = SUBCLASS_Y;
      const isCharacterSubclass = sub.key === subclassKey;

      return {
        id: `subclass-${sub.key}`,
        type: 'spellNode',
        position: { x: subclassX, y: subclassY },
        data: {
          spell: {
            id: `subclass-${sub.key}`,
            spell_key: `subclass_${sub.key}`,
            name_en: sub.name_en,
            name_tr: sub.name_tr,
            icon: '⚔️',
            branch: 'Base',
            tier: 0,
            min_level: 0,
            xp_cost: 0,
            description_en: sub.ability_desc_en,
            description_tr: sub.ability_desc_tr,
          },
          status: 'unlocked',
          nodeColor: isCharacterSubclass ? '#ffd700' : '#c0c0c0',
          isDimmed: !isCharacterSubclass,
          isActiveSubclassTree: isCharacterSubclass,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    const spellNodes: Node[] = [];
    
    // Group visible spells by subclass tree
    const spellsByTree: Record<string, SpellNode[]> = {};
    visibleSpells.forEach(spell => {
      if (!spellsByTree[spell.spell_tree_id]) {
        spellsByTree[spell.spell_tree_id] = [];
      }
      spellsByTree[spell.spell_tree_id].push(spell);
    });
    
    // Calculate coordinates and build React Flow nodes
    Object.values(spellsByTree).forEach((spellsInTree) => {
      const relativePositions = calculateSpellCoordinates(spellsInTree);
      
      spellsInTree.forEach(spell => {
        const status = getSpellStatus(spell);
        const nodeColor = BRANCH_COLORS[spell.branch || 'Base'] || '#3b82f6';
        
        const relPos = relativePositions[spell.spell_key] || { x: 0, y: 0 };
        let spellX = relPos.x;
        let spellY = relPos.y;
        let isDimmed = false;
        let isActiveSubclassTree = false;
        
        const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
        if (tree && tree.assignments) {
          const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || 
                         tree.assignments.find(a => a.class_key === classCategoryKey) || 
                         tree.assignments[0];
          if (assign && assign.subclass_key) {
            const sibIdx = activeSubclasses.findIndex(s => s.key === assign.subclass_key);
            if (sibIdx !== -1) {
              const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
              const subclassY = SUBCLASS_Y;
              spellX += subclassX;
              spellY += subclassY;
            }
            const isCharacterSubclass = assign.subclass_key === subclassKey;
            isDimmed = !isCharacterSubclass;
            isActiveSubclassTree = isCharacterSubclass;
          } else if (assign && assign.class_key) {
            spellY += SUBCLASS_Y;
            isDimmed = false;
            isActiveSubclassTree = true;
          }
        }
        
        spellNodes.push({
          id: spell.id,
          type: 'spellNode',
          position: { x: spellX, y: spellY },
          data: {
            spell,
            status,
            nodeColor,
            isDimmed,
            isActiveSubclassTree,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });

    return [...classNodes, ...subclassNodes, ...spellNodes];
  }, [visibleSpells, getSpellStatus, visibleTrees, effectiveCharacter]);

  const edges = useMemo<Edge[]>(() => {
    if (!effectiveCharacter) return [];
    
    const classCategoryKey = effectiveCharacter.subclass?.category?.key;
    const subclassKey = effectiveCharacter.subclass?.key;
    const activeSubclasses = SUBCLASSES.filter(sub => sub.category_key === classCategoryKey);

    const result: Edge[] = [];

    visibleSpells.forEach(spell => {
      if (spell.prerequisites && spell.prerequisites.length > 0) {
        spell.prerequisites.forEach(prereqKey => {
          const parentSpell = visibleSpells.find(s => s.spell_key === prereqKey);
          if (!parentSpell) return;

          const parentStatus = getSpellStatus(parentSpell);
          const childStatus = getSpellStatus(spell);

          let edgeStatus: 'unlocked' | 'partial' | 'locked' = 'locked';
          if (parentStatus === 'unlocked' && childStatus === 'unlocked') {
            edgeStatus = 'unlocked';
          } else if (parentStatus === 'unlocked' && childStatus === 'unlockable') {
            edgeStatus = 'partial';
          }

          const nodeColor = BRANCH_COLORS[spell.branch || 'Base'] || '#3b82f6';

          result.push({
            id: `edge-${parentSpell.id}-${spell.id}`,
            source: parentSpell.id,
            target: spell.id,
            type: 'spellEdge',
            data: {
              status: edgeStatus,
              color: nodeColor,
            },
          });
        });
      }
    });

    const classSubclassEdges: Edge[] = activeSubclasses.map(sub => ({
      id: `edge-class-${sub.category_key}-subclass-${sub.key}`,
      source: `class-${sub.category_key}`,
      target: `subclass-${sub.key}`,
      type: 'spellEdge',
      data: { status: 'unlocked', color: '#ffd700' },
    }));

    const subclassSpellEdges: Edge[] = [];
    visibleSpells.forEach(spell => {
      if (!spell.prerequisites || spell.prerequisites.length === 0) {
        const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
        if (tree && tree.assignments) {
          const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || tree.assignments.find(a => a.class_key === classCategoryKey) || tree.assignments[0];
          if (assign) {
            const sourceId = assign.subclass_key 
              ? `subclass-${assign.subclass_key}` 
              : `class-${assign.class_key}`;
            
            subclassSpellEdges.push({
              id: `edge-${sourceId}-spell-${spell.id}`,
              source: sourceId,
              target: spell.id,
              type: 'spellEdge',
              data: { 
                status: getSpellStatus(spell) === 'unlocked' ? 'unlocked' : 'partial', 
                color: '#c0c0c0' 
              },
            });
          }
        }
      }
    });

    return [...classSubclassEdges, ...subclassSpellEdges, ...result];
  }, [visibleSpells, visibleTrees, getSpellStatus, effectiveCharacter]);

  const isMock = !characterId || isFallbackMode;

  return {
    loading,
    error,
    nodes,
    edges,
    onNodeClick,
    xp: effectiveCharacter?.xp_available ?? 0,
    unlockedCount: unlockedSpellKeys.size,
    totalSpells: visibleSpells.length,
    totalSkills: visibleSpells.length,
    isFallbackMode,
    isMock,
    character: effectiveCharacter,
    unlockSpell
  };
}
