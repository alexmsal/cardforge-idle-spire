import type { Card, EnemyDef, AIRule, GameEvent, Rarity } from '../models';

import cardsData from '../data/cards.json';
import enemiesData from '../data/enemies.json';
import configData from '../data/game-config.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allCards: Card[] = (cardsData as any).cards;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allEnemies: EnemyDef[] = (enemiesData as any).enemies;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cfg = configData as any;

export interface StarterDeckTemplate {
  id: string;
  name: string;
  description: string;
  cards: Array<{ id: string; count: number }>;
  aiRules: AIRule[];
}

export const starterTemplates: StarterDeckTemplate[] = cfg.starterDecks;

export const DECK_MIN = 12;
export const DECK_MAX = 30;
export const MAX_AI_RULES = 10;

// ─── Dungeon data ────────────────────────────────────────

export const dungeonConfig = cfg.dungeonMap.crypt;
export const economyConfig = cfg.gameConfig.economy;
export const shopConfig = cfg.shop;
export const restSiteConfig = cfg.restSite;
export const chestRewardsConfig = cfg.chestRewards;
export const gameEvents: GameEvent[] = cfg.events;
export const STARTING_HP = cfg.gameConfig.combat.startingHp as number;

// ─── Workshop / crafting data ────────────────────────────

export const craftingConfig = cfg.gameConfig.crafting as {
  enhanceCost: string;
  transmuteCost: string;
  dismantleYield: Record<string, number>;
  craftCost: Record<string, number>;
};

export const stationsConfig = cfg.gameConfig.stations as Record<
  string,
  { name: string; baseCost: number; costExponent: number; maxLevel: number; perLevel: string }
>;

// ─── Idle / generator data ──────────────────────────────

export const idleConfig = cfg.gameConfig.idle as {
  maxOfflineHours: number;
  offlineRewardMultiplier: number;
  generatorDegradationPerDay: number;
  battleDurationSeconds: number;
  speedMultipliers: number[];
};

export const generatorCards: Card[] = allCards.filter((c) => c.type === 'generator');
const combatCards: Card[] = allCards.filter((c) => c.type !== 'generator');

// ─── Helpers ─────────────────────────────────────────────

export function buildDeckFromTemplate(template: StarterDeckTemplate): Card[] {
  const deck: Card[] = [];
  for (const entry of template.cards) {
    const cardDef = allCards.find((c) => c.id === entry.id);
    if (cardDef) {
      for (let i = 0; i < entry.count; i++) {
        deck.push(cardDef);
      }
    }
  }
  return deck;
}

export function getCardById(id: string): Card | undefined {
  return allCards.find((c) => c.id === id);
}

export function getEnemyById(id: string): EnemyDef | undefined {
  return allEnemies.find((e) => e.id === id);
}

export function getCardsByRarity(rarity: Rarity): Card[] {
  return allCards.filter((c) => c.rarity === rarity);
}

export function getRandomCard(rarity?: string): Card {
  const pool = rarity ? combatCards.filter((c) => c.rarity === rarity) : combatCards;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomCardChoices(count: number, rarity?: string): Card[] {
  const pool = rarity ? combatCards.filter((c) => c.rarity === rarity) : combatCards;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
