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
    <div className="relative w-full h-[calc(100vh-4rem)] bg-abyss rounded-xl overflow-hidden border border-glass-border">
      {/* ── Unified Futuristic HUD Bar (Responsive, No Mobile Collision) ── */}
      <motion.div
        className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title Panel */}
        <div className="holo-card px-4 py-2.5 border border-cyan-400/30 flex items-center gap-3 pointer-events-auto bg-black/85 backdrop-blur-md self-start shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <div className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
            <TreePine className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-orbitron font-bold text-white tracking-wide flex items-center gap-2">
              <span>YGGDRASIL</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                NEU.03
              </span>
            </h2>
            <p className="text-[10px] text-parchment-dim font-mono tracking-wider uppercase">
              The World Stat Tree
            </p>
          </div>
        </div>

        {/* XP Display Panel */}
        <div className="holo-card px-4 py-2.5 border border-cyan-400/30 min-w-[220px] pointer-events-auto bg-black/85 backdrop-blur-md self-end md:self-auto shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          {activeCharacter && (
            <div className="flex items-center gap-2 mb-1.5 bg-black/40 rounded px-2 py-1 border border-cyan-400/20">
              <Users size={12} className="text-cyan-400" />
              <span className="text-[10px] text-parchment-dim uppercase">OPERATOR:</span>
              <span className="text-xs text-cyan-300 font-bold font-mono">{activeCharacter.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 text-[10px] font-mono text-parchment-dim uppercase">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Available XP</span>
            </div>
            <div className="text-sm font-bold font-orbitron text-cyan-300">
              {xp.toLocaleString()} XP
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-parchment-dim mt-1">
            <span>{unlockedCount} / {totalSkills} skills</span>
            <span className="text-emerald font-semibold">
              {totalSkills > 0 ? Math.round((unlockedCount / totalSkills) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1 w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_6px_#00f0ff]"
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
