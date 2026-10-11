import { useEffect, useRef } from 'react';
import { Scroll, Swords, Sparkles, Heart, AlertCircle } from 'lucide-react';
import type { CombatArenaLog } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface ArenaLogStreamProps {
  logs: CombatArenaLog[];
}

export function ArenaLogStream({ logs }: ArenaLogStreamProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full arcane-glass rounded-2xl p-4 border border-amber-900/40 bg-[#0a0c13]/90 shadow-xl backdrop-blur-md space-y-2">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <Scroll className="w-4 h-4 text-amber-400" />
        <h3 className="font-cinzel text-xs font-bold text-amber-200 uppercase tracking-widest">
          {t.arena.logTitle} ({logs.length})
        </h3>
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
        {logs.length === 0 ? (
          <p className="text-xs font-cinzel text-stone-500 italic">
            {t.arena.logEmpty}
          </p>
        ) : (
          logs.map((log) => {
            const isSpell = log.action_type === 'spell';
            const isAttack = log.action_type === 'attack';
            const isItem = log.action_type === 'item';
            const isDot = log.action_type === 'dot';

            return (
              <div
                key={log.id}
                className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2 text-xs font-cinzel"
              >
                <div className="mt-0.5 shrink-0">
                  {isSpell ? (
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  ) : isAttack ? (
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                  ) : isItem ? (
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isDot ? (
                    <span className="text-sm">🤢</span>
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-stone-300 leading-relaxed">{log.message}</span>
                </div>

                {log.damage_dealt ? (
                  <span className="text-red-400 font-bold tabular-nums shrink-0">
                    -{log.damage_dealt} HP
                  </span>
                ) : log.healing_done ? (
                  <span className="text-emerald-400 font-bold tabular-nums shrink-0">
                    +{log.healing_done} HP
                  </span>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
