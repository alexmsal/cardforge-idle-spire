import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Card, AIRule } from '../models';
import {
  starterTemplates,
  getCardById,
  DECK_MAX,
  MAX_AI_RULES,
  stationsConfig,
  idleConfig,
  prestigeConfig,
  STARTING_HP,
} from '../data/gameData';
import type { StarterDeckTemplate } from '../data/gameData';
import type { InstalledGenerator, EconomyStats, OfflineProgress } from '../engine/IdleEngine';
import { DEFAULT_ECONOMY_STATS, calculateOfflineProgress } from '../engine/IdleEngine';

// ─── Storage keys ──────────────────────────────────────────

const STORAGE_DECK = 'cardforge_deck_ids';
const STORAGE_AI = 'cardforge_ai_rules';
const STORAGE_OWNED = 'cardforge_owned_ids';
const STORAGE_SHARDS = 'cardforge_shards';
const STORAGE_GOLD = 'cardforge_gold';
const STORAGE_STATIONS = 'cardforge_stations';
const STORAGE_ECONOMY = 'cardforge_economy';
const STORAGE_GENERATORS = 'cardforge_generators';
const STORAGE_LAST_ONLINE = 'cardforge_last_online';
const STORAGE_FOIL = 'cardforge_foil';
const STORAGE_ETERNAL = 'cardforge_eternal_cards';
const STORAGE_FOIL_UPGRADES = 'cardforge_foil_upgrades';
const STORAGE_PRESTIGE = 'cardforge_prestige_level';
const STORAGE_MAX_FLOOR = 'cardforge_max_floor';

function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* noop */ }
  return null;
}

// ─── Station levels ──────────────────────────────────────────

export interface StationLevels {
  anvil: number;
  library: number;
  portal: number;
}

const DEFAULT_STATIONS: StationLevels = { anvil: 1, library: 1, portal: 1 };

export function getStationUpgradeCost(stationId: keyof StationLevels, currentLevel: number): number {
  const cfg = stationsConfig[stationId];
  if (!cfg) return Infinity;
  if (currentLevel >= cfg.maxLevel) return Infinity;
  return Math.floor(cfg.baseCost * Math.pow(currentLevel, cfg.costExponent));
}

export function getLibraryCapacity(libraryLevel: number): number {
  return 15 + libraryLevel * 5;
}

// ─── Prestige / foil ───────────────────────────────────────

export interface FoilUpgrades {
  hp_boost: number;
  gold_boost: number;
  start_card: number;
  eternal_slot: number;
}

const DEFAULT_FOIL_UPGRADES: FoilUpgrades = { hp_boost: 0, gold_boost: 0, start_card: 0, eternal_slot: 0 };

export function calculateFoilGain(maxFloor: number, bossKills: number): number {
  return Math.floor(Math.pow(maxFloor, 1.5) * (1 + bossKills * 0.3));
}

export function getEffectiveStartingHp(foilUpgrades: FoilUpgrades): number {
  return STARTING_HP + foilUpgrades.hp_boost * 5;
}

export function getEffectiveHandSize(foilUpgrades: FoilUpgrades): number {
  return 5 + foilUpgrades.start_card;
}

export function getEternalSlots(foilUpgrades: FoilUpgrades): number {
  return prestigeConfig.eternalCardSlots + foilUpgrades.eternal_slot;
}

// ─── Context type ──────────────────────────────────────────

interface GameStateContextType {
  // Deck
  deckCards: Card[];
  deckCardIds: string[];
  addCard: (cardId: string) => void;
  removeCardAt: (index: number) => void;
  loadTemplate: (template: StarterDeckTemplate) => void;

  // AI Rules
  aiRules: AIRule[];
  addRule: (rule: AIRule) => void;
  updateRule: (index: number, rule: AIRule) => void;
  removeRule: (index: number) => void;
  moveRule: (fromIndex: number, toIndex: number) => void;
  setAiRules: (rules: AIRule[]) => void;

  // Owned cards (collection)
  ownedCardIds: string[];
  ownedCards: Card[];
  addOwnedCard: (cardId: string) => void;
  addOwnedCards: (cardIds: string[]) => void;
  removeOwnedCard: (cardId: string) => void;

