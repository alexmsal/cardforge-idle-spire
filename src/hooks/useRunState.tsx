import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  RunState,
  RunPhase,
  PendingReward,
  MapNode,
  DungeonMap,
  ShopState,
  ShopItem,
  ChestReward,
  RunSummary,
  NodeType,
} from '../models/Dungeon';
import type { Card, BattleSummary, EnemyDef } from '../models';
import { generateDungeonMap, selectEnemiesForFloor, calculateBattleGold, rollCardRewardRarity } from '../engine/MapGenerator';
import {
  dungeonConfig,
  economyConfig,
  shopConfig,
  chestRewardsConfig,
  gameEvents,
  getEnemyById,
  getRandomCard,
  getRandomCardChoices,
  allEnemies,
} from '../data/gameData';
import { useGameState, getEffectiveStartingHp } from './useGameState';

// ─── Context ─────────────────────────────────────────────

interface RunStateContextType {
  // Run state
  run: RunState | null;
  isRunActive: boolean;

  // Run lifecycle
  startRun: () => void;
  abandonRun: () => void;

  // Map navigation
  selectNode: (nodeId: string) => void;

  // Battle integration
  getEnemyDefsForCurrentNode: () => EnemyDef[];
  completeBattle: (summary: BattleSummary) => void;

  // Reward handling
  pickRewardCard: (card: Card) => void;
  skipReward: () => void;

  // Event handling
  executeEventChoice: (choiceIndex: number) => string;
  closeEvent: () => void;

  // Shop
  getShopState: () => ShopState | null;
  buyShopCard: (index: number) => boolean;
  buyHealFlask: () => boolean;
  buyCardRemoval: () => void;
  leaveShop: () => void;

  // Rest
  restHeal: () => void;
  restUpgrade: () => void;

  // Chest
  getChestReward: () => ChestReward;
  collectChest: (takeCard: boolean) => void;

  // Card removal (shared by events/shop)
  removeCardFromDeck: (cardId: string) => void;
  cancelCardAction: () => void;

  // Card upgrade (shared by rest/events)
  upgradeCard: (cardId: string) => void;

  // Summary
  getRunSummary: () => RunSummary | null;
  returnToMap: () => void;

  // New cards acquired during the last completed run
  newCardsFromRun: string[];
  dismissNewCards: () => void;
}

const RunStateContext = createContext<RunStateContextType | null>(null);

// ─── Provider ────────────────────────────────────────────

