import { useState, useMemo, useRef, useEffect } from 'react';
import { useBattleSimulation } from '../hooks/useBattleSimulation';
import { useGameState } from '../hooks/useGameState';
import { EnemyDisplay } from './EnemyDisplay';
import { PlayerDisplay } from './PlayerDisplay';
import { CardDisplay } from './CardDisplay';
import { AIDecisionLog } from './AIDecisionLog';
import { BattleControls } from './BattleControls';
import { ResultScreen } from './ResultScreen';
import { EnemySelector } from './EnemySelector';
import { allEnemies } from '../data/gameData';
import type { EnemyDef, CombatLogEntry } from '../models';

interface ActionFeedEntry {
  id: number;
  entry: CombatLogEntry;
  timestamp: number;
}

function ActionFeed({ entries }: { entries: ActionFeedEntry[] }) {
  const visible = entries.slice(-4);

  return (
    <div className="space-y-1">
      {visible.map((item, idx) => {
        const isLatest = idx === visible.length - 1;
        const msg = item.entry.message;
        const phase = item.entry.phase;

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
          if (hasDamage) bgColor = isLatest ? 'bg-red-900/40' : 'bg-red-900/20';
        } else if (phase === 'system') {
          borderColor = 'border-yellow-800/50';
          textColor = isDefeated ? 'text-yellow-300' : 'text-yellow-400';
          if (isDefeated) bgColor = isLatest ? 'bg-yellow-900/30' : 'bg-yellow-900/15';
        }

        return (
          <div
            key={item.id}
            className={`${bgColor} ${textColor} border ${borderColor} rounded px-3 py-1.5 text-xs leading-relaxed
              ${isLatest ? 'font-medium' : 'opacity-70'}`}
          >
            <span className="text-[10px] text-gray-500 mr-1.5">T{item.entry.turn}</span>
            {msg}
          </div>
        );
      })}
    </div>
  );
}

export function BattleScreen() {
  const { deckCards, aiRules } = useGameState();

  const [selectedEnemy, setSelectedEnemy] = useState<EnemyDef>(allEnemies[0]);
  const enemyDefs = useMemo(() => [selectedEnemy], [selectedEnemy]);

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
    reset,
  } = useBattleSimulation(deckCards, aiRules, enemyDefs);

  // Action feed state
  const [actionFeed, setActionFeed] = useState<ActionFeedEntry[]>([]);
  const nextFeedIdRef = useRef(0);
  const prevLogLenRef = useRef(0);

  // Animation state
  const [enemyShake, setEnemyShake] = useState<Record<number, boolean>>({});
  const [playerShake, setPlayerShake] = useState(false);
  const prevPlayerHpRef = useRef<number | null>(null);
  const prevEnemyHpRef = useRef<Record<number, number>>({});

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
        return [...prev, ...additions].slice(-20);
      });
    }
  }, [snapshot]);

  // Trigger shake animations on HP changes
  useEffect(() => {
    if (!snapshot) return;
    const state = snapshot.state;

    const pHp = state.player.hp;
    if (prevPlayerHpRef.current !== null && pHp < prevPlayerHpRef.current) {
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 400);
    }
    prevPlayerHpRef.current = pHp;

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

  // Reset action feed on new battle
  const handleReset = () => {
    setActionFeed([]);
    nextFeedIdRef.current = 0;
    prevLogLenRef.current = 0;
    prevPlayerHpRef.current = null;
    prevEnemyHpRef.current = {};
    reset();
  };

  const state = snapshot?.state;
  const showResult = simState === 'finished' && summary;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Animation styles */}
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
      `}</style>

      {/* Header */}
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
          {!state && (
            <span className="text-xs text-gray-500">
              Deck: {deckCards.length} cards &middot; {aiRules.length} AI rules
            </span>
          )}
        </div>
        <BattleControls
          simState={simState}
          speed={speed}
          onStart={startBattle}
          onPause={pause}
          onResume={resume}
          onStep={step}
          onChangeSpeed={changeSpeed}
          onReset={handleReset}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Battle area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4">
          {/* Pre-battle: enemy selection */}
          {simState === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">Select an enemy to fight</p>
                <EnemySelector
                  enemies={allEnemies}
                  selected={selectedEnemy}
                  onSelect={setSelectedEnemy}
                />
              </div>
              {deckCards.length < 12 && (
                <p className="text-xs text-red-400 bg-red-900/20 px-3 py-1.5 rounded">
                  Deck has only {deckCards.length} cards (min 12). Add more cards in the Deck Builder.
                </p>
              )}
              <div className="text-center mt-2">
                <button
                  onClick={startBattle}
                  disabled={deckCards.length === 0}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 text-lg"
                >
                  Start Battle
                </button>
              </div>
            </div>
          )}

          {/* Active battle */}
          {state && simState !== 'idle' && (
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
                      <EnemyDisplay key={enemy.instanceId} enemy={enemy} />
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

              {/* Action Feed */}
              <div className="mt-auto pt-2 border-t border-gray-800/50">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Recent Actions</p>
                <ActionFeed entries={actionFeed} />
              </div>
            </>
          )}
        </div>

        {/* Log sidebar */}
        <aside className="w-72 border-l border-gray-800 bg-gray-900/50 flex flex-col min-h-0 overflow-hidden flex-shrink-0">
          <AIDecisionLog
            log={state?.log ?? []}
            currentTurn={state?.turn ?? 0}
          />
        </aside>
      </div>

      {/* Result overlay */}
      {showResult && summary && (
        <ResultScreen summary={summary} onNewBattle={handleReset} />
      )}
    </div>
  );
}
