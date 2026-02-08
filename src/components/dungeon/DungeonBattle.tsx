import { useState, useMemo, useRef, useEffect } from 'react';
import { useBattleSimulation } from '../../hooks/useBattleSimulation';
import { EnemyDisplay } from '../EnemyDisplay';
import { PlayerDisplay } from '../PlayerDisplay';
import { CardDisplay } from '../CardDisplay';
import { AIDecisionLog } from '../AIDecisionLog';
import { BattleControls } from '../BattleControls';
import type { Card, EnemyDef, AIRule, BattleSummary } from '../../models';
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

export function DungeonBattle({ deckCardIds, aiRules, enemyDefs, playerMaxHp, playerCurrentHp, onBattleComplete }: DungeonBattleProps) {
  const { foilUpgrades } = useGameState();
  const deckCards: Card[] = useMemo(
    () => deckCardIds.map((id) => getCardById(id)).filter((c): c is Card => c !== undefined),
    [deckCardIds],
  );

  const enemyDefsMemo = useMemo(() => enemyDefs, [enemyDefs]);
  const handSize = getEffectiveHandSize(foilUpgrades);
  const [battleStarted, setBattleStarted] = useState(false);

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

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot?.state.log.length]);

  // Auto-start battle on mount
  useEffect(() => {
    if (!battleStarted) {
      setBattleStarted(true);
      // Small delay to let the UI render first
      const t = setTimeout(() => startBattle(), 100);
      return () => clearTimeout(t);
    }
  }, [battleStarted, startBattle]);

  // When battle finishes, notify parent
  useEffect(() => {
    if (simState === 'finished' && summary) {
      // Small delay so the player can see the final state
      const t = setTimeout(() => onBattleComplete(summary), 1500);
      return () => clearTimeout(t);
    }
  }, [simState, summary, onBattleComplete]);

  const state = snapshot?.state;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-2 flex items-center justify-between flex-shrink-0 bg-gray-900/80">
        <div className="flex items-center gap-3">
          {state && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              Turn {state.turn} &middot; {state.phase === 'player_turn' ? 'Player Phase' : state.phase === 'enemy_turn' ? 'Enemy Phase' : state.phase}
            </span>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Battle area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          {state && (
            <>
              {/* Enemy area */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">Enemies</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {state.enemies.map((enemy) => (
                    <EnemyDisplay key={enemy.instanceId} enemy={enemy} />
                  ))}
                </div>
              </div>

              {/* VS divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-gray-700" />
                <span className="text-xs text-gray-600 uppercase tracking-widest">vs</span>
                <div className="flex-1 border-t border-gray-700" />
              </div>

              {/* Player area */}
              <div className="flex justify-center mb-6">
                <PlayerDisplay player={state.player} />
              </div>

              {/* Hand of cards */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">
                  Hand ({state.player.hand.length} cards)
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {state.player.hand.map((ci) => (
                    <CardDisplay key={ci.instanceId} cardInstance={ci} />
                  ))}
                  {state.player.hand.length === 0 && (
                    <p className="text-sm text-gray-600 italic">No cards in hand</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Log sidebar */}
        <aside className="w-72 border-l border-gray-800 bg-gray-900/50 flex flex-col overflow-hidden">
          <AIDecisionLog
            log={state?.log ?? []}
            currentTurn={state?.turn ?? 0}
          />
          <div ref={logEndRef} />
        </aside>
      </div>
    </div>
  );
}
