import { useState, useMemo, useRef, useEffect } from 'react';
import { useBattleSimulation } from '../../hooks/useBattleSimulation';
import { EnemyDisplay } from '../EnemyDisplay';
import { PlayerDisplay } from '../PlayerDisplay';
import { CardDisplay } from '../CardDisplay';
import { AIDecisionLog } from '../AIDecisionLog';
import { BattleControls } from '../BattleControls';
import type { Card, EnemyDef, AIRule, BattleSummary, CombatLogEntry } from '../../models';
import { getCardById } from '../../data/gameData';
import { useGameState, getEffectiveHandSize } from '../../hooks/useGameState';

interface DungeonBattleProps {
  deckCardIds: string[];
  aiRules: AIRule[];
  enemyDefs: EnemyDef[];
  playerMaxHp: number;
  playerCurrentHp: number;
  onBattleComplete: (summary: BattleSummary) => void;
}

// ─── Action Feed: shows recent battle events with visual styling ───

interface ActionFeedEntry {
  id: number;
  entry: CombatLogEntry;
  timestamp: number;
}

function ActionFeed({ entries }: { entries: ActionFeedEntry[] }) {
  // Show last 4 entries
  const visible = entries.slice(-4);

  return (
    <div className="space-y-1">
      {visible.map((item, idx) => {
        const isLatest = idx === visible.length - 1;
        const msg = item.entry.message;
        const phase = item.entry.phase;

        // Detect damage, block, heal in the message for coloring
        const hasDamage = /\d+\s*(damage|dmg|to player|to \w)/i.test(msg) || /deals \d+/i.test(msg);
        const hasBlock = /block|blocked/i.test(msg);
        const hasHeal = /heal/i.test(msg);
        const hasPoison = /poison/i.test(msg);
        const isDefeated = /defeated|dies|victory|defeat/i.test(msg);

        let bgColor = 'bg-gray-800/60';
        let textColor = 'text-gray-300';
        let borderColor = 'border-gray-700/50';

        if (phase === 'player') {
          borderColor = 'border-emerald-800/50';
          if (hasDamage) {
            bgColor = isLatest ? 'bg-red-900/30' : 'bg-red-900/15';
            textColor = 'text-red-300';
          } else if (hasBlock) {
            bgColor = isLatest ? 'bg-sky-900/30' : 'bg-sky-900/15';
            textColor = 'text-sky-300';
          } else if (hasHeal) {
            bgColor = isLatest ? 'bg-emerald-900/30' : 'bg-emerald-900/15';
            textColor = 'text-emerald-300';
          } else if (hasPoison) {
            bgColor = isLatest ? 'bg-green-900/30' : 'bg-green-900/15';
            textColor = 'text-green-300';
          } else {
            textColor = 'text-emerald-300';
          }
        } else if (phase === 'enemy') {
          borderColor = 'border-red-800/50';
          textColor = 'text-red-300';
          if (hasDamage) {
            bgColor = isLatest ? 'bg-red-900/40' : 'bg-red-900/20';
          }
        } else if (phase === 'system') {
          borderColor = 'border-yellow-800/50';
          textColor = isDefeated ? 'text-yellow-300' : 'text-yellow-400';
          if (isDefeated) {
            bgColor = isLatest ? 'bg-yellow-900/30' : 'bg-yellow-900/15';
          }
        }

        return (
          <div
            key={item.id}
            className={`${bgColor} ${textColor} border ${borderColor} rounded px-3 py-1.5 text-xs leading-relaxed
              ${isLatest ? 'animate-pulse-once font-medium' : 'opacity-70'}`}
          >
            <span className="text-[10px] text-gray-500 mr-1.5">T{item.entry.turn}</span>
            {msg}
          </div>
        );
      })}
    </div>
  );
}

// ─── Inline Battle Summary ───

