import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Card, AIRule } from '../models';
import {
  starterTemplates,
  getCardById,
  DECK_MAX,
  MAX_AI_RULES,
  craftingConfig,
  stationsConfig,
} from '../data/gameData';
import type { StarterDeckTemplate } from '../data/gameData';

// ─── Storage keys ──────────────────────────────────────────

const STORAGE_DECK = 'cardforge_deck_ids';
const STORAGE_AI = 'cardforge_ai_rules';
const STORAGE_OWNED = 'cardforge_owned_ids';
const STORAGE_SHARDS = 'cardforge_shards';
const STORAGE_GOLD = 'cardforge_gold';
const STORAGE_STATIONS = 'cardforge_stations';

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

  // Persist on change
  useEffect(() => { saveJson(STORAGE_DECK, deckCardIds); }, [deckCardIds]);
  useEffect(() => { saveJson(STORAGE_AI, aiRules); }, [aiRules]);
  useEffect(() => { saveJson(STORAGE_OWNED, ownedCardIds); }, [ownedCardIds]);
  useEffect(() => { saveJson(STORAGE_GOLD, gold); }, [gold]);
  useEffect(() => { saveJson(STORAGE_SHARDS, shards); }, [shards]);
  useEffect(() => { saveJson(STORAGE_STATIONS, stationLevels); }, [stationLevels]);

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
