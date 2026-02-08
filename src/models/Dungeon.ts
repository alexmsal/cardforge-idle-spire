import type { Card } from './Card';
import type { AIRule } from './AIRule';
import type { BattleSummary } from './CombatState';

// ─── Node Types ──────────────────────────────────────────

export type NodeType = 'battle' | 'elite' | 'event' | 'shop' | 'chest' | 'rest' | 'boss';

export interface MapNode {
  id: string;          // e.g. "f3-n1"
  floor: number;
  index: number;       // position within floor (0-based)
  type: NodeType;
  connections: string[]; // IDs of next-floor nodes this connects to
  visited: boolean;
  available: boolean;   // can the player move here?
}

export interface DungeonMap {
  floors: MapNode[][];  // floors[floorIndex] = array of nodes
  totalFloors: number;
}

// ─── Run State ───────────────────────────────────────────

export type RunPhase =
  | 'map'           // viewing the map, picking next node
  | 'battle'        // in a battle
  | 'reward'        // post-battle reward selection
  | 'event'         // at an event node
  | 'shop'          // at a shop node
  | 'rest'          // at a rest site
  | 'chest'         // opening a chest
  | 'card_remove'   // choosing a card to remove
  | 'card_upgrade'  // choosing a card to upgrade
  | 'victory'       // beat the boss
  | 'defeat';       // player died

export interface RunState {
  map: DungeonMap;
  currentFloor: number;
  currentNodeId: string | null;
  phase: RunPhase;
  hp: number;
  maxHp: number;
  gold: number;
  deckCardIds: string[];
  aiRules: AIRule[];
  // Pending rewards / event context
  pendingReward: PendingReward | null;
  pendingEvent: PendingEvent | null;
  // Stats
  floorsCleared: number;
  battlesWon: number;
  elitesSlain: number;
  goldEarned: number;
}

// ─── Rewards ─────────────────────────────────────────────

export interface PendingReward {
  gold: number;
  cardChoices: Card[];  // player picks 1 (or skip)
  battleSummary: BattleSummary;
}

export interface PendingEvent {
  eventId: string;
  resultText: string | null;  // shown after making a choice
}

// ─── Event Data (from game-config.json) ──────────────────

export interface EventChoice {
  label: string;
  description: string;
  cost: EventCost | null;
  reward: EventReward | null;
  resultText: string;
  resultText_success?: string;
  resultText_failure?: string;
}

export interface EventCost {
  type: string;  // hp_percent, gold, hp_flat, card_sacrifice, next_floor_harder
  value?: number;
  count?: number;
}

export interface EventReward {
  type: string;  // card_choice, heal, card_random, card_remove, card_upgrade, gamble, fight_weak, random_pool, card_transform, gold_loss
  value?: number;
  count?: number;
  rarity?: string;
  rarityBoost?: number;
  rarityGuaranteed?: string;
  success?: EventReward;
  failure?: EventReward;
  chance?: number;
  outcomes?: Array<{ type: string; value: number; weight: number; text: string }>;
  sameRarity?: boolean;
  goldReward?: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  choices: EventChoice[];
}

// ─── Shop Data ───────────────────────────────────────────

export interface ShopItem {
  card: Card;
  price: number;
  sold: boolean;
  isBargain?: boolean;
}

export interface ShopState {
  cards: ShopItem[];
  healFlask: { price: number; healAmount: number; sold: boolean };
  removalPrice: number;
}

// ─── Chest Data ──────────────────────────────────────────

export interface ChestReward {
  gold: number;
  card: Card | null;
}

// ─── Run Summary (death / victory) ──────────────────────

export interface RunSummary {
  result: 'victory' | 'defeat';
  floorsCleared: number;
  battlesWon: number;
  elitesSlain: number;
  goldEarned: number;
  firstRunBonus: number;
  finalHp: number;
  maxHp: number;
  deckSize: number;
  bossKill: boolean;
}
