import type { Card, EnemyDef, AIRule } from '../models';

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
