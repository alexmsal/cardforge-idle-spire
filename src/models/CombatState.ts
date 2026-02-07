import type { CardInstance } from './Card';
import type { EnemyInstance, StatusEffects } from './Enemy';

export interface PlayerState {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  statusEffects: StatusEffects;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
}

export interface CombatState {
  player: PlayerState;
  enemies: EnemyInstance[];
  turn: number;
  maxTurns: number;
  phase: 'player_turn' | 'enemy_turn' | 'won' | 'lost';
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  turn: number;
  phase: 'player' | 'enemy' | 'system';
  message: string;
}

export type BattleResult = 'win' | 'lose' | 'draw';

export interface BattleSummary {
  result: BattleResult;
  turnsElapsed: number;
  playerHpRemaining: number;
  enemiesDefeated: number;
  cardsPlayed: number;
  damageDealt: number;
  damageReceived: number;
}
