import { getCardById } from '../data/gameData';
import type { Card } from '../models';

// ─── Types ──────────────────────────────────────────────

export interface InstalledGenerator {
  cardId: string;
  installedAt: number; // ms timestamp
}

export interface EconomyStats {
  totalGoldEarned: number;
  totalGoldSpent: number;
  totalShardsEarned: number;
  totalShardsSpent: number;
  totalRunsCompleted: number;
  totalBossKills: number;
}

export interface OfflineProgress {
  elapsedMs: number;
  goldGenerated: number;
  shardsGenerated: number;
  generatorsExpired: string[]; // cardIds of generators that hit 0% efficiency
}

export const DEFAULT_ECONOMY_STATS: EconomyStats = {
  totalGoldEarned: 0,
  totalGoldSpent: 0,
  totalShardsEarned: 0,
  totalShardsSpent: 0,
  totalRunsCompleted: 0,
  totalBossKills: 0,
};

// ─── Efficiency ─────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

export function getGeneratorEfficiency(
  installedAt: number,
  now: number,
  degradationPerDay: number,
): number {
  const daysSinceInstall = (now - installedAt) / MS_PER_DAY;
  return Math.max(0, 1 - daysSinceInstall * degradationPerDay);
}

// ─── Calculate offline progress ─────────────────────────

export function calculateOfflineProgress(
  generators: InstalledGenerator[],
  lastOnline: number,
  now: number,
  degradationPerDay: number,
  maxOfflineMs: number,
  offlineMultiplier: number,
): OfflineProgress {
  const rawElapsed = now - lastOnline;
  const elapsedMs = Math.min(rawElapsed, maxOfflineMs);

  if (elapsedMs <= 0 || generators.length === 0) {
    return { elapsedMs: Math.max(0, rawElapsed), goldGenerated: 0, shardsGenerated: 0, generatorsExpired: [] };
  }

  const elapsedMinutes = elapsedMs / MS_PER_MINUTE;
  let goldGenerated = 0;
  let shardsGenerated = 0;
  const generatorsExpired: string[] = [];

  for (const gen of generators) {
    const card = getCardById(gen.cardId);
    if (!card) continue;

    // Average efficiency over the offline period
    const effStart = getGeneratorEfficiency(gen.installedAt, lastOnline, degradationPerDay);
    const effEnd = getGeneratorEfficiency(gen.installedAt, now, degradationPerDay);

    if (effEnd <= 0) {
      generatorsExpired.push(gen.cardId);
    }

    const avgEff = Math.max(0, (effStart + effEnd) / 2);

    for (const effect of card.effects) {
      if (effect.type === 'generate_gold') {
        goldGenerated += (effect.value as number) * elapsedMinutes * avgEff * offlineMultiplier;
      } else if (effect.type === 'generate_shards') {
        shardsGenerated += (effect.value as number) * elapsedMinutes * avgEff * offlineMultiplier;
      }
    }
  }

  return {
    elapsedMs: Math.max(0, rawElapsed),
    goldGenerated: Math.floor(goldGenerated),
    shardsGenerated: Math.floor(shardsGenerated),
    generatorsExpired,
  };
}

// ─── Live tick (for online generation) ──────────────────

export function calculateLiveGeneration(
  generators: InstalledGenerator[],
  deltaMs: number,
  degradationPerDay: number,
  now: number,
): { gold: number; shards: number } {
  const deltaMinutes = deltaMs / MS_PER_MINUTE;
  let gold = 0;
  let shards = 0;

  for (const gen of generators) {
    const card = getCardById(gen.cardId);
    if (!card) continue;

    const eff = getGeneratorEfficiency(gen.installedAt, now, degradationPerDay);
    if (eff <= 0) continue;

    for (const effect of card.effects) {
      if (effect.type === 'generate_gold') {
        gold += (effect.value as number) * deltaMinutes * eff;
      } else if (effect.type === 'generate_shards') {
        shards += (effect.value as number) * deltaMinutes * eff;
      }
    }
  }

  return { gold, shards };
}

// ─── Rates for display ──────────────────────────────────

export function getGeneratorRates(
  generators: InstalledGenerator[],
  degradationPerDay: number,
  now: number,
): { goldPerMin: number; shardsPerMin: number } {
  let goldPerMin = 0;
  let shardsPerMin = 0;

  for (const gen of generators) {
    const card = getCardById(gen.cardId);
    if (!card) continue;

    const eff = getGeneratorEfficiency(gen.installedAt, now, degradationPerDay);
    if (eff <= 0) continue;

    for (const effect of card.effects) {
      if (effect.type === 'generate_gold') {
        goldPerMin += (effect.value as number) * eff;
      } else if (effect.type === 'generate_shards') {
        shardsPerMin += (effect.value as number) * eff;
      }
    }
  }

  return { goldPerMin, shardsPerMin };
}

export function getGeneratorInfo(gen: InstalledGenerator, degradationPerDay: number, now: number): {
  card: Card | undefined;
  efficiency: number;
  goldPerMin: number;
  shardsPerMin: number;
  daysRemaining: number;
} {
  const card = getCardById(gen.cardId);
  const eff = getGeneratorEfficiency(gen.installedAt, now, degradationPerDay);
  let goldPerMin = 0;
  let shardsPerMin = 0;

  if (card) {
    for (const effect of card.effects) {
      if (effect.type === 'generate_gold') goldPerMin = (effect.value as number) * eff;
      if (effect.type === 'generate_shards') shardsPerMin = (effect.value as number) * eff;
    }
  }

  const daysSinceInstall = (now - gen.installedAt) / MS_PER_DAY;
  const totalLifeDays = 1 / degradationPerDay;
  const daysRemaining = Math.max(0, totalLifeDays - daysSinceInstall);

  return { card, efficiency: eff, goldPerMin, shardsPerMin, daysRemaining };
}