function InlineBattleSummary({ summary }: { summary: BattleSummary }) {
  const isWin = summary.result === 'win';

  return (
    <div className={`rounded-xl border-2 p-4 text-center mt-4
      ${isWin
        ? 'border-emerald-500/50 bg-emerald-900/20'
        : 'border-red-500/50 bg-red-900/20'
      }`}
    >
      <div className="text-3xl mb-1">{isWin ? '\uD83C\uDFC6' : '\uD83D\uDC80'}</div>
      <h3 className={`text-lg font-bold mb-3 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
        {isWin ? 'Victory!' : 'Defeat'}
      </h3>

      <div className="grid grid-cols-3 gap-2 text-xs max-w-sm mx-auto">
        <div className="bg-gray-800/60 rounded-lg p-2">
          <p className="text-gray-500 text-[10px] uppercase">Turns</p>
          <p className="text-white font-bold">{summary.turnsElapsed}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-2">
          <p className="text-gray-500 text-[10px] uppercase">Dmg Dealt</p>
          <p className="text-red-400 font-bold">{summary.damageDealt}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-2">
          <p className="text-gray-500 text-[10px] uppercase">Dmg Taken</p>
          <p className="text-orange-400 font-bold">{summary.damageReceived}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-2">
          <p className="text-gray-500 text-[10px] uppercase">Cards</p>
          <p className="text-blue-400 font-bold">{summary.cardsPlayed}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-2">
          <p className="text-gray-500 text-[10px] uppercase">HP Left</p>
          <p className={`font-bold ${summary.playerHpRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {Math.max(0, summary.playerHpRemaining)}
          </p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-2">
          <p className="text-gray-500 text-[10px] uppercase">Slain</p>
          <p className="text-amber-400 font-bold">{summary.enemiesDefeated}</p>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 mt-3 animate-pulse">Advancing...</p>
    </div>
  );
}

// ─── Main Component ───

export function DungeonBattle({ deckCardIds, aiRules, enemyDefs, playerMaxHp, playerCurrentHp, onBattleComplete }: DungeonBattleProps) {
  const { foilUpgrades } = useGameState();
  const deckCards: Card[] = useMemo(
    () => deckCardIds.map((id) => getCardById(id)).filter((c): c is Card => c !== undefined),
    [deckCardIds],
  );

  const enemyDefsMemo = useMemo(() => enemyDefs, [enemyDefs]);
  const handSize = getEffectiveHandSize(foilUpgrades);

  // Track action feed
  const [actionFeed, setActionFeed] = useState<ActionFeedEntry[]>([]);
  const nextFeedIdRef = useRef(0);
  const prevLogLenRef = useRef(0);

  // Track previous HP values for animation triggers
  const [enemyShake, setEnemyShake] = useState<Record<number, boolean>>({});
  const [playerShake, setPlayerShake] = useState(false);
  const prevPlayerHpRef = useRef<number | null>(null);
  const prevEnemyHpRef = useRef<Record<number, number>>({});

  const {
    simState,
    snapshot,
    summary,
    speed,
    startBattle,
    pause,
    resume,
    step,
    changeSpeed,
  } = useBattleSimulation(deckCards, aiRules, enemyDefsMemo, playerMaxHp, playerCurrentHp, handSize);

  // Keep a ref to startBattle so the auto-start effect doesn't depend on its identity
  const startBattleRef = useRef(startBattle);
  startBattleRef.current = startBattle;

  // Auto-start battle on mount — use empty deps + ref to avoid cleanup cancelling the timer
  useEffect(() => {
    const t = setTimeout(() => startBattleRef.current(), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track new log entries for the action feed
  useEffect(() => {
    if (!snapshot) return;
    const log = snapshot.state.log;
    if (log.length > prevLogLenRef.current) {
      const newEntries = log.slice(prevLogLenRef.current);
      prevLogLenRef.current = log.length;
      setActionFeed((prev) => {
        const additions = newEntries.map((entry) => ({
          id: nextFeedIdRef.current++,
          entry,
          timestamp: Date.now(),
        }));
        // Keep last 20 entries to prevent memory buildup
        return [...prev, ...additions].slice(-20);
      });
    }
  }, [snapshot]);

  // Trigger shake animations on HP changes
  useEffect(() => {
    if (!snapshot) return;
    const state = snapshot.state;

    // Player shake
    const pHp = state.player.hp;
    if (prevPlayerHpRef.current !== null && pHp < prevPlayerHpRef.current) {
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 400);
    }
    prevPlayerHpRef.current = pHp;

    // Enemy shake
    const shakes: Record<number, boolean> = {};
    for (const enemy of state.enemies) {
      const prevHp = prevEnemyHpRef.current[enemy.instanceId];
      if (prevHp !== undefined && enemy.hp < prevHp) {
        shakes[enemy.instanceId] = true;
      }
      prevEnemyHpRef.current[enemy.instanceId] = enemy.hp;
    }
    if (Object.keys(shakes).length > 0) {
      setEnemyShake(shakes);
      setTimeout(() => setEnemyShake({}), 400);
    }
  }, [snapshot]);

  // Keep stable refs for callbacks to avoid effect re-fires
  const onBattleCompleteRef = useRef(onBattleComplete);
  onBattleCompleteRef.current = onBattleComplete;
  const summaryRef = useRef(summary);
  summaryRef.current = summary;

  // When battle finishes, notify parent after a delay to show summary
  useEffect(() => {
    if (simState === 'finished' && summaryRef.current) {
      const s = summaryRef.current;
      const t = setTimeout(() => onBattleCompleteRef.current(s), 3000);
      return () => clearTimeout(t);
    }
  }, [simState]);

  const state = snapshot?.state;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Custom animation styles */}
      <style>{`
        @keyframes battle-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .battle-shake {
          animation: battle-shake 0.4s ease-in-out;
        }
        @keyframes pulse-once {
          0% { opacity: 0.5; transform: scale(0.97); }
          50% { opacity: 1; transform: scale(1.01); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-pulse-once {
          animation: pulse-once 0.3s ease-out;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>

      {/* Header with turn counter and controls */}
      <div className="border-b border-gray-800 px-6 py-2 flex items-center justify-between flex-shrink-0 bg-gray-900/80">
        <div className="flex items-center gap-3">
          {state && (
            <>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg
                ${state.phase === 'player_turn' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' :
                  state.phase === 'enemy_turn' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                  state.phase === 'won' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50' :
                  'bg-red-900/50 text-red-300 border border-red-500/50'
                }`}>
                Turn {state.turn}
              </span>
              <span className="text-xs text-gray-500">
                {state.phase === 'player_turn' ? 'Player Phase' :
                 state.phase === 'enemy_turn' ? 'Enemy Phase' :
                 state.phase === 'won' ? 'Victory' : 'Defeat'}
              </span>
            </>
          )}
          <span className="text-xs text-gray-600">
            vs {enemyDefs.map((e) => e.name).join(', ')}
          </span>
        </div>
        <BattleControls
          simState={simState}
          speed={speed}
          onStart={startBattle}
          onPause={pause}
          onResume={resume}
          onStep={step}
          onChangeSpeed={changeSpeed}
          onReset={() => {}}
          hideReset
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Battle area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4">
          {!state && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500 animate-pulse">Preparing battle...</p>
            </div>
          )}

          {state && (
            <>
              {/* Enemy area */}
              <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 text-center">Enemies</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {state.enemies.map((enemy) => (
                    <div
                      key={enemy.instanceId}
                      className={enemyShake[enemy.instanceId] ? 'battle-shake' : ''}
                    >
                      <EnemyDisplay enemy={enemy} />
                    </div>
                  ))}
                </div>
              </div>

              {/* VS divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 border-t border-gray-700" />
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">vs</span>
                <div className="flex-1 border-t border-gray-700" />
              </div>

              {/* Player area */}
              <div className={`flex justify-center mb-3 ${playerShake ? 'battle-shake' : ''}`}>
                <PlayerDisplay player={state.player} />
              </div>

              {/* Hand of cards */}
              <div className="mb-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 text-center">
                  Hand ({state.player.hand.length} cards)
                </p>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {state.player.hand.map((ci) => (
                    <CardDisplay key={ci.instanceId} cardInstance={ci} />
                  ))}
                  {state.player.hand.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No cards in hand</p>
                  )}
                </div>
              </div>

              {/* Action Feed - shows recent battle events inline */}
              <div className="mt-auto pt-2 border-t border-gray-800/50">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Recent Actions</p>
                <ActionFeed entries={actionFeed} />
              </div>

              {/* Battle Summary (shown when battle ends, before auto-advance) */}
              {simState === 'finished' && summary && (
                <InlineBattleSummary summary={summary} />
              )}
            </>
          )}
        </div>

        {/* Log sidebar - constrained height so it never pushes the battle arena */}
        <aside className="w-72 border-l border-gray-800 bg-gray-900/50 flex flex-col flex-shrink-0" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <AIDecisionLog
            log={state?.log ?? []}
            currentTurn={state?.turn ?? 0}
          />
        </aside>
      </div>
    </div>
  );
}
