import { useRef, useEffect } from 'react';
import type { CombatLogEntry } from '../models';

interface AIDecisionLogProps {
  log: CombatLogEntry[];
  currentTurn: number;
}

const PHASE_STYLE: Record<string, string> = {
  player: 'text-emerald-400',
  enemy: 'text-red-400',
  system: 'text-yellow-400',
};

const PHASE_ICON: Record<string, string> = {
  player: '\u25B6',
  enemy: '\u25C0',
  system: '\u2605',
};

export function AIDecisionLog({ log, currentTurn }: AIDecisionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new log entries arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [log.length]);

  // Group entries by turn
  const turnGroups: { turn: number; entries: CombatLogEntry[] }[] = [];
  for (const entry of log) {
    const last = turnGroups[turnGroups.length - 1];
    if (last && last.turn === entry.turn) {
      last.entries.push(entry);
    } else {
      turnGroups.push({ turn: entry.turn, entries: [entry] });
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 py-2 border-b border-gray-700 flex-shrink-0">
        Combat Log
      </h3>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin min-h-0"
      >
        {turnGroups.map((group) => (
          <div key={group.turn}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5
              ${group.turn === currentTurn ? 'text-yellow-400' : 'text-gray-600'}`}>
              Turn {group.turn}
            </div>
            {group.entries.map((entry, i) => (
              <div
                key={`${group.turn}-${i}`}
                className={`text-[11px] leading-relaxed ${PHASE_STYLE[entry.phase] || 'text-gray-400'}`}
              >
                <span className="mr-1 opacity-60">{PHASE_ICON[entry.phase] || ''}</span>
                {entry.message}
              </div>
            ))}
          </div>
        ))}
        {log.length === 0 && (
          <p className="text-xs text-gray-600 italic">Waiting for battle to start...</p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