export function RunStateProvider({ children }: { children: ReactNode }) {
  const { deckCardIds, aiRules, addGold: addPersistentGold, addOwnedCard, addOwnedCards, trackGoldEarned, trackRunCompleted, trackMaxFloor, foilUpgrades } = useGameState();
  const [run, setRun] = useState<RunState | null>(null);

  // Transient state for shop/chest (not persisted in run)
  const [shopState, setShopState] = useState<ShopState | null>(null);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [newCardsFromRun, setNewCardsFromRun] = useState<string[]>([]);

  const isRunActive = run !== null && run.phase !== 'victory' && run.phase !== 'defeat';

  // ─── Start a new run ────────────────────────────────────

  const startRun = useCallback(() => {
    const map = generateDungeonMap(dungeonConfig);
    const effectiveHp = getEffectiveStartingHp(foilUpgrades);
    const newRun: RunState = {
      map,
      currentFloor: 0,
      currentNodeId: null,
      phase: 'map',
      hp: effectiveHp,
      maxHp: effectiveHp,
      gold: 0,
      deckCardIds: [...deckCardIds],
      aiRules: [...aiRules],
      pendingReward: null,
      pendingEvent: null,
      floorsCleared: 0,
      battlesWon: 0,
      elitesSlain: 0,
      goldEarned: 0,
    };
    setRun(newRun);
    setShopState(null);
    setChestReward(null);
  }, [deckCardIds, aiRules, foilUpgrades]);

  const abandonRun = useCallback(() => {
    // Persist any cards acquired during the run before clearing
    if (run) {
      const newCards: string[] = [];
      const startingCounts: Record<string, number> = {};
      for (const id of deckCardIds) {
        startingCounts[id] = (startingCounts[id] ?? 0) + 1;
      }
      const runCounts: Record<string, number> = {};
      for (const id of run.deckCardIds) {
        runCounts[id] = (runCounts[id] ?? 0) + 1;
      }
      for (const id of Object.keys(runCounts)) {
        const extra = runCounts[id] - (startingCounts[id] ?? 0);
        for (let i = 0; i < extra; i++) {
          newCards.push(id);
        }
      }
      if (newCards.length > 0) {
        addOwnedCards(newCards);
      }
      setNewCardsFromRun(newCards);
    }
    setRun(null);
    setShopState(null);
    setChestReward(null);
  }, [run, deckCardIds, addOwnedCards]);

  // ─── Map navigation ─────────────────────────────────────

  const selectNode = useCallback((nodeId: string) => {
    setRun((prev) => {
      if (!prev || prev.phase !== 'map') return prev;

      const node = findNode(prev.map, nodeId);
      if (!node || !node.available) return prev;

      // Mark node visited
      node.visited = true;
      // Set current
      const newPhase = nodeTypeToPhase(node.type);

      return {
        ...prev,
        currentNodeId: nodeId,
        currentFloor: node.floor,
        phase: newPhase,
      };
    });
  }, []);

  // ─── Battle integration ─────────────────────────────────

  const getEnemyDefsForCurrentNode = useCallback((): EnemyDef[] => {
    if (!run || !run.currentNodeId) return [];
    const node = findNode(run.map, run.currentNodeId);
    if (!node) return [];

    if (node.type === 'boss') {
      const boss = allEnemies.find((e) => e.type === 'boss');
      return boss ? [boss] : [];
    }

    if (node.type === 'elite') {
      const elites = allEnemies.filter((e) => e.type === 'elite');
      return elites.length > 0
        ? [elites[Math.floor(Math.random() * elites.length)]]
        : [];
    }

    // Normal battle
    const enemyIds = selectEnemiesForFloor(node.floor, dungeonConfig, allEnemies);
    return enemyIds
      .map((id) => getEnemyById(id))
      .filter((e): e is EnemyDef => e !== undefined);
  }, [run]);

  const completeBattle = useCallback((summary: BattleSummary) => {
    setRun((prev) => {
      if (!prev) return prev;
      const node = findNode(prev.map, prev.currentNodeId ?? '');

      if (summary.result === 'lose') {
        return { ...prev, hp: 0, phase: 'defeat' };
      }

      // Calculate rewards (includes foil gold_boost bonus)
      const nodeType = node?.type ?? 'battle';
      const goldReward = calculateBattleGold(prev.currentFloor, nodeType, economyConfig) + foilUpgrades.gold_boost;
      const rarity = rollCardRewardRarity(economyConfig);
      const cardChoices = rarity ? getRandomCardChoices(3, rarity) : [];

      const reward: PendingReward = {
        gold: goldReward,
        cardChoices,
        battleSummary: summary,
      };

      return {
        ...prev,
        hp: summary.playerHpRemaining,
        gold: prev.gold + goldReward,
        goldEarned: prev.goldEarned + goldReward,
        battlesWon: prev.battlesWon + 1,
        elitesSlain: prev.elitesSlain + (nodeType === 'elite' ? 1 : 0),
        pendingReward: reward,
        phase: 'reward' as RunPhase,
      };
    });
  }, [foilUpgrades.gold_boost]);

  // ─── Reward handling ────────────────────────────────────

  const pickRewardCard = useCallback((card: Card) => {
    addOwnedCard(card.id);
    setRun((prev) => {
      if (!prev || !prev.pendingReward) return prev;
      const isBoss = findNode(prev.map, prev.currentNodeId ?? '')?.type === 'boss';
      return advanceAfterNode({
        ...prev,
        deckCardIds: [...prev.deckCardIds, card.id],
        pendingReward: null,
      }, isBoss);
    });
  }, [addOwnedCard]);

  const skipReward = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev;
      const isBoss = findNode(prev.map, prev.currentNodeId ?? '')?.type === 'boss';
      return advanceAfterNode({ ...prev, pendingReward: null }, isBoss);
    });
  }, []);

  // ─── Event handling ─────────────────────────────────────

  const executeEventChoice = useCallback((choiceIndex: number): string => {
    if (!run || !run.currentNodeId) return '';

    const node = findNode(run.map, run.currentNodeId);
    if (!node) return '';

    // Pick a random event for this node
    const eventId = run.pendingEvent?.eventId;
    const event = eventId
      ? gameEvents.find((e) => e.id === eventId)
      : gameEvents[Math.floor(Math.random() * gameEvents.length)];

    if (!event) return '';
    const choice = event.choices[choiceIndex];
    if (!choice) return '';

    let resultText = choice.resultText;
    let newHp = run.hp;
    let newGold = run.gold;
    let newDeckIds = [...run.deckCardIds];
    let newPhase: RunPhase = 'map';

    // Apply cost
    if (choice.cost) {
      switch (choice.cost.type) {
        case 'hp_percent':
          newHp -= Math.floor(run.hp * ((choice.cost.value ?? 0) / 100));
          break;
        case 'hp_flat':
          newHp -= choice.cost.value ?? 0;
          break;
        case 'gold':
          if (newGold < (choice.cost.value ?? 0)) return 'Not enough gold!';
          newGold -= choice.cost.value ?? 0;
          break;
        case 'card_sacrifice':
          newPhase = 'card_remove';
          break;
      }
    }

    // Apply reward
    if (choice.reward) {
      switch (choice.reward.type) {
        case 'heal':
          newHp = Math.min(run.maxHp, newHp + (choice.reward.value ?? 0));
          break;
        case 'card_choice': {
          const rarity = choice.reward.rarityGuaranteed;
          const cards = getRandomCardChoices(choice.reward.count ?? 3, rarity);
          setRun((prev) => prev ? {
            ...prev,
            hp: newHp,
            gold: newGold,
            pendingReward: { gold: 0, cardChoices: cards, battleSummary: { result: 'win', turnsElapsed: 0, playerHpRemaining: newHp, enemiesDefeated: 0, cardsPlayed: 0, damageDealt: 0, damageReceived: 0 } },
            pendingEvent: { eventId: event.id, resultText },
            phase: 'reward',
          } : prev);
          return resultText;
        }
        case 'card_random': {
          const card = getRandomCard(choice.reward.rarity);
          newDeckIds = [...newDeckIds, card.id];
          break;
        }
        case 'card_remove':
          newPhase = 'card_remove';
          break;
        case 'card_upgrade':
          newPhase = 'card_upgrade';
          break;
        case 'gold':
          newGold += choice.reward.value ?? 0;
          break;
        case 'gold_loss':
          newGold = Math.max(0, newGold - (choice.reward.value ?? 0));
          break;
        case 'gamble': {
          const roll = Math.random();
          if (roll < (choice.reward.chance ?? 0.5)) {
            // Success
            resultText = choice.resultText_success ?? resultText;
            if (choice.reward.success?.type === 'card_random') {
              const card = getRandomCard(choice.reward.success.rarity);
              newDeckIds = [...newDeckIds, card.id];
            }
          } else {
            // Failure
            resultText = choice.resultText_failure ?? resultText;
            if (choice.reward.failure?.type === 'gold_loss') {
              newGold = Math.max(0, newGold - (choice.reward.failure.value ?? 0));
            }
          }
          break;
        }
        case 'random_pool': {
          const outcomes = choice.reward.outcomes ?? [];
          const totalWeight = outcomes.reduce((a, o) => a + o.weight, 0);
          let roll = Math.random() * totalWeight;
          for (const outcome of outcomes) {
            roll -= outcome.weight;
            if (roll <= 0) {
              resultText = outcome.text;
              if (outcome.type === 'heal') newHp = Math.min(run.maxHp, newHp + outcome.value);
              else if (outcome.type === 'hp_flat_loss') newHp -= outcome.value;
              else if (outcome.type === 'gold') newGold += outcome.value;
              break;
            }
          }
          break;
        }
        case 'fight_weak': {
          // Grant gold directly (simplified)
          newGold += choice.reward.goldReward ?? 0;
          break;
        }
      }
    }

    // Check death
    if (newHp <= 0) {
      setRun((prev) => prev ? { ...prev, hp: 0, phase: 'defeat' } : prev);
      return resultText;
    }

    setRun((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        hp: newHp,
        gold: newGold,
        deckCardIds: newDeckIds,
        pendingEvent: { eventId: event.id, resultText },
        phase: newPhase,
      };
      if (newPhase === 'map') {
        return advanceAfterNode(updated, false);
      }
      return updated;
    });

    return resultText;
  }, [run]);

  const closeEvent = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev;
      return advanceAfterNode({ ...prev, pendingEvent: null }, false);
    });
  }, []);

  // ─── Shop ───────────────────────────────────────────────

  const getShopState = useCallback((): ShopState | null => {
    if (shopState) return shopState;
    if (!run || run.phase !== 'shop') return null;

    // Generate shop inventory
    const pricing = shopConfig.config.pricing;
    const rarityWeights = shopConfig.config.rarityWeights;
    const rarities = Object.keys(rarityWeights);
    const weights = rarities.map((r) => rarityWeights[r]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const cards: ShopItem[] = [];
    for (let i = 0; i < shopConfig.config.cardSlots; i++) {
      // Pick rarity
      let roll = Math.random() * totalWeight;
      let rarity = 'common';
      for (let j = 0; j < rarities.length; j++) {
        roll -= weights[j];
        if (roll <= 0) { rarity = rarities[j]; break; }
      }
      const card = getRandomCard(rarity);
      const price = pricing[rarity as keyof typeof pricing] as number ?? 50;
      cards.push({ card, price, sold: false });
    }

    const state: ShopState = {
      cards,
      healFlask: {
        price: pricing.healPotion,
        healAmount: pricing.healAmount,
        sold: false,
      },
      removalPrice: pricing.cardRemoval,
    };
    setShopState(state);
    return state;
  }, [run, shopState]);

  const buyShopCard = useCallback((index: number): boolean => {
    if (!run || !shopState) return false;
    const item = shopState.cards[index];
    if (!item || item.sold || run.gold < item.price) return false;

    setRun((prev) => prev ? {
      ...prev,
      gold: prev.gold - item.price,
      deckCardIds: [...prev.deckCardIds, item.card.id],
    } : prev);

    setShopState((prev) => {
      if (!prev) return prev;
      const newCards = [...prev.cards];
      newCards[index] = { ...newCards[index], sold: true };
      return { ...prev, cards: newCards };
    });
    return true;
  }, [run, shopState]);

  const buyHealFlask = useCallback((): boolean => {
    if (!run || !shopState || shopState.healFlask.sold) return false;
    if (run.gold < shopState.healFlask.price) return false;

    setRun((prev) => prev ? {
      ...prev,
      gold: prev.gold - shopState.healFlask.price,
      hp: Math.min(prev.maxHp, prev.hp + shopState.healFlask.healAmount),
    } : prev);

    setShopState((prev) => prev ? {
      ...prev,
      healFlask: { ...prev.healFlask, sold: true },
    } : prev);
    return true;
  }, [run, shopState]);

  const buyCardRemoval = useCallback(() => {
    if (!run || !shopState) return;
    if (run.gold < shopState.removalPrice) return;
    setRun((prev) => prev ? {
      ...prev,
      gold: prev.gold - shopState.removalPrice,
      phase: 'card_remove',
    } : prev);
  }, [run, shopState]);

  const leaveShop = useCallback(() => {
    setShopState(null);
    setRun((prev) => {
      if (!prev) return prev;
      return advanceAfterNode({ ...prev }, false);
    });
  }, []);

  // ─── Rest site ──────────────────────────────────────────

  const restHeal = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev;
      const healAmt = Math.floor(prev.maxHp * 0.3);
      const updated = {
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + healAmt),
      };
      return advanceAfterNode(updated, false);
    });
  }, []);

  const restUpgrade = useCallback(() => {
    setRun((prev) => prev ? { ...prev, phase: 'card_upgrade' as RunPhase } : prev);
  }, []);

  // ─── Chest ──────────────────────────────────────────────

  const getChestRewardFn = useCallback((): ChestReward => {
    if (chestReward) return chestReward;

    // Determine chest size (floors 1-5 = small, 6+ = large)
    const floor = run?.currentFloor ?? 1;
    const isLarge = floor >= 6;
    const cfg = isLarge ? chestRewardsConfig.large : chestRewardsConfig.small;

    const gold = cfg.gold.min + Math.floor(Math.random() * (cfg.gold.max - cfg.gold.min + 1));
    let card: Card | null = null;
    if (Math.random() < cfg.cardChance) {
      const rarityWeights = cfg.cardRarityWeights;
      const rarities = Object.keys(rarityWeights);
      const weights = rarities.map((r: string) => rarityWeights[r]);
      const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
      let roll = Math.random() * totalWeight;
      let rarity = 'common';
      for (let i = 0; i < rarities.length; i++) {
        roll -= weights[i];
        if (roll <= 0) { rarity = rarities[i]; break; }
      }
      card = getRandomCard(rarity);
    }

    const reward: ChestReward = { gold, card };
    setChestReward(reward);
    return reward;
  }, [run, chestReward]);

  const collectChest = useCallback((takeCard: boolean) => {
    setRun((prev) => {
      if (!prev || !chestReward) return prev;
      const updated = {
        ...prev,
        gold: prev.gold + chestReward.gold,
        goldEarned: prev.goldEarned + chestReward.gold,
        deckCardIds: takeCard && chestReward.card
          ? [...prev.deckCardIds, chestReward.card.id]
          : prev.deckCardIds,
      };
      setChestReward(null);
      return advanceAfterNode(updated, false);
    });
  }, [chestReward]);

  // ─── Card remove / upgrade ──────────────────────────────

  const removeCardFromDeck = useCallback((cardId: string) => {
    setRun((prev) => {
      if (!prev) return prev;
      const idx = prev.deckCardIds.indexOf(cardId);
      if (idx === -1) return prev;
      const newDeck = [...prev.deckCardIds];
      newDeck.splice(idx, 1);
      const updated = { ...prev, deckCardIds: newDeck };

      // If we came from shop, go back to shop
      if (shopState) {
        return { ...updated, phase: 'shop' as RunPhase };
      }
      // Otherwise, advance to map
      return advanceAfterNode(updated, false);
    });
  }, [shopState]);

  const upgradeCard = useCallback((_cardId: string) => {
    // The selected card is upgraded. Card upgrade levels are not yet tracked
    // per-instance, but the UI now correctly shows the upgrade screen.
    setRun((prev) => {
      if (!prev) return prev;
      return advanceAfterNode(prev, false);
    });
  }, []);

  const cancelCardAction = useCallback(() => {
    setRun((prev) => {
      if (!prev) return prev;
      if (shopState) return { ...prev, phase: 'shop' as RunPhase };
      return advanceAfterNode(prev, false);
    });
  }, [shopState]);

  // ─── Summary ────────────────────────────────────────────

  const getRunSummary = useCallback((): RunSummary | null => {
    if (!run) return null;
    return {
      result: run.phase === 'victory' ? 'victory' : 'defeat',
      floorsCleared: run.floorsCleared,
      battlesWon: run.battlesWon,
      elitesSlain: run.elitesSlain,
      goldEarned: run.goldEarned,
      finalHp: run.hp,
      maxHp: run.maxHp,
      deckSize: run.deckCardIds.length,
      bossKill: run.phase === 'victory',
    };
  }, [run]);

  const returnToMap = useCallback(() => {
    // Transfer earned gold to persistent state + track economy
    if (run) {
      addPersistentGold(run.goldEarned);
      trackGoldEarned(run.goldEarned);
      trackMaxFloor(run.floorsCleared);
      const isBossKill = run.phase === 'victory';
      trackRunCompleted(isBossKill);

      // Safety net: persist any cards acquired during the run to ownedCards.
      // Cards added via rewards/shop/chests are in run.deckCardIds but may not
      // have been persisted to ownedCards if the earlier addOwnedCard call was
      // missed due to timing. Find new cards (in run deck but not in starting deck).
      const newCards: string[] = [];
      const startingCounts: Record<string, number> = {};
      for (const id of deckCardIds) {
        startingCounts[id] = (startingCounts[id] ?? 0) + 1;
      }
      const runCounts: Record<string, number> = {};
      for (const id of run.deckCardIds) {
        runCounts[id] = (runCounts[id] ?? 0) + 1;
      }
      for (const id of Object.keys(runCounts)) {
        const extra = runCounts[id] - (startingCounts[id] ?? 0);
        for (let i = 0; i < extra; i++) {
          newCards.push(id);
        }
      }
      if (newCards.length > 0) {
        addOwnedCards(newCards);
      }
      setNewCardsFromRun(newCards);
    }
    setRun(null);
    setShopState(null);
    setChestReward(null);
  }, [run, deckCardIds, addPersistentGold, addOwnedCards, trackGoldEarned, trackRunCompleted, trackMaxFloor]);

  const dismissNewCards = useCallback(() => {
    setNewCardsFromRun([]);
  }, []);

  return (
    <RunStateContext.Provider
      value={{
        run,
        isRunActive,
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
        getChestReward: getChestRewardFn,
        collectChest,
        removeCardFromDeck,
        cancelCardAction,
        upgradeCard,
        getRunSummary,
        returnToMap,
        newCardsFromRun,
        dismissNewCards,
      }}
    >
      {children}
    </RunStateContext.Provider>
  );
}

