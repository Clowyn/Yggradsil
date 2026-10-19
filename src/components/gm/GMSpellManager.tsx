import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { SpellTree, SpellTreeAssignment, SpellNode, Character, CharacterSpell } from '../../lib/types';
import { Plus, Trash2, Edit2, AlertTriangle, User, RefreshCw, BookOpen, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { arcaneToast } from '../../lib/toast';

export function GMSpellManager() {
  const { locale } = useAuth();
  const { activeCharacterId, setActiveCharacterId } = useCampaign();
  const [activeTab, setActiveTab] = useState<'manage' | 'player'>('manage');
  const [manageSubTab, setManageSubTab] = useState<'trees' | 'assignments' | 'spells'>('trees');
  
  // Data State
  const [spellTrees, setSpellTrees] = useState<SpellTree[]>([]);
  const [assignments, setAssignments] = useState<SpellTreeAssignment[]>([]);
  const [spells, setSpells] = useState<SpellNode[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterSpells, setCharacterSpells] = useState<CharacterSpell[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Dynamic Tree Spells Cache to overcome 1000-row Supabase limit across all 63 trees
  const [treeSpellsCache, setTreeSpellsCache] = useState<Record<string, SpellNode[]>>({});
  const [loadingTreeSpells, setLoadingTreeSpells] = useState(false);

  // Tree Form State
  const [showTreeForm, setShowTreeForm] = useState(false);
  const [editingTree, setEditingTree] = useState<SpellTree | null>(null);
  const [treeNameTr, setTreeNameTr] = useState('');
  const [treeNameEn, setTreeNameEn] = useState('');
  const [treeDescTr, setTreeDescTr] = useState('');
  const [treeDescEn, setTreeDescEn] = useState('');

  // Assignment Form State
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingAssign, setEditingAssign] = useState<SpellTreeAssignment | null>(null);
  const [assignTreeId, setAssignTreeId] = useState('');
  const [assignClassKey, setAssignClassKey] = useState('');
  const [assignSubclassKey, setAssignSubclassKey] = useState('');
  const [assignRaceKey, setAssignRaceKey] = useState('');
  const [assignMinLevel, setAssignMinLevel] = useState(1);

  // Spell Form State
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [editingSpell, setEditingSpell] = useState<SpellNode | null>(null);
  const [spellTreeId, setSpellTreeId] = useState('');
  const [spellKey, setSpellKey] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameTr, setNameTr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTr, setDescTr] = useState('');
  const [branch, setBranch] = useState('Base');
  const [minLevel, setMinLevel] = useState(1);
  const [xpCost, setXpCost] = useState(100);
  const [tier, setTier] = useState(1);
  const [icon, setIcon] = useState('🔮');
  const [prereqs, setPrereqs] = useState('');
  const [posX, setPosX] = useState(100);
  const [posY, setPosY] = useState(100);
  const [effectsJson, setEffectsJson] = useState('{}');

  // Manage Tab Spells Subtab Filter State
  const [manageSpellTreeFilter, setManageSpellTreeFilter] = useState<string>('all');

  // Player Spells State — synchronized with CampaignContext activeCharacterId
  const [selectedCharId, setSelectedCharId] = useState<string>(() => activeCharacterId || '');
  const [playerTreeFilter, setPlayerTreeFilter] = useState<string>('eligible');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  // Follow global active character changes (Header selector) without setState-in-effect
  const [prevActiveCharacterId, setPrevActiveCharacterId] = useState(activeCharacterId);
  if (activeCharacterId !== prevActiveCharacterId) {
    setPrevActiveCharacterId(activeCharacterId);
    if (activeCharacterId) setSelectedCharId(activeCharacterId);
  }

  const activeCharacterIdRef = useRef(activeCharacterId);
  useEffect(() => {
    activeCharacterIdRef.current = activeCharacterId;
  }, [activeCharacterId]);

  // Fetch spells for specific trees (cached and grouped)
  const fetchSpellsForTrees = useCallback(async (treeIds: string[]): Promise<SpellNode[]> => {
    if (treeIds.length === 0) return [];
    if (isOffline) {
      return spells.filter(s => treeIds.includes(s.spell_tree_id));
    }
    const missing = treeIds.filter(id => !treeSpellsCache[id]);
    if (missing.length === 0) {
      return treeIds.flatMap(id => treeSpellsCache[id] || []);
    }

    try {
      setLoadingTreeSpells(true);
      const { data, error } = await supabase
        .from('spells')
        .select('*')
        .in('spell_tree_id', missing)
        .order('min_level', { ascending: true });

      if (error) throw error;
      const loaded = (data as SpellNode[]) || [];
      const newEntries: Record<string, SpellNode[]> = {};
      for (const id of missing) {
        newEntries[id] = [];
      }
      for (const s of loaded) {
        if (!newEntries[s.spell_tree_id]) newEntries[s.spell_tree_id] = [];
        newEntries[s.spell_tree_id].push(s);
      }

      setTreeSpellsCache(prev => ({ ...prev, ...newEntries }));
      return treeIds.flatMap(id => newEntries[id] || treeSpellsCache[id] || []);
    } catch (err) {
      console.error('Failed to fetch spells for trees:', err);
      return [];
    } finally {
      setLoadingTreeSpells(false);
    }
  }, [isOffline, spells, treeSpellsCache]);

  const reloadCharacterSpells = useCallback(async (charId?: string) => {
    try {
      let query = supabase.from('character_spells').select('*, spell:spells(*)');
      if (charId) {
        query = query.eq('character_id', charId);
      }
      const { data, error } = await query;
      if (!error && data) {
        if (charId) {
          setCharacterSpells(prev => [
            ...prev.filter(cs => cs.character_id !== charId),
            ...(data as CharacterSpell[])
          ]);
        } else {
          setCharacterSpells((data as CharacterSpell[]) || []);
        }
      }
    } catch (err) {
      console.warn('Failed to reload character spells:', err);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('spell_trees')
        .select('*')
        .order('name_tr', { ascending: true });
      if (treesError) throw treesError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('spell_tree_assignments')
        .select('*');
      if (assignmentsError) throw assignmentsError;

      const { data: spellsData, error: spellsError } = await supabase
        .from('spells')
        .select('*')
        .limit(1000);
      if (spellsError) throw spellsError;

      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*, subclass:subclass_definitions(*, category:class_categories(*)), race:race_definitions(*)')
        .order('name', { ascending: true });
      if (charError) throw charError;

      const { data: charSpellsData, error: charSpellsError } = await supabase
        .from('character_spells')
        .select('*, spell:spells(*)');
      if (charSpellsError) throw charSpellsError;

      const loadedSpells = (spellsData as SpellNode[]) || [];
      setSpellTrees(treesData || []);
      setAssignments(assignmentsData || []);
      setSpells(loadedSpells);
      setCharacters(charData || []);
      setCharacterSpells((charSpellsData as CharacterSpell[]) || []);

      // Seed tree cache with initial loaded spells
      const initialCache: Record<string, SpellNode[]> = {};
      for (const s of loadedSpells) {
        if (!initialCache[s.spell_tree_id]) initialCache[s.spell_tree_id] = [];
        initialCache[s.spell_tree_id].push(s);
      }
      setTreeSpellsCache(prev => ({ ...initialCache, ...prev }));

      if (charData && charData.length > 0) {
        setSelectedCharId(prev => {
          const globalActiveId = activeCharacterIdRef.current;
          if (globalActiveId && charData.some(c => c.id === globalActiveId)) {
            return globalActiveId;
          }
          return prev && charData.some(c => c.id === prev) ? prev : charData[0].id;
        });
      }
      setIsOffline(false);
    } catch (err) {
      console.warn('GM Spell Manager Supabase query failed, falling back to mock:', err);
      setIsOffline(true);
      
      setSpellTrees([
        {
          id: 'mock-tree-id',
          name_tr: 'Arkana Örgüsü',
          name_en: 'Arcane Weave',
          description_tr: 'Evrenin temel büyü dokusu.',
          description_en: 'The fundamental fabric of magic.'
        }
      ]);
      setAssignments([
        {
          id: 'mock-assign-1',
          spell_tree_id: 'mock-tree-id',
          class_key: 'mage',
          min_level: 1
        }
      ]);
      setSpells([
        {
          id: 'mock-magic-missile',
          spell_tree_id: 'mock-tree-id',
          spell_key: 'magic_missile',
          name_tr: 'Sihirli Füze',
          name_en: 'Magic Missile',
          description_tr: 'Ufalanan büyü enerjisinden üç adet füze yaratır.',
          description_en: 'You create three glowing darts of magical force.',
          branch: 'Base',
          min_level: 1,
          xp_cost: 100,
          tier: 1,
          prerequisites: [],
          position: { x: 100, y: 100 },
          effects: { damage: '3d4+3' },
          icon: '🔮'
        }
      ]);
      setCharacters([
        {
          id: 'mock-char-1',
          name: 'Mock Mage',
          level: 5,
          xp_available: 1000,
          race_id: 'race-1',
          subclass_id: 'subclass-1',
          profile_id: 'profile-1',
          campaign_id: 'camp-1',
          xp_total: 1000,
          avatar_url: null,
          created_at: '',
          updated_at: '',
          subclass: {
            id: 'subclass-1',
            category_id: 'cat-1',
            key: 'mana_mage',
            name_tr: 'Mana Büyücüsü',
            name_en: 'Mana Mage',
            ability_name_tr: 'Mana Havuzu',
            ability_name_en: 'Mana Pool',
            ability_desc_tr: 'Mana kapasitesini artırır.',
            ability_desc_en: 'Increases mana capacity.',
            is_low_rate: false,
            is_advanced: false,
            icon_url: null,
            base_stats: {},
            category: {
              id: 'cat-1',
              key: 'mage',
              name_tr: 'Büyücü',
              name_en: 'Mage',
              icon_url: null,
              sort_order: 1
            }
          }
        }
      ]);
      setSelectedCharId('mock-char-1');
      setCharacterSpells([
        {
          id: 'mock-cs-1',
          character_id: 'mock-char-1',
          spell_id: 'mock-magic-missile',
          unlocked: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) {
        loadData();
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Tree Form Reset
  const resetTreeForm = () => {
    setEditingTree(null);
    setTreeNameTr('');
    setTreeNameEn('');
    setTreeDescTr('');
    setTreeDescEn('');
    setShowTreeForm(false);
  };

  // Assignment Form Reset
  const resetAssignForm = () => {
    setEditingAssign(null);
    setAssignTreeId(spellTrees[0]?.id || '');
    setAssignClassKey('');
    setAssignSubclassKey('');
    setAssignRaceKey('');
    setAssignMinLevel(1);
    setShowAssignForm(false);
  };

  // Spell Form Reset
  const resetSpellForm = () => {
    setEditingSpell(null);
    setSpellTreeId(spellTrees[0]?.id || '');
    setSpellKey('');
    setNameEn('');
    setNameTr('');
    setDescEn('');
    setDescTr('');
    setBranch('Base');
    setMinLevel(1);
    setXpCost(100);
    setTier(1);
    setIcon('🔮');
    setPrereqs('');
    setPosX(100);
    setPosY(100);
    setEffectsJson('{}');
    setShowSpellForm(false);
  };

  // Save Spell Tree
  const handleSaveTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      arcaneToast.warning('Cannot perform write operations in offline mock mode.');
      return;
    }
    try {
      const payload = {
        name_tr: treeNameTr,
        name_en: treeNameEn,
        description_tr: treeDescTr || null,
        description_en: treeDescEn || null,
      };

      if (editingTree) {
        const { error } = await supabase
          .from('spell_trees')
          .update(payload)
          .eq('id', editingTree.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spell_trees')
          .insert(payload);
        if (error) throw error;
      }
      resetTreeForm();
      loadData();
    } catch (err) {
      console.error('Failed to save tree:', err);
      arcaneToast.error('Failed to save tree.');
    }
  };

  // Delete Spell Tree
  const handleDeleteTree = async (id: string) => {
    if (isOffline) {
      arcaneToast.warning('Cannot perform write operations in offline mock mode.');
      return;
    }
    if (!confirm(locale === 'tr' ? 'Büyü ağacını silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this spell tree?')) return;
    try {
      const { error } = await supabase
        .from('spell_trees')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Failed to delete tree:', err);
    }
  };

  // Save Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      arcaneToast.warning('Cannot perform write operations in offline mock mode.');
      return;
    }
    try {
      const payload = {
        spell_tree_id: assignTreeId,
        class_key: assignClassKey || null,
        subclass_key: assignSubclassKey || null,
        race_key: assignRaceKey || null,
        min_level: assignMinLevel,
      };

      if (editingAssign) {
        const { error } = await supabase
          .from('spell_tree_assignments')
          .update(payload)
          .eq('id', editingAssign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spell_tree_assignments')
          .insert(payload);
        if (error) throw error;
      }
      resetAssignForm();
      loadData();
    } catch (err) {
      console.error('Failed to save assignment:', err);
      arcaneToast.error('Failed to save assignment.');
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    if (isOffline) {
      arcaneToast.warning('Cannot perform write operations in offline mock mode.');
      return;
    }
    if (!confirm(locale === 'tr' ? 'Atamayı silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this assignment?')) return;
    try {
      const { error } = await supabase
        .from('spell_tree_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  // Save Spell Node
  const handleSaveSpell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      arcaneToast.warning('Cannot perform write operations in offline mock mode.');
      return;
    }
    let parsedEffects: Record<string, unknown>;
    try {
      parsedEffects = JSON.parse(effectsJson);
    } catch {
      arcaneToast.error(locale === 'tr' ? 'Etkiler JSON formatı geçersiz.' : 'Effects JSON format is invalid.');
      return;
    }

    const prereqList = prereqs
      .split(',')
      .map(k => k.trim())
      .filter(k => k !== '');

    try {
      const payload = {
        spell_tree_id: spellTreeId,
        spell_key: spellKey,
        name_tr: nameTr,
        name_en: nameEn,
        description_tr: descTr || null,
        description_en: descEn || null,
        branch,
        min_level: minLevel,
        xp_cost: xpCost,
        tier,
        prerequisites: prereqList,
        position: { x: posX, y: posY },
        effects: parsedEffects,
        icon,
      };

      if (editingSpell) {
        const { error } = await supabase
          .from('spells')
          .update(payload)
          .eq('id', editingSpell.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spells')
          .insert(payload);
        if (error) throw error;
      }
      resetSpellForm();
      loadData();
    } catch (err) {
      console.error('Failed to save spell:', err);
      arcaneToast.error('Failed to save spell.');
    }
  };

  // Delete Spell Node
  const handleDeleteSpell = async (id: string) => {
    if (isOffline) {
      arcaneToast.warning('Cannot perform write operations in offline mock mode.');
      return;
    }
    if (!confirm(locale === 'tr' ? 'Büyüyü silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this spell?')) return;
    try {
      const { error } = await supabase
        .from('spells')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Failed to delete spell:', err);
    }
  };

  // Helper to determine if an assignment accurately matches a character
  const isAssignmentMatch = useCallback((
    assign: SpellTreeAssignment,
    subclassKey?: string,
    classCategoryKey?: string,
    raceKey?: string
  ) => {
    if (assign.subclass_key && assign.subclass_key !== subclassKey) return false;
    if (assign.class_key && assign.class_key !== classCategoryKey) return false;
    if (assign.race_key && assign.race_key !== raceKey) return false;

    return Boolean(
      (assign.subclass_key && assign.subclass_key === subclassKey) ||
      (assign.class_key && assign.class_key === classCategoryKey) ||
      (assign.race_key && assign.race_key === raceKey)
    );
  }, []);

  const activeChar = useMemo(() => {
    return characters.find(c => c.id === selectedCharId);
  }, [characters, selectedCharId]);

  // Compute matched trees for the selected character
  const matchedTrees = useMemo(() => {
    if (!activeChar) return [];
    const classCategoryKey = activeChar.subclass?.category?.key;
    const subclassKey = activeChar.subclass?.key;
    const raceKey = activeChar.race?.key;

    return spellTrees.filter(tree => {
      const treeAssigns = assignments.filter(a => a.spell_tree_id === tree.id);
      if (treeAssigns.length === 0) return false;
      return treeAssigns.some(assign =>
        isAssignmentMatch(assign, subclassKey, classCategoryKey, raceKey)
      );
    });
  }, [activeChar, spellTrees, assignments, isAssignmentMatch]);

  const matchedTreeIds = useMemo(() => matchedTrees.map(t => t.id), [matchedTrees]);

  // Automatically load tree spells for active character when tab or character changes
  useEffect(() => {
    if (activeTab !== 'player' || !selectedCharId || matchedTreeIds.length === 0) return;
    const missing = matchedTreeIds.filter(id => !treeSpellsCache[id]);
    if (missing.length > 0) {
      let ignore = false;
      queueMicrotask(() => {
        if (!ignore) {
          fetchSpellsForTrees(missing);
        }
      });
      return () => {
        ignore = true;
      };
    }
  }, [activeTab, selectedCharId, matchedTreeIds, treeSpellsCache, fetchSpellsForTrees]);

  // Handle tree filter changes in Player Spells tab
  const handlePlayerTreeFilterChange = async (newFilter: string) => {
    setPlayerTreeFilter(newFilter);
    if (newFilter !== 'eligible' && newFilter !== 'all') {
      if (!treeSpellsCache[newFilter]) {
        await fetchSpellsForTrees([newFilter]);
      }
    }
  };

  // Handle tree filter changes in Manage Spells tab
  const handleManageTreeFilterChange = async (newFilter: string) => {
    setManageSpellTreeFilter(newFilter);
    if (newFilter !== 'all' && !treeSpellsCache[newFilter]) {
      await fetchSpellsForTrees([newFilter]);
    }
  };

  // Spells displayed in Manage Spells subtab
  const manageDisplayedSpells = useMemo(() => {
    if (manageSpellTreeFilter === 'all') {
      return spells;
    }
    return treeSpellsCache[manageSpellTreeFilter] || [];
  }, [manageSpellTreeFilter, spells, treeSpellsCache]);

  // Spells displayed in Player Spells tab
  const playerDisplayedSpells = useMemo(() => {
    let list: SpellNode[];
    if (playerTreeFilter === 'eligible') {
      if (matchedTreeIds.length > 0) {
        list = matchedTreeIds.flatMap(id => treeSpellsCache[id] || []);
        // If cache is still empty but spells has elements matching, fallback to spells
        if (list.length === 0) {
          list = spells.filter(s => matchedTreeIds.includes(s.spell_tree_id));
        }
      } else {
        // Fallback: If character has no eligible tree assigned
        list = spells;
      }
    } else if (playerTreeFilter === 'all') {
      const allLoaded = Object.values(treeSpellsCache).flat();
      list = allLoaded.length > 0 ? allLoaded : spells;
    } else {
      list = treeSpellsCache[playerTreeFilter] || [];
    }

    // Apply search query
    if (playerSearchQuery.trim()) {
      const q = playerSearchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.name_tr && s.name_tr.toLowerCase().includes(q)) ||
        (s.name_en && s.name_en.toLowerCase().includes(q)) ||
        (s.branch && s.branch.toLowerCase().includes(q)) ||
        (s.spell_key && s.spell_key.toLowerCase().includes(q))
      );
    }

    return list;
  }, [playerTreeFilter, matchedTreeIds, treeSpellsCache, spells, playerSearchQuery]);

  // Resolve all character IDs that represent the same character (handles duplicate character rows with identical profile_id, name, and subclass_id)
  const getTargetCharacterIds = useCallback((primaryId: string): string[] => {
    const primary = characters.find(c => c.id === primaryId);
    if (!primary) return [primaryId];
    const matching = characters
      .filter(
        c =>
          c.id === primaryId ||
          (c.name.trim().toLowerCase() === primary.name.trim().toLowerCase() &&
            c.profile_id === primary.profile_id &&
            c.subclass_id === primary.subclass_id)
      )
      .map(c => c.id);
    return Array.from(new Set([primaryId, ...matching]));
  }, [characters]);

  // Toggle Player Spell (Teach / Remove)
  const handleToggleSpellForPlayer = async (spell: SpellNode, isUnlocked: boolean) => {
    if (!selectedCharId) return;
    setActiveCharacterId(selectedCharId);
    const targetCharIds = getTargetCharacterIds(selectedCharId);

    if (isOffline) {
      if (isUnlocked) {
        setCharacterSpells(prev => prev.filter(cs => !(targetCharIds.includes(cs.character_id) && cs.spell_id === spell.id)));
      } else {
        setCharacterSpells(prev => [
          ...prev,
          {
            id: `mock-cs-${selectedCharId}-${spell.id}`,
            character_id: selectedCharId,
            spell_id: spell.id,
            unlocked: true,
            spell
          }
        ]);
      }
      return;
    }

    try {
      if (isUnlocked) {
        // Optimistic UI update: remove spell
        setCharacterSpells(prev => prev.filter(cs => !(targetCharIds.includes(cs.character_id) && cs.spell_id === spell.id)));
        
        for (const charId of targetCharIds) {
          const { error: rpcError } = await supabase.rpc('gm_forget_spells', {
            p_character_id: charId,
            p_spell_id: spell.id
          });
          if (rpcError) {
            const { error } = await supabase
              .from('character_spells')
              .delete()
              .eq('character_id', charId)
              .eq('spell_id', spell.id);
            if (error && charId === selectedCharId) throw error;
          }
        }
      } else {
        // Optimistic UI update: teach spell
        const optimisticEntries: CharacterSpell[] = targetCharIds.map(charId => ({
          id: `opt-cs-${charId}-${spell.id}`,
          character_id: charId,
          spell_id: spell.id,
          unlocked: true,
          spell
        }));
        setCharacterSpells(prev => [
          ...prev.filter(cs => !(targetCharIds.includes(cs.character_id) && cs.spell_id === spell.id)),
          ...optimisticEntries
        ]);

        for (const charId of targetCharIds) {
          const { error: rpcErr } = await supabase.rpc('unlock_spell', {
            char_id: charId,
            spell_val_id: spell.id,
            xp_val_cost: 0
          });
          if (rpcErr) {
            const { error: upsertErr } = await supabase
              .from('character_spells')
              .upsert(
                { character_id: charId, spell_id: spell.id, unlocked: true },
                { onConflict: 'character_id,spell_id' }
              );
            if (upsertErr && charId === selectedCharId) throw upsertErr;
          }
        }
      }
      // Background sync
      await Promise.all(targetCharIds.map(id => reloadCharacterSpells(id)));
      window.dispatchEvent(new CustomEvent('dnd:spells-updated', { detail: { characterId: selectedCharId } }));
    } catch (err) {
      console.error('Failed to toggle player spell:', err);
      await reloadCharacterSpells(selectedCharId);
      arcaneToast.error(locale === 'tr' ? 'Büyü durumu güncellenirken hata oluştu.' : 'Failed to update spell.');
    }
  };

  // Teach All Eligible Spells for Player
  const handleTeachAllSpells = async () => {
    if (!selectedCharId || !activeChar) return;
    setActiveCharacterId(selectedCharId);
    const targetCharIds = getTargetCharacterIds(selectedCharId);

    let targetSpells: SpellNode[];

    if (playerTreeFilter === 'eligible') {
      if (matchedTreeIds.length > 0) {
        targetSpells = await fetchSpellsForTrees(matchedTreeIds);
      } else {
        const confirmAll = window.confirm(
          locale === 'tr'
            ? `${activeChar.name} için özel bir büyü ağacı ataması bulunamadı. Mevcut yüklü büyüler öğretilsin mi?`
            : `No specific spell tree assigned for ${activeChar.name}. Teach all available loaded spells?`
        );
        if (!confirmAll) return;
        targetSpells = playerDisplayedSpells;
      }
    } else if (playerTreeFilter === 'all') {
      targetSpells = playerDisplayedSpells;
    } else {
      // Specific tree selected from dropdown
      targetSpells = await fetchSpellsForTrees([playerTreeFilter]);
    }

    if (targetSpells.length === 0) {
      arcaneToast.warning(
        locale === 'tr'
          ? 'Öğretilecek büyü bulunamadı. Lütfen geçerli bir büyü ağacı seçin.'
          : 'No spells found to teach. Please select a valid spell tree.'
      );
      return;
    }

    const alreadyUnlockedIds = new Set(
      characterSpells
        .filter(cs => cs.character_id === selectedCharId && cs.unlocked !== false)
        .map(cs => cs.spell_id)
    );

    const uniqueSpellsMap = new Map<string, SpellNode>();
    for (const s of targetSpells) {
      if (!alreadyUnlockedIds.has(s.id) && !uniqueSpellsMap.has(s.id)) {
        uniqueSpellsMap.set(s.id, s);
      }
    }
    const allTargetSpells = Array.from(new Map(targetSpells.map(s => [s.id, s])).values());
    const spellsToTeach = Array.from(uniqueSpellsMap.values());

    // Even if primary character already has all spells, ensure any duplicate character rows are synced
    const syncList = spellsToTeach.length > 0 ? spellsToTeach : allTargetSpells;

    if (spellsToTeach.length === 0 && targetCharIds.length <= 1) {
      arcaneToast.info(
        locale === 'tr'
          ? `${activeChar.name} için seçili ağaçtaki tüm büyüler (${targetSpells.length} büyü) zaten açık!`
          : `All spells in the selected tree (${targetSpells.length} spells) are already unlocked for ${activeChar.name}!`
      );
      return;
    }

    if (spellsToTeach.length > 0) {
      const confirmMsg = locale === 'tr'
        ? `${activeChar.name} karakterine ${spellsToTeach.length} yeni büyü öğretilsin mi?`
        : `Teach ${spellsToTeach.length} new spells to ${activeChar.name}?`;
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      // Optimistic update across target character(s)
      const newMockSpells: CharacterSpell[] = targetCharIds.flatMap(charId =>
        syncList.map(s => ({
          id: `mock-cs-${charId}-${s.id}`,
          character_id: charId,
          spell_id: s.id,
          unlocked: true,
          spell: s
        }))
      );

      setCharacterSpells(prev => [
        ...prev.filter(cs => !(targetCharIds.includes(cs.character_id) && syncList.some(st => st.id === cs.spell_id))),
        ...newMockSpells
      ]);

      if (!isOffline) {
        const spellIds = syncList.map(s => s.id);
        for (const charId of targetCharIds) {
          const { error: bulkErr } = await supabase.rpc('gm_teach_spells', {
            p_character_id: charId,
            p_spell_ids: spellIds,
          });

          if (bulkErr) {
            // Fallback 1: direct upsert into character_spells
            const rows = syncList.map(s => ({
              character_id: charId,
              spell_id: s.id,
              unlocked: true,
            }));
            const { error: upsertErr } = await supabase
              .from('character_spells')
              .upsert(rows, { onConflict: 'character_id,spell_id' });

            if (upsertErr) {
              // Fallback 2: Teach spells in concurrent chunks via unlock_spell RPC
              const CHUNK_SIZE = 10;
              for (let i = 0; i < syncList.length; i += CHUNK_SIZE) {
                const chunk = syncList.slice(i, i + CHUNK_SIZE);
                await Promise.all(
                  chunk.map(async s => {
                    const { error } = await supabase.rpc('unlock_spell', {
                      char_id: charId,
                      spell_val_id: s.id,
                      xp_val_cost: 0
                    });
                    if (error && charId === selectedCharId) throw error;
                  })
                );
              }
            }
          }
        }

        // Background sync
        await Promise.all(targetCharIds.map(id => reloadCharacterSpells(id)));
        window.dispatchEvent(new CustomEvent('dnd:spells-updated', { detail: { characterId: selectedCharId } }));
      }

      arcaneToast.success(
        locale === 'tr'
          ? `${activeChar.name} karakterine ${syncList.length} büyü başarıyla öğretildi ve Büyü Ağacı ile eşitlendi.`
          : `Successfully taught and synced ${syncList.length} spells for ${activeChar.name}.`
      );
    } catch (err) {
      console.error('Failed to teach all spells:', err);
      await reloadCharacterSpells(selectedCharId);
      arcaneToast.error(locale === 'tr' ? 'Büyüler öğretilirken bir hata oluştu.' : 'Failed to teach spells.');
    }
  };

  // Forget All Spells for Player
  const handleForgetAllSpells = async () => {
    if (!selectedCharId || !activeChar) return;
    setActiveCharacterId(selectedCharId);
    const targetCharIds = getTargetCharacterIds(selectedCharId);
    const charName = activeChar.name || (locale === 'tr' ? 'Karakter' : 'Character');

    const learnedSpells = characterSpells.filter(cs => targetCharIds.includes(cs.character_id));
    if (learnedSpells.length === 0) {
      arcaneToast.info(
        locale === 'tr'
          ? `${charName} için zaten öğrenilmiş büyü bulunmuyor.`
          : `${charName} has no learned spells to forget.`
      );
      return;
    }

    const confirmMsg = locale === 'tr'
      ? `${charName} için öğrenilmiş TÜM büyüleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
      : `Are you sure you want to forget ALL spells for ${charName}? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      // Optimistic update
      setCharacterSpells(prev => prev.filter(cs => !targetCharIds.includes(cs.character_id)));

      if (!isOffline) {
        for (const charId of targetCharIds) {
          const { error: rpcError } = await supabase.rpc('gm_forget_spells', {
            p_character_id: charId
          });
          if (rpcError) {
            const { error } = await supabase
              .from('character_spells')
              .delete()
              .eq('character_id', charId);
            if (error && charId === selectedCharId) throw error;
          }
        }
        await Promise.all(targetCharIds.map(id => reloadCharacterSpells(id)));
        window.dispatchEvent(new CustomEvent('dnd:spells-updated', { detail: { characterId: selectedCharId } }));
      }

      arcaneToast.success(
        locale === 'tr'
          ? `${charName} karakterinin tüm büyüleri başarıyla silindi.`
          : `Successfully removed all spells for ${charName}.`
      );
    } catch (err) {
      console.error('Failed to forget all spells:', err);
      reloadCharacterSpells(selectedCharId);
      arcaneToast.error(locale === 'tr' ? 'Büyüler silinirken bir hata oluştu.' : 'Failed to remove spells.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'manage'
                ? 'bg-gold/15 text-gold border border-gold/30'
                : 'text-gray-400 hover:bg-white/5 border border-transparent'
            }`}
          >
            {locale === 'tr' ? 'Büyüleri Yönet' : 'Manage Spells'}
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'player'
                ? 'bg-gold/15 text-gold border border-gold/30'
                : 'text-gray-400 hover:bg-white/5 border border-transparent'
            }`}
          >
            {locale === 'tr' ? 'Oyuncu Büyüleri' : 'Player Spells'}
          </button>
        </div>
        
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all duration-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 text-amber-400 text-xs">
          <AlertTriangle size={16} />
          <span>{locale === 'tr' ? 'Supabase bağlantısı kurulamadı. Çevrimdışı/Demo modunda çalışılıyor. Değişiklikler kaydedilemez.' : 'Database connection unavailable. Running in offline/demo mode. Writes are disabled.'}</span>
        </div>
      )}

      {/* Tab 1: Manage Spells */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Sub Tab selection */}
          <div className="flex gap-2 border-b border-white/5 pb-2">
            <button
              onClick={() => setManageSubTab('trees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                manageSubTab === 'trees' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {locale === 'tr' ? 'Büyü Ağaçları' : 'Spell Trees'}
            </button>
            <button
              onClick={() => setManageSubTab('assignments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                manageSubTab === 'assignments' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {locale === 'tr' ? 'Gereksinim / Atamalar' : 'Assignments'}
            </button>
            <button
              onClick={() => setManageSubTab('spells')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                manageSubTab === 'spells' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {locale === 'tr' ? 'Büyüler (Düğümler)' : 'Spells (Nodes)'}
            </button>
          </div>

          {/* Subtab Content: Trees */}
          {manageSubTab === 'trees' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-cinzel text-sm text-white font-bold">{locale === 'tr' ? 'Büyü Ağaçları Listesi' : 'Spell Trees List'}</h3>
                {!showTreeForm && (
                  <button
                    onClick={() => {
                      resetTreeForm();
                      setShowTreeForm(true);
                    }}
                    className="gold-button flex items-center gap-1.5 text-xs py-1.5"
                  >
                    <Plus size={14} />
                    <span>{locale === 'tr' ? 'Ağaç Ekle' : 'Add Tree'}</span>
                  </button>
                )}
              </div>

              {showTreeForm && (
                <form onSubmit={handleSaveTree} className="glass border border-gold/30 rounded-xl p-4 space-y-4">
                  <h4 className="font-cinzel text-xs text-gold font-bold">{editingTree ? (locale === 'tr' ? 'Ağacı Düzenle' : 'Edit Tree') : (locale === 'tr' ? 'Yeni Ağaç Ekle' : 'Add New Tree')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Name (TR)</label>
                      <input
                        type="text"
                        required
                        value={treeNameTr}
                        onChange={e => setTreeNameTr(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Name (EN)</label>
                      <input
                        type="text"
                        required
                        value={treeNameEn}
                        onChange={e => setTreeNameEn(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Description (TR)</label>
                      <input
                        type="text"
                        value={treeDescTr}
                        onChange={e => setTreeDescTr(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Description (EN)</label>
                      <input
                        type="text"
                        value={treeDescEn}
                        onChange={e => setTreeDescEn(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={resetTreeForm} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold transition hover:bg-white/5">{locale === 'tr' ? 'İptal' : 'Cancel'}</button>
                    <button type="submit" className="gold-button text-xs py-1.5 px-4">{locale === 'tr' ? 'Kaydet' : 'Save'}</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spellTrees.map(tree => (
                  <div key={tree.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-cinzel text-xs font-bold text-white leading-tight">
                        {locale === 'tr' ? tree.name_tr : tree.name_en}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {locale === 'tr' ? tree.description_tr : tree.description_en}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTree(tree);
                          setTreeNameTr(tree.name_tr);
                          setTreeNameEn(tree.name_en);
                          setTreeDescTr(tree.description_tr || '');
                          setTreeDescEn(tree.description_en || '');
                          setShowTreeForm(true);
                        }}
                        className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTree(tree.id)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtab Content: Assignments */}
          {manageSubTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-cinzel text-sm text-white font-bold">{locale === 'tr' ? 'Ağaç Atamaları Listesi' : 'Spell Tree Assignments'}</h3>
                {!showAssignForm && (
                  <button
                    onClick={() => {
                      resetAssignForm();
                      setShowAssignForm(true);
                    }}
                    className="gold-button flex items-center gap-1.5 text-xs py-1.5"
                  >
                    <Plus size={14} />
                    <span>{locale === 'tr' ? 'Atama Ekle' : 'Add Assignment'}</span>
                  </button>
                )}
              </div>

              {showAssignForm && (
                <form onSubmit={handleSaveAssignment} className="glass border border-gold/30 rounded-xl p-4 space-y-4">
                  <h4 className="font-cinzel text-xs text-gold font-bold">{editingAssign ? (locale === 'tr' ? 'Atamayı Düzenle' : 'Edit Assignment') : (locale === 'tr' ? 'Yeni Atama Ekle' : 'Add New Assignment')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Spell Tree</label>
                      <select
                        value={assignTreeId}
                        onChange={e => setAssignTreeId(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      >
                        {spellTrees.map(t => (
                          <option key={t.id} value={t.id}>
                            {locale === 'tr' ? t.name_tr : t.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Class Key (Class Category)</label>
                      <input
                        type="text"
                        value={assignClassKey}
                        onChange={e => setAssignClassKey(e.target.value)}
                        placeholder="e.g. mage"
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Subclass Key</label>
                      <input
                        type="text"
                        value={assignSubclassKey}
                        onChange={e => setAssignSubclassKey(e.target.value)}
                        placeholder="e.g. fire_mage"
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Race Key</label>
                      <input
                        type="text"
                        value={assignRaceKey}
                        onChange={e => setAssignRaceKey(e.target.value)}
                        placeholder="e.g. elf"
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Min Level</label>
                      <input
                        type="number"
                        min={1}
                        value={assignMinLevel}
                        onChange={e => setAssignMinLevel(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={resetAssignForm} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold transition hover:bg-white/5">{locale === 'tr' ? 'İptal' : 'Cancel'}</button>
                    <button type="submit" className="gold-button text-xs py-1.5 px-4">{locale === 'tr' ? 'Kaydet' : 'Save'}</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map(assign => {
                  const targetTree = spellTrees.find(t => t.id === assign.spell_tree_id);
                  return (
                    <div key={assign.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex justify-between items-start">
                      <div>
                        <h4 className="font-cinzel text-xs font-bold text-white">
                          {targetTree ? (locale === 'tr' ? targetTree.name_tr : targetTree.name_en) : 'Unknown Tree'}
                        </h4>
                        <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                          {assign.class_key && <div>Class category: <span className="text-amber-500">{assign.class_key}</span></div>}
                          {assign.subclass_key && <div>Subclass: <span className="text-amber-500">{assign.subclass_key}</span></div>}
                          {assign.race_key && <div>Race: <span className="text-amber-500">{assign.race_key}</span></div>}
                          <div>Min Level: <span className="text-white font-bold">{assign.min_level}</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAssign(assign);
                            setAssignTreeId(assign.spell_tree_id);
                            setAssignClassKey(assign.class_key || '');
                            setAssignSubclassKey(assign.subclass_key || '');
                            setAssignRaceKey(assign.race_key || '');
                            setAssignMinLevel(assign.min_level);
                            setShowAssignForm(true);
                          }}
                          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assign.id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtab Content: Spells */}
          {manageSubTab === 'spells' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-cinzel text-sm text-white font-bold">{locale === 'tr' ? 'Büyü Düğümleri Listesi' : 'Spell Nodes List'}</h3>
                  <select
                    value={manageSpellTreeFilter}
                    onChange={e => handleManageTreeFilterChange(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-gold"
                  >
                    <option value="all">{locale === 'tr' ? 'Tüm Yüklü Büyüler' : 'All Loaded Spells'}</option>
                    {spellTrees.map(t => (
                      <option key={t.id} value={t.id}>
                        {locale === 'tr' ? t.name_tr : t.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                {!showSpellForm && (
                  <button
                    onClick={() => {
                      resetSpellForm();
                      setShowSpellForm(true);
                    }}
                    className="gold-button flex items-center gap-1.5 text-xs py-1.5"
                  >
                    <Plus size={14} />
                    <span>{locale === 'tr' ? 'Büyü Ekle' : 'Add Spell'}</span>
                  </button>
                )}
              </div>

              {showSpellForm && (
                <form onSubmit={handleSaveSpell} className="glass border border-gold/30 rounded-xl p-4 space-y-4">
                  <h4 className="font-cinzel text-xs text-gold font-bold">{editingSpell ? (locale === 'tr' ? 'Büyüyü Düzenle' : 'Edit Spell') : (locale === 'tr' ? 'Yeni Büyü Ekle' : 'Add New Spell')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Spell Tree</label>
                      <select
                        value={spellTreeId}
                        onChange={e => setSpellTreeId(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      >
                        {spellTrees.map(t => (
                          <option key={t.id} value={t.id}>
                            {locale === 'tr' ? t.name_tr : t.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Spell Key (Unique)</label>
                      <input
                        type="text"
                        required
                        value={spellKey}
                        onChange={e => setSpellKey(e.target.value)}
                        placeholder="e.g. fire_bolt"
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Icon (Emoji)</label>
                      <input
                        type="text"
                        required
                        value={icon}
                        onChange={e => setIcon(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Name (TR)</label>
                      <input
                        type="text"
                        required
                        value={nameTr}
                        onChange={e => setNameTr(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Name (EN)</label>
                      <input
                        type="text"
                        required
                        value={nameEn}
                        onChange={e => setNameEn(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Branch</label>
                      <input
                        type="text"
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Min Level</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={minLevel}
                        onChange={e => setMinLevel(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">XP Cost</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={xpCost}
                        onChange={e => setXpCost(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Tier</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={tier}
                        onChange={e => setTier(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Prerequisites (comma-separated keys)</label>
                      <input
                        type="text"
                        value={prereqs}
                        onChange={e => setPrereqs(e.target.value)}
                        placeholder="e.g. shield, magic_missile"
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Position X</label>
                      <input
                        type="number"
                        required
                        value={posX}
                        onChange={e => setPosX(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Position Y</label>
                      <input
                        type="number"
                        required
                        value={posY}
                        onChange={e => setPosY(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Description (TR)</label>
                      <textarea
                        value={descTr}
                        onChange={e => setDescTr(e.target.value)}
                        rows={2}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold resize-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-semibold">Description (EN)</label>
                      <textarea
                        value={descEn}
                        onChange={e => setDescEn(e.target.value)}
                        rows={2}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 uppercase font-semibold">Effects (JSON)</label>
                    <textarea
                      value={effectsJson}
                      onChange={e => setEffectsJson(e.target.value)}
                      rows={3}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-gold resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={resetSpellForm} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold transition hover:bg-white/5">{locale === 'tr' ? 'İptal' : 'Cancel'}</button>
                    <button type="submit" className="gold-button text-xs py-1.5 px-4">{locale === 'tr' ? 'Kaydet' : 'Save'}</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {manageDisplayedSpells.map(spell => {
                  const targetTree = spellTrees.find(t => t.id === spell.spell_tree_id);
                  return (
                    <div key={spell.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="text-3xl p-1.5 bg-white/5 rounded-lg h-fit leading-none">{spell.icon || '🔮'}</span>
                        <div>
                          <h4 className="font-cinzel text-xs font-bold text-white leading-tight">
                            {locale === 'tr' ? spell.name_tr : spell.name_en}
                          </h4>
                          <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/5 text-gray-400 inline-block mt-1 font-semibold">
                            {spell.branch || 'Base'} • Tier {spell.tier} • Lv {spell.min_level}
                          </span>
                          <div className="text-[9px] text-gray-500 mt-2 space-y-0.5">
                            <div>Tree: <span className="text-gray-300">{targetTree ? (locale === 'tr' ? targetTree.name_tr : targetTree.name_en) : 'Unknown'}</span></div>
                            <div>XP Cost: <span className="text-gold font-bold">{spell.xp_cost}</span></div>
                            {spell.prerequisites && spell.prerequisites.length > 0 && (
                              <div>Prerequisites: <span className="text-gray-300">{spell.prerequisites.join(', ')}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingSpell(spell);
                            setSpellTreeId(spell.spell_tree_id);
                            setSpellKey(spell.spell_key);
                            setNameEn(spell.name_en);
                            setNameTr(spell.name_tr);
                            setDescEn(spell.description_en || '');
                            setDescTr(spell.description_tr || '');
                            setBranch(spell.branch || 'Base');
                            setMinLevel(spell.min_level || 1);
                            setXpCost(spell.xp_cost);
                            setTier(spell.tier);
                            setIcon(spell.icon || '🔮');
                            setPrereqs((spell.prerequisites || []).join(', '));
                            setPosX(spell.position?.x || 100);
                            setPosY(spell.position?.y || 100);
                            setEffectsJson(JSON.stringify(spell.effects || {}, null, 2));
                            setShowSpellForm(true);
                          }}
                          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteSpell(spell.id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Player Spells */}
      {activeTab === 'player' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-black/40 p-5 rounded-2xl border border-amber-900/20 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <User className="text-amber-400 w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[220px]">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  {locale === 'tr' ? 'Oyuncu / Karakter Seç' : 'Select Player / Character'}
                </label>
                <select
                  value={selectedCharId}
                  onChange={e => {
                    const newId = e.target.value;
                    setSelectedCharId(newId);
                    if (newId) setActiveCharacterId(newId);
                    if (newId && !isOffline) {
                      reloadCharacterSpells(newId);
                    }
                  }}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition"
                >
                  {characters.map(c => {
                    const learnedCount = new Set(
                      characterSpells
                        .filter(cs => cs.character_id === c.id && cs.unlocked !== false)
                        .map(cs => cs.spell_id)
                    ).size;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} (Lv.{c.level}) — #{c.id.slice(0, 4)} ({learnedCount} {locale === 'tr' ? 'büyü açık' : 'spells unlocked'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {activeChar && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                  {activeChar.subclass && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-cinzel font-bold text-[11px]">
                      {locale === 'tr' ? activeChar.subclass.name_tr : activeChar.subclass.name_en}
                    </span>
                  )}
                  {activeChar.race && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-cinzel font-medium text-[11px]">
                      {activeChar.race.name}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-white/10 text-gray-300 text-[11px]">
                    Lv.{activeChar.level}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[11px]">
                    XP: <strong className="text-white">{activeChar.xp_available}</strong> / {activeChar.xp_total}
                  </span>
                </div>
              )}
            </div>

            {selectedCharId && (
              <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                <button
                  type="button"
                  onClick={handleTeachAllSpells}
                  disabled={loading || loadingTreeSpells}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-cinzel font-bold uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-emerald-600/35 via-emerald-500/30 to-emerald-600/35 hover:from-emerald-500/50 hover:via-emerald-400/40 hover:to-emerald-500/50 text-emerald-100 border border-emerald-400/50 hover:border-emerald-300/80 shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/80 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
                  title={locale === 'tr' ? 'Seçili ağaçtaki tüm uygun büyüleri oyuncuya öğretir' : 'Teach all eligible spells in the current tree'}
                >
                  <BookOpen size={16} className="text-emerald-300" />
                  <span>{locale === 'tr' ? 'Tüm Büyüleri Öğret' : 'Teach All Spells'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleForgetAllSpells}
                  disabled={loading || loadingTreeSpells}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-cinzel font-bold uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-rose-900/40 via-red-800/40 to-rose-900/40 hover:from-rose-800/60 hover:via-red-700/60 hover:to-rose-800/60 text-rose-100 border border-rose-500/50 hover:border-rose-400/80 shadow-lg shadow-red-950/60 hover:shadow-red-900/80 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
                  title={locale === 'tr' ? 'Karakterin tüm öğrendiği büyüleri sıfırlar' : 'Remove all learned spells from this character'}
                >
                  <Trash2 size={16} className="text-rose-300" />
                  <span>{locale === 'tr' ? 'Tüm Büyüleri Unut' : 'Forget All Spells'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadData()}
                  disabled={loading}
                  className="p-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
                  title={locale === 'tr' ? 'Yenile' : 'Refresh'}
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            )}
          </div>

          {/* Filter and Search Toolbar */}
          {selectedCharId && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/25 p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    {locale === 'tr' ? 'Ağaç Filtresi:' : 'Tree Filter:'}
                  </span>
                  <select
                    value={playerTreeFilter}
                    onChange={e => handlePlayerTreeFilterChange(e.target.value)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 max-w-[280px]"
                  >
                    <option value="eligible">
                      ⭐ {locale === 'tr' ? 'Karakterin Uygun Ağaçları' : 'Eligible Trees'} ({matchedTrees.length > 0 ? matchedTrees.map(t => locale === 'tr' ? t.name_tr : t.name_en).join(', ') : (locale === 'tr' ? 'Tanımsız' : 'None')})
                    </option>
                    <option value="all">
                      🌐 {locale === 'tr' ? 'Tüm Yüklü Büyüler' : 'All Loaded Spells'}
                    </option>
                    <optgroup label={locale === 'tr' ? 'Tüm Büyü Ağaçları' : 'All Spell Trees'}>
                      {spellTrees.map(t => (
                        <option key={t.id} value={t.id}>
                          {locale === 'tr' ? t.name_tr : t.name_en}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={e => setPlayerSearchQuery(e.target.value)}
                    placeholder={locale === 'tr' ? 'Büyü ara...' : 'Search spells...'}
                    className="w-full pl-8 pr-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                {playerSearchQuery && (
                  <button
                    onClick={() => setPlayerSearchQuery('')}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg transition"
                  >
                    {locale === 'tr' ? 'Temizle' : 'Clear'}
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedCharId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-cinzel text-xs text-gold font-bold tracking-wider">
                    {locale === 'tr' ? 'Büyüleri Öğret / Kaldır' : 'Teach / Remove Spells'}
                  </h4>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    ({playerTreeFilter === 'eligible'
                      ? (matchedTrees.length > 0 ? matchedTrees.map(t => locale === 'tr' ? t.name_tr : t.name_en).join(', ') : (locale === 'tr' ? 'Özel ağaç yok' : 'No specific tree'))
                      : (spellTrees.find(t => t.id === playerTreeFilter)?.name_en || (locale === 'tr' ? 'Tüm Büyüler' : 'All Spells'))})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    {playerDisplayedSpells.filter(s => characterSpells.some(cs => cs.character_id === selectedCharId && cs.spell_id === s.id && cs.unlocked !== false)).length} / {playerDisplayedSpells.length} {locale === 'tr' ? 'öğrenildi' : 'unlocked in view'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {locale === 'tr' ? 'Toplam Öğrenilen:' : 'Total Learned:'} <strong className="text-white">{new Set(characterSpells.filter(cs => cs.character_id === selectedCharId && cs.unlocked !== false).map(cs => cs.spell_id)).size}</strong>
                  </span>
                </div>
              </div>

              {loadingTreeSpells && playerDisplayedSpells.length === 0 ? (
                <div className="p-12 text-center text-amber-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-amber-400" />
                  <span>{locale === 'tr' ? 'Büyü ağacı yükleniyor...' : 'Loading spell tree...'}</span>
                </div>
              ) : playerDisplayedSpells.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs border border-dashed border-white/10 rounded-2xl">
                  {locale === 'tr' ? 'Bu filtre altında gösterilecek büyü bulunamadı.' : 'No spells found matching the current filter.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                  {playerDisplayedSpells.map(spell => {
                    const isUnlocked = characterSpells.some(
                      cs => cs.character_id === selectedCharId && cs.spell_id === spell.id && cs.unlocked !== false
                    );

                    return (
                      <div
                        key={spell.id}
                        className={`p-3.5 rounded-xl border flex justify-between items-center transition-all duration-300 ${
                          isUnlocked
                            ? 'bg-emerald-950/25 border-emerald-500/35 hover:border-emerald-400/50 shadow-md shadow-emerald-950/40'
                            : 'bg-black/30 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="text-2xl leading-none shrink-0 p-1 bg-white/5 rounded-lg">{spell.icon || '🔮'}</span>
                          <div className="min-w-0">
                            <div className="font-cinzel text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{locale === 'tr' ? spell.name_tr : spell.name_en}</span>
                              {isUnlocked && (
                                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[9px] text-gray-500 uppercase mt-0.5 truncate">
                              {spell.branch || 'Base'} • Lv {spell.min_level} • Cost: {spell.xp_cost} XP
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleSpellForPlayer(spell, isUnlocked)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold uppercase tracking-wider shrink-0 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm ${
                            isUnlocked
                              ? 'bg-rose-500/15 border border-rose-500/35 hover:bg-rose-500/25 text-rose-300 hover:border-rose-400/50'
                              : 'bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-emerald-300 hover:border-emerald-400/50'
                          }`}
                        >
                          {isUnlocked
                            ? (locale === 'tr' ? 'Kaldır' : 'Remove')
                            : (locale === 'tr' ? 'Öğret' : 'Teach')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-xs">
              {locale === 'tr' ? 'Oyuncu bulunmamaktadır.' : 'No players available.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
