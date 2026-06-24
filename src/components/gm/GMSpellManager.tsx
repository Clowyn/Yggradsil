import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { SpellTree, SpellTreeAssignment, SpellNode, Character, CharacterSpell } from '../../lib/types';
import { Plus, Trash2, Edit2, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function GMSpellManager() {
  const { locale } = useAuth();
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

  // Player Spells State
  const [selectedCharId, setSelectedCharId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: treesData, error: treesError } = await supabase
        .from('spell_trees')
        .select('*');
      if (treesError) throw treesError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('spell_tree_assignments')
        .select('*');
      if (assignmentsError) throw assignmentsError;

      const { data: spellsData, error: spellsError } = await supabase
        .from('spells')
        .select('*');
      if (spellsError) throw spellsError;

      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*');
      if (charError) throw charError;

      const { data: charSpellsData, error: charSpellsError } = await supabase
        .from('character_spells')
        .select('*, spell:spells(*)');
      if (charSpellsError) throw charSpellsError;

      setSpellTrees(treesData || []);
      setAssignments(assignmentsData || []);
      setSpells(spellsData || []);
      setCharacters(charData || []);
      setCharacterSpells(charSpellsData || []);

      if (charData && charData.length > 0) {
        setSelectedCharId(prev => prev || charData[0].id);
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
          class_key: 'arcane',
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
          updated_at: ''
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
    loadData();
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
      alert('Cannot perform write operations in offline mock mode.');
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
      alert('Failed to save tree.');
    }
  };

  // Delete Spell Tree
  const handleDeleteTree = async (id: string) => {
    if (isOffline) {
      alert('Cannot perform write operations in offline mock mode.');
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
      alert('Cannot perform write operations in offline mock mode.');
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
      alert('Failed to save assignment.');
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    if (isOffline) {
      alert('Cannot perform write operations in offline mock mode.');
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
      alert('Cannot perform write operations in offline mock mode.');
      return;
    }
    let parsedEffects = {};
    try {
      parsedEffects = JSON.parse(effectsJson);
    } catch (err) {
      alert(locale === 'tr' ? 'Etkiler JSON formatı geçersiz.' : 'Effects JSON format is invalid.');
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
      alert('Failed to save spell.');
    }
  };

  // Delete Spell Node
  const handleDeleteSpell = async (id: string) => {
    if (isOffline) {
      alert('Cannot perform write operations in offline mock mode.');
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

  // Toggle Player Spell (Teach / Remove)
  const handleToggleSpellForPlayer = async (spellId: string, isUnlocked: boolean) => {
    if (isOffline) {
      alert('Cannot perform write operations in offline mock mode.');
      return;
    }
    try {
      if (isUnlocked) {
        // Remove spell (delete record)
        const { error } = await supabase
          .from('character_spells')
          .delete()
          .eq('character_id', selectedCharId)
          .eq('spell_id', spellId);
        if (error) throw error;
      } else {
        // Teach spell (insert record)
        const { error } = await supabase
          .from('character_spells')
          .insert({
            character_id: selectedCharId,
            spell_id: spellId,
            unlocked: true,
            unlocked_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      loadData();
    } catch (err) {
      console.error('Failed to toggle player spell:', err);
    }
  };

  const activeChar = characters.find(c => c.id === selectedCharId);

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
              <div className="flex justify-between items-center">
                <h3 className="font-cinzel text-sm text-white font-bold">{locale === 'tr' ? 'Büyü Düğümleri Listesi' : 'Spell Nodes List'}</h3>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spells.map(spell => {
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
          <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
            <User className="text-gold w-5 h-5" />
            <div className="flex flex-col gap-1 w-full max-w-[240px]">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                {locale === 'tr' ? 'Oyuncu Seç' : 'Select Player'}
              </label>
              <select
                value={selectedCharId}
                onChange={e => setSelectedCharId(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-gold"
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Lv.{c.level})
                  </option>
                ))}
              </select>
            </div>
            {activeChar && (
              <div className="text-[10px] text-gray-400 flex gap-4 ml-6 uppercase">
                <div>XP Total: <span className="text-white font-bold">{activeChar.xp_total}</span></div>
                <div>XP Available: <span className="text-gold font-bold">{activeChar.xp_available}</span></div>
              </div>
            )}
          </div>

          {selectedCharId ? (
            <div className="space-y-3">
              <h4 className="font-cinzel text-xs text-gold font-bold tracking-wider">
                {locale === 'tr' ? 'Büyüleri Öğret / Kaldır' : 'Teach / Remove Spells'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {spells.map(spell => {
                  const isUnlocked = characterSpells.some(
                    cs => cs.character_id === selectedCharId && cs.spell_id === spell.id
                  );

                  return (
                    <div
                      key={spell.id}
                      className={`p-3.5 rounded-xl border flex justify-between items-center transition-all duration-300 ${
                        isUnlocked
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30'
                          : 'bg-black/20 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{spell.icon || '🔮'}</span>
                        <div>
                          <div className="font-cinzel text-xs font-bold text-white">
                            {locale === 'tr' ? spell.name_tr : spell.name_en}
                          </div>
                          <div className="text-[9px] text-gray-500 uppercase mt-0.5">
                            {spell.branch || 'Base'} • Lv {spell.min_level} • Cost: {spell.xp_cost} XP
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSpellForPlayer(spell.id, isUnlocked)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 ${
                          isUnlocked
                            ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400'
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
