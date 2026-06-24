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
      {/* ── XP Display Panel ── */}
      <motion.div
        className="absolute top-4 right-4 z-10 glass rounded-xl px-5 py-3 min-w-[200px]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {activeCharacter && (
          <div className="flex items-center gap-2 mb-3 bg-black/30 rounded px-2 py-1">
            <Users size={12} className="text-gold/70" />
            <span className="text-[10px] text-parchment/70 uppercase">Viewing:</span>
            <span className="text-xs text-gold font-bold">{activeCharacter.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#ffd700]" />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-cinzel">
            Available XP
          </span>
        </div>
        <div className="text-2xl font-bold text-gold-gradient font-cinzel">
          {xp.toLocaleString()}
        </div>
        <div className="mt-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-2 mt-2">
          <TreePine className="w-3 h-3 text-emerald-500" />
          <span className="text-[11px] text-gray-400">
            {unlockedCount} / {totalSkills} skills unlocked
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 w-full h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#ffd700]"
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / totalSkills) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* ── Title Panel ── */}
      <motion.div
        className="absolute top-4 left-4 z-10 glass rounded-xl px-5 py-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <h2 className="text-lg font-cinzel font-bold text-gold-gradient">
            Yggdrasil
          </h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5 tracking-wider uppercase">
          The World Stat Tree
        </p>
      </motion.div>

      {/* ── React Flow ── */}
      <ReactFlow
        nodes={memoNodes}
        edges={memoEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
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
          nodeColor={(node) => {
            const d = node.data as Record<string, unknown>;
            return (d?.statColor as string) ?? '#333';
          }}
          maskColor="rgba(10, 10, 15, 0.85)"
          className="!bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
}
