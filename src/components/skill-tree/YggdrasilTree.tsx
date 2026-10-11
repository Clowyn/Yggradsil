import { useMemo } from 'react';
import { ReactFlow, Controls, MiniMap, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { TreePine, Sparkles } from 'lucide-react';

import { useSkillTree } from '../../hooks/useSkillTree';
import { SkillNode } from './SkillNode';
import { SkillEdge } from './SkillEdge';

// ─── Node & Edge type registries ──────────────────────────────

const nodeTypes = { skillNode: SkillNode };
const edgeTypes = { skillEdge: SkillEdge };
const getSkillMiniMapNodeColor = (node: Node) => {
  const d = node.data as Record<string, unknown>;
  return (d?.statColor as string) ?? '#333';
};

// ─── YggdrasilTree ─────────────────────────────────────────────

import { useCampaign } from '../../contexts/CampaignContext';
import { Users } from 'lucide-react';

// ... (skip down to the component) ...

export function YggdrasilTree() {
  const { activeCharacterId, characters } = useCampaign();
  const activeCharacter = characters?.find(c => c.id === activeCharacterId);

  // Pass activeCharacterId to useSkillTree when implemented in backend
  const { nodes, edges, onNodeClick, xp, unlockedCount, totalSkills } = useSkillTree();

  // Memoize to prevent unnecessary re-renders
  const memoNodes = useMemo<Node[]>(() => nodes, [nodes]);
  const memoEdges = useMemo<Edge[]>(() => edges, [edges]);

  return (
    <div className="relative w-full h-full bg-abyss rounded-2xl overflow-hidden border border-amber-900/35 shadow-2xl">
      {/* ── Unified Yggdrasil Tree HUD Bar ── */}
      <motion.div
        className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title Panel */}
        <div className="arcane-glass px-4 py-2.5 border border-amber-900/35 flex items-center gap-3 pointer-events-auto bg-[#0e1017]/90 backdrop-blur-md self-start shadow-xl rounded-2xl">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-900/40">
            <TreePine className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-cinzel font-bold text-amber-100 tracking-wide flex items-center gap-2">
              <span>YGGDRASIL TREE</span>
              <span className="text-[10px] font-cinzel px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-900/40">
                ATTUNED
              </span>
            </h2>
            <p className="text-[10px] text-amber-200/60 font-cinzel tracking-wider uppercase">
              The World Stat Tree
            </p>
          </div>
        </div>

        {/* XP Display Panel */}
        <div className="arcane-glass px-4 py-2.5 border border-amber-900/35 min-w-[220px] pointer-events-auto bg-[#0e1017]/90 backdrop-blur-md self-end md:self-auto shadow-xl rounded-2xl">
          {activeCharacter && (
            <div className="flex items-center gap-2 mb-1.5 bg-black/40 rounded-xl px-2.5 py-1 border border-amber-900/30">
              <Users size={12} className="text-amber-400" />
              <span className="text-[10px] font-cinzel text-amber-200/60 uppercase">HERO:</span>
              <span className="text-xs text-amber-200 font-bold font-cinzel">{activeCharacter.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 text-[10px] font-cinzel text-amber-200/70 uppercase">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Available XP</span>
            </div>
            <div className="text-sm font-bold font-cinzel text-amber-300">
              {xp.toLocaleString()} XP
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-cinzel text-amber-200/60 mt-1">
            <span>{unlockedCount} / {totalSkills} skills</span>
            <span className="text-emerald-400 font-semibold">
              {totalSkills > 0 ? Math.round((unlockedCount / totalSkills) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1 w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-amber-950/40">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 shadow-[0_0_6px_#f59e0b]"
              initial={{ width: 0 }}
              animate={{ width: `${totalSkills > 0 ? (unlockedCount / totalSkills) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── React Flow ── */}
      <ReactFlow
        nodes={memoNodes}
        edges={memoEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onlyRenderVisibleElements={true}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-abyss"
      >
        <Background
          color="#1a0a2e"
          gap={40}
          size={1}
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        <MiniMap
          nodeColor={getSkillMiniMapNodeColor}
          maskColor="rgba(10, 10, 15, 0.85)"
          className="!bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
}