  // Economy
  gold: number;
  shards: number;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  addShards: (amount: number) => void;
  spendShards: (amount: number) => boolean;

  // Stations
  stationLevels: StationLevels;
  upgradeStation: (stationId: keyof StationLevels) => boolean;
  libraryCapacity: number;

  // Economy tracking
  economyStats: EconomyStats;
  trackGoldEarned: (amount: number) => void;
  trackGoldSpent: (amount: number) => void;
  trackShardsEarned: (amount: number) => void;
  trackShardsSpent: (amount: number) => void;
  trackRunCompleted: (bossKill: boolean) => void;

  // Generators
  generators: InstalledGenerator[];
  installGenerator: (cardId: string) => void;
  removeGenerator: (cardId: string) => void;

  // Offline / Welcome Back
  pendingOfflineProgress: OfflineProgress | null;
  dismissOfflineProgress: () => void;

  // Prestige / Reforge
  foil: number;
  eternalCardIds: string[];
  foilUpgrades: FoilUpgrades;
  prestigeLevel: number;
  maxFloorReached: number;
  trackMaxFloor: (floor: number) => void;
  buyFoilUpgrade: (upgradeId: string) => boolean;
  executeReforge: (keepCardIds: string[]) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────

export function GameStateProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default template
  const [deckCardIds, setDeckCardIds] = useState<string[]>(() => {
    const saved = loadJson<string[]>(STORAGE_DECK);
    if (saved && saved.length > 0) return saved;
    const template = starterTemplates[0];
    const ids: string[] = [];
    for (const entry of template.cards) {
      for (let i = 0; i < entry.count; i++) ids.push(entry.id);
    }
    return ids;
  });

  const [aiRules, setAiRulesRaw] = useState<AIRule[]>(() => {
    const saved = loadJson<AIRule[]>(STORAGE_AI);
    if (saved && saved.length > 0) return saved;
    return starterTemplates[0].aiRules;
  });

  const [ownedCardIds, setOwnedCardIds] = useState<string[]>(() => {
    const saved = loadJson<string[]>(STORAGE_OWNED);
    if (saved && saved.length > 0) return saved;
    // Default: own the starter deck cards
    const template = starterTemplates[0];
    const ids: string[] = [];
    for (const entry of template.cards) {
      for (let i = 0; i < entry.count; i++) ids.push(entry.id);
    }
    return ids;
  });

  const [gold, setGold] = useState<number>(() => loadJson<number>(STORAGE_GOLD) ?? 0);
  const [shards, setShards] = useState<number>(() => loadJson<number>(STORAGE_SHARDS) ?? 0);
  const [stationLevels, setStationLevels] = useState<StationLevels>(
    () => loadJson<StationLevels>(STORAGE_STATIONS) ?? DEFAULT_STATIONS,
  );

  const [economyStats, setEconomyStats] = useState<EconomyStats>(
    () => loadJson<EconomyStats>(STORAGE_ECONOMY) ?? DEFAULT_ECONOMY_STATS,
  );

  const [generators, setGenerators] = useState<InstalledGenerator[]>(
    () => loadJson<InstalledGenerator[]>(STORAGE_GENERATORS) ?? [],
  );

  const [foil, setFoil] = useState<number>(() => loadJson<number>(STORAGE_FOIL) ?? 0);
  const [eternalCardIds, setEternalCardIds] = useState<string[]>(
    () => loadJson<string[]>(STORAGE_ETERNAL) ?? [],
  );
  const [foilUpgrades, setFoilUpgrades] = useState<FoilUpgrades>(
    () => loadJson<FoilUpgrades>(STORAGE_FOIL_UPGRADES) ?? DEFAULT_FOIL_UPGRADES,
  );
  const [prestigeLevel, setPrestigeLevel] = useState<number>(
    () => loadJson<number>(STORAGE_PRESTIGE) ?? 0,
  );
  const [maxFloorReached, setMaxFloorReached] = useState<number>(
    () => loadJson<number>(STORAGE_MAX_FLOOR) ?? 0,
  );

