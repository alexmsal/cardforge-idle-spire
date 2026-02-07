export type ConditionOperator = '<' | '>' | '<=' | '>=' | '=' | '!=';

export interface AICondition {
  parameter: string; // 'hp_percent' | 'block' | 'energy' | 'enemy_count' | 'always' | etc.
  operator?: ConditionOperator;
  value?: number;
}

export type AITarget = 'self' | 'nearest' | 'lowest_hp' | 'highest_hp' | 'random';

export interface AIRule {
  priority: number;
  condition: AICondition;
  cardId: string;
  target: AITarget;
  description?: string;
}
