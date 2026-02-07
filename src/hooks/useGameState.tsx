import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Card, AIRule } from '../models';
import {
  starterTemplates,
  getCardById,
  DECK_MAX,
  MAX_AI_RULES,
} from '../data/gameData';
import type { StarterDeckTemplate } from '../data/gameData';

// ─── Storage keys ──────────────────────────────────────────

const STORAGE_DECK = 'cardforge_deck_ids';
const STORAGE_AI = 'cardforge_ai_rules';

function saveDeckToStorage(cardIds: string[]) {
  try { localStorage.setItem(STORAGE_DECK, JSON.stringify(cardIds)); } catch { /* noop */ }
}

function loadDeckFromStorage(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_DECK);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

function saveRulesToStorage(rules: AIRule[]) {
  try { localStorage.setItem(STORAGE_AI, JSON.stringify(rules)); } catch { /* noop */ }
}

function loadRulesFromStorage(): AIRule[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_AI);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
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
}

const GameStateContext = createContext<GameStateContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────

export function GameStateProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default template
  const [deckCardIds, setDeckCardIds] = useState<string[]>(() => {
    const saved = loadDeckFromStorage();
    if (saved && saved.length > 0) return saved;
    const template = starterTemplates[0];
    const ids: string[] = [];
    for (const entry of template.cards) {
      for (let i = 0; i < entry.count; i++) ids.push(entry.id);
    }
    return ids;
  });

  const [aiRules, setAiRulesRaw] = useState<AIRule[]>(() => {
    const saved = loadRulesFromStorage();
    if (saved && saved.length > 0) return saved;
    return starterTemplates[0].aiRules;
  });

  // Persist on change
  useEffect(() => { saveDeckToStorage(deckCardIds); }, [deckCardIds]);
  useEffect(() => { saveRulesToStorage(aiRules); }, [aiRules]);

  // Resolve IDs to Card objects
  const deckCards: Card[] = deckCardIds.map((id) => getCardById(id)).filter((c): c is Card => c !== undefined);

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
  }, []);

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
      // Re-number priorities
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