  // Calculate offline progress on first load
  const [pendingOfflineProgress, setPendingOfflineProgress] = useState<OfflineProgress | null>(() => {
    const lastOnline = loadJson<number>(STORAGE_LAST_ONLINE);
    if (!lastOnline) return null;
    const savedGenerators = loadJson<InstalledGenerator[]>(STORAGE_GENERATORS) ?? [];
    if (savedGenerators.length === 0) return null;
    const now = Date.now();
    const maxOfflineMs = idleConfig.maxOfflineHours * 60 * 60 * 1000;
    const progress = calculateOfflineProgress(
      savedGenerators,
      lastOnline,
      now,
      idleConfig.generatorDegradationPerDay,
      maxOfflineMs,
      idleConfig.offlineRewardMultiplier,
    );
    if (progress.goldGenerated === 0 && progress.shardsGenerated === 0 && progress.generatorsExpired.length === 0) {
      return null;
    }
    return progress;
  });

  // Persist on change
  useEffect(() => { saveJson(STORAGE_DECK, deckCardIds); }, [deckCardIds]);
  useEffect(() => { saveJson(STORAGE_AI, aiRules); }, [aiRules]);
  useEffect(() => { saveJson(STORAGE_OWNED, ownedCardIds); }, [ownedCardIds]);
  useEffect(() => { saveJson(STORAGE_GOLD, gold); }, [gold]);
  useEffect(() => { saveJson(STORAGE_SHARDS, shards); }, [shards]);
  useEffect(() => { saveJson(STORAGE_STATIONS, stationLevels); }, [stationLevels]);
  useEffect(() => { saveJson(STORAGE_ECONOMY, economyStats); }, [economyStats]);
  useEffect(() => { saveJson(STORAGE_GENERATORS, generators); }, [generators]);
  useEffect(() => { saveJson(STORAGE_FOIL, foil); }, [foil]);
  useEffect(() => { saveJson(STORAGE_ETERNAL, eternalCardIds); }, [eternalCardIds]);
  useEffect(() => { saveJson(STORAGE_FOIL_UPGRADES, foilUpgrades); }, [foilUpgrades]);
  useEffect(() => { saveJson(STORAGE_PRESTIGE, prestigeLevel); }, [prestigeLevel]);
  useEffect(() => { saveJson(STORAGE_MAX_FLOOR, maxFloorReached); }, [maxFloorReached]);

