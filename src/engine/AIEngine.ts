import type { AIRule, AICondition, AITarget, ConditionOperator } from '../models/AIRule';
import type { CombatState } from '../models/CombatState';
import type { CardInstance } from '../models/Card';
import type { EnemyInstance } from '../models/Enemy';

export interface AIAction {
  cardInstance: CardInstance;
  targetIndex: number;
}

export class AIEngine {
  private rules: AIRule[];

  constructor(rules: AIRule[]) {
    // Ensure rules are sorted by priority (lowest number = highest priority)
    this.rules = [...rules].sort((a, b) => a.priority - b.priority);
  }

  /** Evaluate rules top-to-bottom. Return the first valid action, or null. */
  selectAction(state: CombatState): AIAction | null {
    const { player, enemies } = state;
    const aliveEnemies = enemies.filter((e) => !e.dead);
    if (aliveEnemies.length === 0) return null;

    for (const rule of this.rules) {
      // Check condition
      if (!this.evaluateCondition(rule.condition, state)) continue;

      // Find the card in hand
      const cardInstance = player.hand.find(
        (ci) => ci.card.id === rule.cardId && player.energy >= ci.card.cost
      );
      if (!cardInstance) continue;

      // Resolve target
      const targetIndex = this.resolveTarget(rule.target, aliveEnemies, enemies);

      return { cardInstance, targetIndex };
    }

    // Fallback: play any affordable card that costs > 0 (avoid infinite loops with 0-cost)
    // Then try 0-cost cards
    for (const ci of player.hand) {
      if (ci.card.cost <= player.energy && ci.card.cost > 0) {
        const targetIndex = this.resolveTarget('nearest', aliveEnemies, enemies);
        return { cardInstance: ci, targetIndex };
      }
    }
    for (const ci of player.hand) {
      if (ci.card.cost === 0 && player.energy >= 0) {
        const targetIndex = this.resolveTarget('nearest', aliveEnemies, enemies);
        return { cardInstance: ci, targetIndex };
      }
    }

    return null;
  }

  private evaluateCondition(condition: AICondition, state: CombatState): boolean {
    const { player, enemies } = state;

    if (condition.parameter === 'always') return true;

    const value = condition.value ?? 0;
    const op = condition.operator ?? '=';

    let actual: number;

    switch (condition.parameter) {
      case 'hp_percent':
        actual = (player.hp / player.maxHp) * 100;
        break;
      case 'hp':
        actual = player.hp;
        break;
      case 'block':
        actual = player.block;
        break;
      case 'energy':
        actual = player.energy;
        break;
      case 'enemy_count':
        actual = enemies.filter((e) => !e.dead).length;
        break;
      case 'hand_size':
        actual = player.hand.length;
        break;
      case 'poison_on_enemy': {
        const alive = enemies.filter((e) => !e.dead);
        actual = alive.length > 0 ? Math.max(...alive.map((e) => e.statusEffects.poison)) : 0;
        break;
      }
      case 'player_poison':
        actual = player.statusEffects.poison;
        break;
      case 'player_str':
        actual = player.statusEffects.str;
        break;
      default:
        return false;
    }

    return this.compare(actual, op, value);
  }

  private compare(actual: number, op: ConditionOperator, value: number): boolean {
    switch (op) {
      case '<': return actual < value;
      case '>': return actual > value;
      case '<=': return actual <= value;
      case '>=': return actual >= value;
      case '=': return actual === value;
      case '!=': return actual !== value;
      default: return false;
    }
  }

  private resolveTarget(
    target: AITarget,
    aliveEnemies: EnemyInstance[],
    allEnemies: EnemyInstance[]
  ): number {
    if (aliveEnemies.length === 0) return 0;

    let chosen: EnemyInstance;

    switch (target) {
      case 'self':
        return 0; // doesn't matter for self-targeting cards

      case 'nearest':
        chosen = aliveEnemies[0];
        break;

      case 'lowest_hp':
        chosen = aliveEnemies.reduce((min, e) => (e.hp < min.hp ? e : min), aliveEnemies[0]);
        break;

      case 'highest_hp':
        chosen = aliveEnemies.reduce((max, e) => (e.hp > max.hp ? e : max), aliveEnemies[0]);
        break;

      case 'random':
        chosen = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        break;

      default:
        chosen = aliveEnemies[0];
        break;
    }

    // Return index in the full enemies array (including dead for stable indexing)
    return allEnemies.indexOf(chosen);
  }
}
