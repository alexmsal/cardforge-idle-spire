/**
 * Simple battle test: Starter deck with 3 AI rules vs Skeleton enemy.
 * Runs 10 battles and prints winrate + stats.
 *
 * Usage: npx tsx src/test/battleTest.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BattleEngine } from '../engine/BattleEngine';
import { Card } from '../models/Card';
import { EnemyDef } from '../models/Enemy';
import { AIRule } from '../models/AIRule';
import { BattleSummary } from '../models/CombatState';

// ─── Load Data ──────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = resolve(__dirname, '../data');

const cardsData = JSON.parse(readFileSync(resolve(dataDir, 'cards.json'), 'utf-8'));
const enemiesData = JSON.parse(readFileSync(resolve(dataDir, 'enemies.json'), 'utf-8'));
const configData = JSON.parse(readFileSync(resolve(dataDir, 'game-config.json'), 'utf-8'));

const allCards: Card[] = cardsData.cards;
const allEnemies: EnemyDef[] = enemiesData.enemies;

// ─── Build Starter Deck ─────────────────────────────────────────

const starterDeckDef = configData.starterDecks[0];
const starterDeck: Card[] = [];

for (const entry of starterDeckDef.cards) {
  const cardDef = allCards.find((c: Card) => c.id === entry.id);
  if (!cardDef) {
    console.error(`Card not found: ${entry.id}`);
    continue;
  }
  for (let i = 0; i < entry.count; i++) {
    starterDeck.push(cardDef);
  }
}

// ─── AI Rules (from starter deck config) ────────────────────────

const aiRules: AIRule[] = starterDeckDef.aiRules;

// ─── Find Skeleton Enemy ────────────────────────────────────────

const skeleton = allEnemies.find((e: EnemyDef) => e.id === 'skeleton');
if (!skeleton) {
  console.error('Skeleton enemy not found!');
  process.exit(1);
}

// ─── Run Battles ────────────────────────────────────────────────

const NUM_BATTLES = 10;
const results: BattleSummary[] = [];

console.log('╔══════════════════════════════════════════════════╗');
console.log('║   CardForge: Idle Spire — Battle Engine Test    ║');
console.log('╠══════════════════════════════════════════════════╣');
console.log(`║  Deck: ${starterDeckDef.name} (${starterDeck.length} cards)`.padEnd(51) + '║');
console.log(`║  Enemy: ${skeleton.name} (${skeleton.baseHp} HP, ATK ${skeleton.baseAtk})`.padEnd(51) + '║');
console.log(`║  AI Rules: ${aiRules.length}`.padEnd(51) + '║');
console.log(`║  Battles: ${NUM_BATTLES}`.padEnd(51) + '║');
console.log('╚══════════════════════════════════════════════════╝');
console.log();

for (let i = 0; i < NUM_BATTLES; i++) {
  const engine = new BattleEngine(aiRules);
  engine.initCombat(starterDeck, [skeleton]);
  const summary = engine.runFullCombat();
  results.push(summary);

  const icon = summary.result === 'win' ? '✓' : '✗';
  console.log(
    `  Battle ${String(i + 1).padStart(2)}: ${icon} ${summary.result.toUpperCase().padEnd(4)} | ` +
      `${summary.turnsElapsed} turns | ` +
      `HP: ${summary.playerHpRemaining}/${80} | ` +
      `Cards: ${summary.cardsPlayed} | ` +
      `Dmg dealt: ${summary.damageDealt} | ` +
      `Dmg taken: ${summary.damageReceived}`
  );
}

// ─── Summary ────────────────────────────────────────────────────

const wins = results.filter((r) => r.result === 'win').length;
const losses = results.filter((r) => r.result === 'lose').length;
const avgTurns = (results.reduce((s, r) => s + r.turnsElapsed, 0) / NUM_BATTLES).toFixed(1);
const avgHpRemaining = (results.filter((r) => r.result === 'win').reduce((s, r) => s + r.playerHpRemaining, 0) / Math.max(wins, 1)).toFixed(1);
const avgDmgDealt = (results.reduce((s, r) => s + r.damageDealt, 0) / NUM_BATTLES).toFixed(1);
const avgDmgTaken = (results.reduce((s, r) => s + r.damageReceived, 0) / NUM_BATTLES).toFixed(1);

console.log();
console.log('┌──────────────────────────────────────────────────┐');
console.log('│  RESULTS                                         │');
console.log('├──────────────────────────────────────────────────┤');
console.log(`│  Winrate:          ${wins}/${NUM_BATTLES} (${((wins / NUM_BATTLES) * 100).toFixed(0)}%)`.padEnd(51) + '│');
console.log(`│  Wins: ${wins}  Losses: ${losses}`.padEnd(51) + '│');
console.log(`│  Avg turns:        ${avgTurns}`.padEnd(51) + '│');
console.log(`│  Avg HP remaining: ${avgHpRemaining} (on wins)`.padEnd(51) + '│');
console.log(`│  Avg dmg dealt:    ${avgDmgDealt}`.padEnd(51) + '│');
console.log(`│  Avg dmg taken:    ${avgDmgTaken}`.padEnd(51) + '│');
console.log('└──────────────────────────────────────────────────┘');