  // Keep last-online timestamp fresh
  useEffect(() => {
    saveJson(STORAGE_LAST_ONLINE, Date.now());
    const interval = setInterval(() => saveJson(STORAGE_LAST_ONLINE, Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Resolve IDs to Card objects
  const deckCards: Card[] = deckCardIds.map((id) => getCardById(id)).filter((c): c is Card => c !== undefined);
  const ownedCards: Card[] = ownedCardIds.map((id) => getCardById(id)).filter((c): c is Card => c !== undefined);
  const libraryCapacity = getLibraryCapacity(stationLevels.library);

  // ─── Deck operations ───────────────────────────────────────

  const addCard = useCallback((cardId: string) => {
    setDeckCardIds((prev) => {
      if (prev.length >= DECK_MAX) return prev;
      return [...prev, cardId];
    });
  }, []);

  const removeCardAt = useCallback((index: number) => {
    setDeckCardIds((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const loadTemplate = useCallback((template: StarterDeckTemplate) => {
    const ids: string[] = [];
    for (const entry of template.cards) {
      for (let i = 0; i < entry.count; i++) ids.push(entry.id);
    }
    setDeckCardIds(ids);
    setAiRulesRaw(template.aiRules);
    // Also ensure all template cards are owned
    setOwnedCardIds((prev) => {
      const newOwned = [...prev];
      for (const id of ids) {
        newOwned.push(id);
      }
      return newOwned;
    });
  }, []);

  // ─── AI Rules ──────────────────────────────────────────────

  const addRule = useCallback((rule: AIRule) => {
    setAiRulesRaw((prev) => {
      if (prev.length >= MAX_AI_RULES) return prev;
      return [...prev, { ...rule, priority: prev.length + 1 }];
    });
  }, []);

  const updateRule = useCallback((index: number, rule: AIRule) => {
    setAiRulesRaw((prev) => {
      const next = [...prev];
      next[index] = rule;
      return next;
    });
  }, []);

  const removeRule = useCallback((index: number) => {
    setAiRulesRaw((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next.map((r, i) => ({ ...r, priority: i + 1 }));
    });
  }, []);

  const moveRule = useCallback((fromIndex: number, toIndex: number) => {
    setAiRulesRaw((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((r, i) => ({ ...r, priority: i + 1 }));
    });
  }, []);

  const setAiRules = useCallback((rules: AIRule[]) => {
    setAiRulesRaw(rules.map((r, i) => ({ ...r, priority: i + 1 })));
  }, []);

  // ─── Owned cards ───────────────────────────────────────────

  const addOwnedCard = useCallback((cardId: string) => {
    setOwnedCardIds((prev) => [...prev, cardId]);
  }, []);

  const addOwnedCards = useCallback((cardIds: string[]) => {
    setOwnedCardIds((prev) => [...prev, ...cardIds]);
  }, []);

  const removeOwnedCard = useCallback((cardId: string) => {
    setOwnedCardIds((prev) => {
      const idx = prev.indexOf(cardId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  // ─── Economy ───────────────────────────────────────────────

  const addGold = useCallback((amount: number) => {
    setGold((prev) => prev + amount);
  }, []);

  const spendGold = useCallback((amount: number): boolean => {
    let success = false;
    setGold((prev) => {
      if (prev >= amount) { success = true; return prev - amount; }
      return prev;
    });
    return success;
  }, []);

  const addShards = useCallback((amount: number) => {
    setShards((prev) => prev + amount);
  }, []);

  const spendShards = useCallback((amount: number): boolean => {
    let success = false;
    setShards((prev) => {
      if (prev >= amount) { success = true; return prev - amount; }
      return prev;
    });
    return success;
  }, []);

  // ─── Stations ──────────────────────────────────────────────

  const upgradeStation = useCallback((stationId: keyof StationLevels): boolean => {
    const currentLevel = stationLevels[stationId];
    const cost = getStationUpgradeCost(stationId, currentLevel);
    if (gold < cost) return false;

    const cfg = stationsConfig[stationId];
    if (!cfg || currentLevel >= cfg.maxLevel) return false;

    setGold((prev) => prev - cost);
    setStationLevels((prev) => ({
      ...prev,
      [stationId]: prev[stationId] + 1,
    }));
    return true;
  }, [gold, stationLevels]);

  // ─── Economy tracking ─────────────────────────────────────

  const trackGoldEarned = useCallback((amount: number) => {
    setEconomyStats((prev) => ({ ...prev, totalGoldEarned: prev.totalGoldEarned + amount }));
  }, []);

  const trackGoldSpent = useCallback((amount: number) => {
    setEconomyStats((prev) => ({ ...prev, totalGoldSpent: prev.totalGoldSpent + amount }));
  }, []);

  const trackShardsEarned = useCallback((amount: number) => {
    setEconomyStats((prev) => ({ ...prev, totalShardsEarned: prev.totalShardsEarned + amount }));
  }, []);

  const trackShardsSpent = useCallback((amount: number) => {
    setEconomyStats((prev) => ({ ...prev, totalShardsSpent: prev.totalShardsSpent + amount }));
  }, []);

  const trackRunCompleted = useCallback((bossKill: boolean) => {
    setEconomyStats((prev) => ({
      ...prev,
      totalRunsCompleted: prev.totalRunsCompleted + 1,
      totalBossKills: prev.totalBossKills + (bossKill ? 1 : 0),
    }));
  }, []);

  // ─── Generators ─────────────────────────────────────────

  const installGenerator = useCallback((cardId: string) => {
    setGenerators((prev) => [...prev, { cardId, installedAt: Date.now() }]);
  }, []);

  const removeGenerator = useCallback((cardId: string) => {
    setGenerators((prev) => {
      const idx = prev.findIndex((g) => g.cardId === cardId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  // ─── Prestige / Reforge ──────────────────────────────────

  const trackMaxFloor = useCallback((floor: number) => {
    setMaxFloorReached((prev) => Math.max(prev, floor));
  }, []);

  const buyFoilUpgrade = useCallback((upgradeId: string): boolean => {
    const def = prestigeConfig.foilUpgrades.find((u) => u.id === upgradeId);
    if (!def) return false;

    const currentStacks = foilUpgrades[upgradeId as keyof FoilUpgrades] ?? 0;
    if (currentStacks >= def.maxStacks) return false;
    if (foil < def.cost) return false;

    setFoil((prev) => prev - def.cost);
    setFoilUpgrades((prev) => ({
      ...prev,
      [upgradeId]: (prev[upgradeId as keyof FoilUpgrades] ?? 0) + 1,
    }));
    return true;
  }, [foil, foilUpgrades]);

  const executeReforge = useCallback((keepCardIds: string[]) => {
    // Calculate foil gain
    const foilGain = calculateFoilGain(maxFloorReached, economyStats.totalBossKills);

    // Add foil
    setFoil((prev) => prev + foilGain);

    // Increment prestige level
    setPrestigeLevel((prev) => prev + 1);

    // Reset cycle state
    const template = starterTemplates[0];
    const starterIds: string[] = [];
    for (const entry of template.cards) {
      for (let i = 0; i < entry.count; i++) starterIds.push(entry.id);
    }

    // Eternal cards carry over into the starter deck + owned
    const eternalOwned = [...keepCardIds];
    setEternalCardIds(keepCardIds);

    setDeckCardIds([...starterIds, ...eternalOwned]);
    setOwnedCardIds([...starterIds, ...eternalOwned]);
    setAiRulesRaw(template.aiRules);
    setGold(0);
    setShards(0);
    setStationLevels(DEFAULT_STATIONS);
    setGenerators([]);
    setEconomyStats(DEFAULT_ECONOMY_STATS);
    setMaxFloorReached(0);
  }, [maxFloorReached, economyStats.totalBossKills]);

  // ─── Dismiss offline progress ───────────────────────────

  const dismissOfflineProgress = useCallback(() => {
    if (!pendingOfflineProgress) return;
    // Apply the offline rewards
    if (pendingOfflineProgress.goldGenerated > 0) {
      setGold((prev) => prev + pendingOfflineProgress.goldGenerated);
      setEconomyStats((prev) => ({
        ...prev,
        totalGoldEarned: prev.totalGoldEarned + pendingOfflineProgress.goldGenerated,
      }));
    }
    if (pendingOfflineProgress.shardsGenerated > 0) {
      setShards((prev) => prev + pendingOfflineProgress.shardsGenerated);
      setEconomyStats((prev) => ({
        ...prev,
        totalShardsEarned: prev.totalShardsEarned + pendingOfflineProgress.shardsGenerated,
      }));
    }
    // Remove expired generators
    if (pendingOfflineProgress.generatorsExpired.length > 0) {
      setGenerators((prev) => prev.filter((g) => !pendingOfflineProgress.generatorsExpired.includes(g.cardId)));
    }
    setPendingOfflineProgress(null);
  }, [pendingOfflineProgress]);

  return (
    <GameStateContext.Provider
      value={{
        deckCards,
        deckCardIds,
        addCard,
        removeCardAt,
        loadTemplate,
        aiRules,
        addRule,
        updateRule,
        removeRule,
        moveRule,
        setAiRules,
        ownedCardIds,
        ownedCards,
        addOwnedCard,
        addOwnedCards,
        removeOwnedCard,
        gold,
        shards,
        addGold,
        spendGold,
        addShards,
        spendShards,
        stationLevels,
        upgradeStation,
        libraryCapacity,
        economyStats,
        trackGoldEarned,
        trackGoldSpent,
        trackShardsEarned,
        trackShardsSpent,
        trackRunCompleted,
        generators,
        installGenerator,
        removeGenerator,
        pendingOfflineProgress,
        dismissOfflineProgress,
        foil,
        eternalCardIds,
        foilUpgrades,
        prestigeLevel,
        maxFloorReached,
        trackMaxFloor,
        buyFoilUpgrade,
        executeReforge,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameStateContextType {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