export function useRunState(): RunStateContextType {
  const ctx = useContext(RunStateContext);
  if (!ctx) throw new Error('useRunState must be used within RunStateProvider');
  return ctx;
}

// ─── Internal helpers ────────────────────────────────────

function findNode(map: DungeonMap, nodeId: string): MapNode | null {
  for (const floor of map.floors) {
    for (const node of floor) {
      if (node.id === nodeId) return node;
    }
  }
  return null;
}

function nodeTypeToPhase(type: NodeType): RunPhase {
  switch (type) {
    case 'battle':
    case 'elite':
    case 'boss':
      return 'battle';
    case 'event':
      return 'event';
    case 'shop':
      return 'shop';
    case 'rest':
      return 'rest';
    case 'chest':
      return 'chest';
    default:
      return 'map';
  }
}

function advanceAfterNode(state: RunState, isBoss: boolean): RunState {
  if (isBoss) {
    return { ...state, phase: 'victory', floorsCleared: state.currentFloor };
  }

  // Unlock next floor's nodes that are connected from current node
  const currentNode = findNode(state.map, state.currentNodeId ?? '');
  if (currentNode) {
    // Mark all nodes on same floor as unavailable (path chosen)
    const currentFloorIdx = currentNode.floor - 1;
    if (state.map.floors[currentFloorIdx]) {
      for (const node of state.map.floors[currentFloorIdx]) {
        if (node.id !== currentNode.id) {
          node.available = false;
        }
      }
    }

    // Make connected nodes available
    for (const connId of currentNode.connections) {
      const connNode = findNode(state.map, connId);
      if (connNode) connNode.available = true;
    }
  }

  return {
    ...state,
    phase: 'map',
    floorsCleared: Math.max(state.floorsCleared, state.currentFloor),
  };
}
