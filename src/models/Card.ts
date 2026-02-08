export type Rarity = 'common' | 'uncommon' | 'rare';
export type CardType = 'attack' | 'defense' | 'skill' | 'reaction' | 'generator';
export type Archetype = 'neutral' | 'berserker' | 'poison' | 'shield';
export type EffectTarget = 'enemy' | 'self' | 'all_enemies' | 'attacker';
export type EffectDuration = 'turn' | 'combat';

export interface CardEffect {
  type: string;
  value: number | boolean;
  target: EffectTarget;
  duration?: EffectDuration;
  note?: string;
  hits?: number;
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  type: CardType;
  cost: number;
  archetype: Archetype;
  keywords: string[];
  effects: CardEffect[];
  ppCalc?: string;
  ppTotal?: number;
  exhaust?: boolean;
  designNote?: string;
  upgrade?: Record<string, Record<string, number | string>>;
}

/** Runtime card instance in a deck/hand — tracks per-copy state like ramp counters */
export interface CardInstance {
  card: Card;
  instanceId: number;
  rampBonus: number; // for damage_ramp cards
  exhausted: boolean;
}
