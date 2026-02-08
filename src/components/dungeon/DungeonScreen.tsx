import { useState, useCallback, useMemo } from 'react';
import { useRunState } from '../../hooks/useRunState';
import { useGameState } from '../../hooks/useGameState';
import { DungeonMapView } from './DungeonMapView';
import { RunHUD } from './RunHUD';
import { DungeonBattle } from './DungeonBattle';
import { DungeonRewardScreen } from './DungeonRewardScreen';
import { DungeonEventScreen } from './DungeonEventScreen';
import { DungeonShopScreen } from './DungeonShopScreen';
import { DungeonRestScreen } from './DungeonRestScreen';
import { DungeonChestScreen } from './DungeonChestScreen';
import { CardRemoveScreen } from './CardRemoveScreen';
import { CardUpgradeScreen } from './CardUpgradeScreen';
import { RunSummaryScreen } from './RunSummaryScreen';
import type { BattleSummary, EnemyDef } from '../../models';
import { gameEvents } from '../../data/gameData';

export function DungeonScreen() {
  const { deckCardIds, aiRules } = useGameState();
  const {
    run,
    isRunActive: _isRunActive,
    startRun,
    abandonRun,
    selectNode,
    getEnemyDefsForCurrentNode,
    completeBattle,
    pickRewardCard,
    skipReward,
    executeEventChoice,
    closeEvent,
    getShopState,
    buyShopCard,
    buyHealFlask,
    buyCardRemoval,
    leaveShop,
    restHeal,
    restUpgrade,
    getChestReward,
    collectChest,
    removeCardFromDeck,
    cancelCardAction,
    upgradeCard,
    getRunSummary,
    returnToMap,
  } = useRunState();

  // Cache enemy defs for current battle to avoid regenerating on re-render
  const [cachedEnemies, setCachedEnemies] = useState<EnemyDef[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);

  const handleSelectNode = useCallback((nodeId: string) => {
    // Pre-generate enemies if it's a battle node
    selectNode(nodeId);
  }, [selectNode]);

  // When entering battle phase, cache enemies
  const battleEnemies = useMemo(() => {
    if (run?.phase === 'battle' && cachedEnemies.length === 0) {
      const enemies = getEnemyDefsForCurrentNode();
      setCachedEnemies(enemies);
      return enemies;
    }
    if (run?.phase !== 'battle') {
      if (cachedEnemies.length > 0) setCachedEnemies([]);
      return [];
    }
    return cachedEnemies;
  }, [run?.phase, run?.currentNodeId, cachedEnemies, getEnemyDefsForCurrentNode]);

  // When entering event phase, pick a random event
  const currentEventId = useMemo(() => {
    if (run?.phase === 'event' && !eventId) {
      const id = gameEvents[Math.floor(Math.random() * gameEvents.length)]?.id ?? null;
      setEventId(id);
      return id;
    }
    if (run?.phase !== 'event') {
      if (eventId) setEventId(null);
      return null;
    }
    return eventId;
  }, [run?.phase, run?.currentNodeId, eventId]);

  const handleBattleComplete = useCallback((summary: BattleSummary) => {
    setCachedEnemies([]);
    completeBattle(summary);
  }, [completeBattle]);

  const handleEventChoice = useCallback((choiceIndex: number): string => {
    return executeEventChoice(choiceIndex);
  }, [executeEventChoice]);

  const handleCloseEvent = useCallback(() => {
    setEventId(null);
    closeEvent();
  }, [closeEvent]);

  // ─── No run: show start screen ─────────────────────────

  if (!run) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center">
          <span className="text-5xl block mb-4">{'\uD83C\uDFF0'}</span>
          <h2 className="text-2xl font-bold text-white mb-2">The Crypt</h2>
          <p className="text-sm text-gray-400 max-w-md">
            Descend into a 10-floor dungeon. Fight enemies, discover events,
            find treasures, and defeat the Crypt Lord.
          </p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Deck: {deckCardIds.length} cards &middot; {aiRules.length} AI rules
          </p>
          {deckCardIds.length < 12 && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-1.5 rounded">
              Deck has only {deckCardIds.length} cards (min 12). Add more in the Deck Builder.
            </p>
          )}
          <button
            onClick={startRun}
            disabled={deckCardIds.length < 12}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 text-lg"
          >
            Begin Expedition
          </button>
        </div>
      </div>
    );
  }

  // ─── Victory / Defeat ──────────────────────────────────

  if (run.phase === 'victory' || run.phase === 'defeat') {
    const summary = getRunSummary();
    if (summary) {
      return <RunSummaryScreen summary={summary} onReturn={returnToMap} />;
    }
  }

  // ─── Active run ────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <RunHUD run={run} onAbandon={abandonRun} />

      {/* Map view */}
      {run.phase === 'map' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">Choose your next destination</p>
          </div>
          <DungeonMapView
            map={run.map}
            currentNodeId={run.currentNodeId}
            onSelectNode={handleSelectNode}
          />
        </div>
      )}

      {/* Battle */}
      {run.phase === 'battle' && battleEnemies.length > 0 && (
        <DungeonBattle
          deckCardIds={run.deckCardIds}
          aiRules={run.aiRules}
          enemyDefs={battleEnemies}
          playerMaxHp={run.maxHp}
          playerCurrentHp={run.hp}
          onBattleComplete={handleBattleComplete}
        />
      )}

      {/* Reward */}
      {run.phase === 'reward' && run.pendingReward && (
        <DungeonRewardScreen
          reward={run.pendingReward}
          onPickCard={pickRewardCard}
          onSkip={skipReward}
        />
      )}

      {/* Event */}
      {run.phase === 'event' && (
        <DungeonEventScreen
          eventId={currentEventId ?? undefined}
          gold={run.gold}
          onChoice={handleEventChoice}
          onClose={handleCloseEvent}
        />
      )}

      {/* Shop */}
      {run.phase === 'shop' && (() => {
        const shop = getShopState();
        if (!shop) return null;
        return (
          <DungeonShopScreen
            shop={shop}
            gold={run.gold}
            onBuyCard={buyShopCard}
            onBuyHeal={buyHealFlask}
            onBuyRemoval={buyCardRemoval}
            onLeave={leaveShop}
          />
        );
      })()}

      {/* Rest */}
      {run.phase === 'rest' && (
        <DungeonRestScreen
          hp={run.hp}
          maxHp={run.maxHp}
          onHeal={restHeal}
          onUpgrade={restUpgrade}
        />
      )}

      {/* Chest */}
      {run.phase === 'chest' && (() => {
        const reward = getChestReward();
        return (
          <DungeonChestScreen
            reward={reward}
            onCollect={collectChest}
          />
        );
      })()}

      {/* Card remove */}
      {run.phase === 'card_remove' && (
        <CardRemoveScreen
          deckCardIds={run.deckCardIds}
          onRemove={removeCardFromDeck}
          onCancel={cancelCardAction}
        />
      )}

      {/* Card upgrade */}
      {run.phase === 'card_upgrade' && (
        <CardUpgradeScreen
          deckCardIds={run.deckCardIds}
          onUpgrade={upgradeCard}
          onCancel={cancelCardAction}
        />
      )}
    </div>
  );
}
