import { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, BookOpen, Filter, AlertTriangle } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';
import { useSpellTree, BRANCH_COLORS } from '../../hooks/useSpellTree';
import { SpellNode } from './SpellNode';
import { SpellEdge } from './SpellEdge';
import { useAuth } from '../../contexts/AuthContext';
import { type SpellNode as SpellNodeType } from '../../lib/types';

const nodeTypes = { spellNode: SpellNode };
const edgeTypes = { spellEdge: SpellEdge };

function SpellTreeFlow() {
  const { activeCharacterId } = useCampaign();
  const { locale } = useAuth();

  const {
    nodes,
    edges,
    onNodeClick,
    xp,
    unlockedCount,
    totalSpells,
    isMock,
    character,
  } = useSpellTree(activeCharacterId);

  const { setCenter, getZoom } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeBranchFilter, setActiveBranchFilter] = useState<string | null>(null);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);

  // Helper to retrieve the original spell definition of a node
  const visibleSpells = useMemo(() => {
    return nodes.map(n => n.data.spell).filter(Boolean) as SpellNodeType[];
  }, [nodes]);

  // Ancestors & descendants calculation for Milestone 3 selection path focus
  const getActivePathIds = useCallback((selectedId: string): Set<string> => {
    const activeIds = new Set<string>();
    activeIds.add(selectedId);

    const selectedSpell = visibleSpells.find(s => s.id === selectedId);
    if (!selectedSpell) return activeIds;

    // Recursively add ancestors
    const addAncestors = (spellKey: string) => {
      const spell = visibleSpells.find(s => s.spell_key === spellKey);
      if (!spell) return;
      if (activeIds.has(spell.id)) return;
      activeIds.add(spell.id);
      if (spell.prerequisites) {
        spell.prerequisites.forEach(preKey => addAncestors(preKey));
      }
    };

    if (selectedSpell.prerequisites) {
      selectedSpell.prerequisites.forEach(preKey => addAncestors(preKey));
    }

    // Recursively add descendants
    const addDescendants = (spellKey: string) => {
      const children = visibleSpells.filter(
        s => s.prerequisites && s.prerequisites.includes(spellKey)
      );
      children.forEach(child => {
        if (activeIds.has(child.id)) return;
        activeIds.add(child.id);
        addDescendants(child.spell_key);
      });
    };

    addDescendants(selectedSpell.spell_key);

    return activeIds;
  }, [visibleSpells]);

  const activePathIds = useMemo(() => {
    if (!selectedNodeId) return null;
    return getActivePathIds(selectedNodeId);
  }, [selectedNodeId, getActivePathIds]);

  // Adjust nodes opacity based on selected path and school filter
  const processedNodes = useMemo<Node[]>(() => {
    return nodes.map(node => {
      let opacity = 1.0;
      let filter = 'none';

      if (node.data?.isDimmed) {
        opacity = 0.35;
        filter = 'grayscale(80%) brightness(45%) contrast(85%)';
      }

      if (activePathIds) {
        if (activePathIds.has(node.id)) {
          opacity = 1.0;
        } else {
          opacity = 0.15;
        }
      }

      if (activeBranchFilter) {
        const spell = node.data.spell as any;
        if (spell && spell.branch && spell.branch.toLowerCase() !== activeBranchFilter.toLowerCase()) {
          opacity = 0.15;
        }
      }

      return {
        ...node,
        style: {
          opacity,
          filter,
        },
      };
    });
  }, [nodes, activePathIds, activeBranchFilter]);

  // Adjust edges opacity based on selected path and branch filter
  const processedEdges = useMemo<Edge[]>(() => {
    return edges.map(edge => {
      let opacity = 1.0;
      
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const isSourceDimmed = sourceNode?.data?.isDimmed;
      const isTargetDimmed = targetNode?.data?.isDimmed;

      if (isSourceDimmed || isTargetDimmed) {
        opacity = 0.15;
      }

      if (activePathIds) {
        if (activePathIds.has(edge.source) && activePathIds.has(edge.target)) {
          opacity = isSourceDimmed || isTargetDimmed ? 0.15 : 1.0;
        } else {
          opacity = 0.15;
        }
      }

      if (activeBranchFilter) {
        const sourceSpell = sourceNode?.data.spell as any;
        const targetSpell = targetNode?.data.spell as any;

        const sourceMatches = sourceSpell?.branch && sourceSpell.branch.toLowerCase() === activeBranchFilter.toLowerCase();
        const targetMatches = targetSpell?.branch && targetSpell.branch.toLowerCase() === activeBranchFilter.toLowerCase();

        if (!sourceMatches || !targetMatches) {
          opacity = 0.15;
        }
      }

      return {
        ...edge,
        style: {
          ...edge.style,
          opacity,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      };
    });
  }, [edges, nodes, activePathIds, activeBranchFilter]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data?.isDimmed) return; // Prevent clicks on dimmed sibling subclass trees
      onNodeClick(event, node);
      setSelectedNodeId(node.id);

      // Center the viewport on selected node
      const zoom = getZoom();
      setCenter(node.position.x + 55, node.position.y + 55, {
        zoom: Math.max(zoom, 1.2),
        duration: 800,
      });
    },
    [onNodeClick, setCenter, getZoom]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    visibleSpells.forEach(s => {
      if (s.branch) branches.add(s.branch);
    });
    return Array.from(branches);
  }, [visibleSpells]);

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] bg-abyss rounded-xl overflow-hidden border border-glass-border">
      {/* Fallback offline indicator */}
      <AnimatePresence>
        {isMock && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md"
          >
            <AlertTriangle size={14} />
            <span>
              {locale === 'tr'
                ? '[Çevrimdışı Demo Modu — Veritabanı Kullanılamıyor]'
                : '[Offline Demo Mode — Database Unavailable]'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title block */}
      <motion.div
        className="absolute top-4 left-4 z-10 glass rounded-xl px-5 py-3 border border-glass-border"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-cinzel font-bold text-gold-gradient">
            {locale === 'tr' ? 'Büyü Ağacı' : 'Spell Tree'}
          </h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5 tracking-wider uppercase">
          {locale === 'tr' ? 'Antik Büyüler ve Dallar' : 'Ancient Magic & Branches'}
        </p>
      </motion.div>

      {/* Branch filters overlay */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          layout: { duration: 0.3, type: "spring", stiffness: 200, damping: 25 },
          opacity: { duration: 0.2 }
        }}
        className={`absolute bottom-4 left-4 z-10 rounded-xl border backdrop-blur-xl shadow-2xl transition-colors duration-300 ${
          isFilterMinimized
            ? "p-2 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent border-gold/30 cursor-pointer hover:border-gold/60"
            : "p-3 bg-gradient-to-br from-white/12 via-white/[0.04] to-transparent border-white/10 w-[290px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
        }`}
        onClick={() => {
          if (isFilterMinimized) setIsFilterMinimized(false);
        }}
      >
        {isFilterMinimized ? (
          /* COLLAPSED PILL STATE */
          <div className="flex items-center justify-center gap-1.5 relative group">
            <div className="relative">
              <Filter 
                size={14} 
                className={`transition-colors duration-300 ${
                  activeBranchFilter ? "text-gold animate-pulse" : "text-gray-400"
                }`} 
              />
              {activeBranchFilter && (
                <span 
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black" 
                  style={{ backgroundColor: BRANCH_COLORS[activeBranchFilter] || "#3b82f6" }}
                />
              )}
            </div>
            <span className="text-[10px] font-cinzel font-bold text-gold uppercase tracking-wider select-none">
              {activeBranchFilter ? activeBranchFilter : (locale === 'tr' ? 'Süzgeç' : 'Filters')}
            </span>
            
            {/* Tooltip on Hover */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-void/95 border border-gold/20 text-gold text-[9px] font-cinzel rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl">
              {locale === 'tr' ? 'Süzgeçleri Aç' : 'Expand Filters'}
            </div>
          </div>
        ) : (
          /* EXPANDED PANEL STATE */
          <div className="flex flex-col gap-2">
            {/* Header with toggle */}
            <div className="flex items-center justify-between w-full pb-1.5 border-b border-white/5">
              <div className="text-[10px] text-gold font-cinzel font-semibold uppercase tracking-widest flex items-center gap-1">
                <Filter size={10} className="text-gold" />
                <span>{locale === 'tr' ? 'Dala Göre Süz' : 'Filter by Branch'}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Avoid triggering parent expand onClick
                  setIsFilterMinimized(true);
                }}
                className="text-gray-500 hover:text-gold hover:bg-white/5 p-0.5 rounded transition-all cursor-pointer"
                title={locale === 'tr' ? 'Paneli Küçült' : 'Minimize Panel'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Button Grid */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {/* 'All' Button */}
              <button
                onClick={() => setActiveBranchFilter(null)}
                className={`px-2.5 py-1 rounded text-[10px] font-cinzel font-bold uppercase transition-all duration-200 border cursor-pointer ${
                  activeBranchFilter === null
                    ? 'bg-gold/15 text-gold border-gold/40 shadow-[0_0_8px_rgba(255,215,0,0.2)]'
                    : 'bg-black/30 text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                {locale === 'tr' ? 'Tümü' : 'All'}
              </button>

              {/* Dynamic Branch Buttons */}
              {uniqueBranches.map(branch => {
                const color = BRANCH_COLORS[branch] || '#3b82f6';
                const isActive = activeBranchFilter === branch;
                return (
                  <button
                    key={branch}
                    onClick={() => setActiveBranchFilter(branch)}
                    className="px-2.5 py-1 rounded text-[10px] font-cinzel font-bold uppercase transition-all duration-300 border flex items-center gap-1 cursor-pointer"
                    style={{
                      backgroundColor: isActive ? `${color}18` : 'rgba(0,0,0,0.3)',
                      color: isActive ? '#ffffff' : '#9ca3af',
                      borderColor: isActive ? `${color}80` : 'rgba(255,255,255,0.05)',
                      boxShadow: isActive ? `0 0 10px -1px ${color}50` : 'none',
                    }}
                  >
                    {isActive && (
                      <span 
                        className="w-1.5 h-1.5 rounded-full animate-pulse" 
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span style={{ color: isActive ? color : undefined }}>
                      {branch}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* XP Display & Progress Panel */}
      <motion.div
        className="absolute top-4 right-4 z-10 glass rounded-xl px-5 py-3 min-w-[220px] border border-glass-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {character && (
          <div className="flex items-center gap-2 mb-3 bg-black/30 rounded px-2.5 py-1.5 border border-white/5">
            <Users size={12} className="text-gold/70" />
            <div className="flex flex-col">
              <span className="text-[9px] text-parchment/50 uppercase leading-none">Character</span>
              <span className="text-xs text-gold font-bold leading-tight mt-0.5">{character.name}</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#ffd700]" />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-cinzel font-semibold">
            {locale === 'tr' ? 'Kullanılabilir XP' : 'Available XP'}
          </span>
        </div>
        <div className="text-2xl font-bold text-gold-gradient font-cinzel">
          {xp.toLocaleString()} XP
        </div>
        <div className="mt-2.5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[11px] text-gray-400">
            {locale === 'tr'
              ? `${unlockedCount} / ${totalSpells} büyü açıldı`
              : `${unlockedCount} / ${totalSpells} spells unlocked`}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-[#ffd700]"
            initial={{ width: 0 }}
            animate={{ width: `${totalSpells > 0 ? (unlockedCount / totalSpells) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* React Flow Component */}
      <ReactFlow
        nodes={processedNodes}
        edges={processedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-abyss"
      >
        <Background color="#160826" gap={40} size={1} />
        <Controls showInteractive={false} className="!bottom-4 !right-4" />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as any;
            return d?.nodeColor || '#3b82f6';
          }}
          maskColor="rgba(10, 10, 15, 0.85)"
          className="!bottom-[80px] !right-4"
        />
      </ReactFlow>
    </div>
  );
}

export function SpellTreeGraph() {
  return (
    <ReactFlowProvider>
      <SpellTreeFlow />
    </ReactFlowProvider>
  );
}
