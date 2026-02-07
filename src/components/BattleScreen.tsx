import { useState, useMemo, useRef, useEffect } from 'react';
import { useBattleSimulation } from '../hooks/useBattleSimulation';
import { EnemyDisplay } from './EnemyDisplay';
import { PlayerDisplay } from './PlayerDisplay';
import { CardDisplay } from './CardDisplay';
import { AIDecisionLog } from './AIDecisionLog';
import { BattleControls } from './BattleControls';
import { ResultScreen } from './ResultScreen';
import { EnemySelector } from './EnemySelector';
import type { Card, EnemyDef, AIRule } from '../models';

import cardsData from '../data/cards.json';
import enemiesData from '../data/enemies.json';
import configData from '../data/game-config.json';

// ─── Load data ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allCards: Card[] = (cardsData as any).cards;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allEnemies: EnemyDef[] = (enemiesData as any).enemies;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const starterDeckDef = (configData as any).starterDecks[0] as { cards: Array<{ id: string; count: number }>; aiRules: AIRule[] };

function buildStarterDeck(): Card[] {
  const deck: Card[] = [];
  for (const entry of starterDeckDef.cards) {
    const cardDef = allCards.find((c) => c.id === entry.id);
    if (cardDef) {
      for (let i = 0; i < entry.count; i++) {
        deck.push(cardDef);
      }
    }
  }
  return deck;
}

export function BattleScreen() {
  const deckCards = useMemo(() => buildStarterDeck(), []);
  const aiRules: AIRule[] = starterDeckDef.aiRules;

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

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot?.state.log.length]);

  const state = snapshot?.state;
  const showResult = simState === 'finished' && summary;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">CardForge: Idle Spire</h1>
          {state && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              Turn {state.turn} &middot; {state.phase === 'player_turn' ? 'Player Phase' : state.phase === 'enemy_turn' ? 'Enemy Phase' : state.phase}
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
          onReset={reset}
        />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Battle area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6">
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
              <div className="text-center mt-4">
                <p className="text-gray-500 text-xs mb-1">Starter Deck ({deckCards.length} cards) &middot; {aiRules.length} AI Rules</p>
                <button
                  onClick={startBattle}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 text-lg"
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

      {/* Result overlay */}
      {showResult && summary && (
        <ResultScreen summary={summary} onNewBattle={reset} />
      )}
    </div>
  );
}
