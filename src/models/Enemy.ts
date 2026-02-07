export type EnemyType = 'normal' | 'elite' | 'boss';

export interface EnemyPatternEntry {
  type: string;
  value: number;
  display: string;
  note?: string;
  effect?: string;
  hits?: number;
  block?: number;
}

export interface BossPhase {
  name: string;
  trigger: string;
  transitionEffect?: string;
  pattern: EnemyPatternEntry[];
  designNote?: string;
}

export interface EnemyRewards {
  gold: number;
  cardChoices: number;
  rarityBoost?: number;
  rarityGuaranteed?: string;
  foilBase?: number;
  blueprintChance?: number;
  prestige_unlock?: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  type: EnemyType;
  baseHp: number;
  baseAtk: number;
  floors: [number, number];
  pattern?: EnemyPatternEntry[];
  phases?: BossPhase[];
  special: string | null;
  lore?: string;
  designNote?: string;
  rewards?: EnemyRewards;
  spawnCount?: { min: number; max: number };
}

/** Runtime enemy instance during combat */
export interface EnemyInstance {
  id: string;
  def: EnemyDef;
  instanceId: number;
  hp: number;
  maxHp: number;
  block: number;
  patternIndex: number;
  statusEffects: StatusEffects;
  currentPhase: number; // for bosses
  dead: boolean;
}

export interface StatusEffects {
  poison: number;
  weakness: number;
  vulnerability: number;
  thorn: number;
  thornTemp: number; // turn-only thorn
  str: number;
  strTemp: number; // turn-only str
  dex: number;
  dexTemp: number; // turn-only dex
  strPerTurn: number;
  blockRetain: boolean;
  corpseExplode: boolean;
}

export function createDefaultStatusEffects(): StatusEffects {
  return {
    poison: 0,
    weakness: 0,
    vulnerability: 0,
    thorn: 0,
    thornTemp: 0,
    str: 0,
    strTemp: 0,
    dex: 0,
    dexTemp: 0,
    strPerTurn: 0,
    blockRetain: false,
    corpseExplode: false,
  };
}
