import type {
  Card,
  CardInstance,
  EnemyDef,
  EnemyInstance,
  EnemyPatternEntry,
  CombatState,
  BattleResult,
  BattleSummary,
  CombatLogEntry,
} from '../models';
import { createDefaultStatusEffects } from '../models';
import { AIEngine } from './AIEngine';
import type { AIRule } from '../models/AIRule';

const HAND_SIZE = 5;
const MAX_HAND_SIZE = 10;
const STARTING_ENERGY = 3;
const TURN_LIMIT = 50;

export class BattleEngine {
  private state!: CombatState;
  private aiEngine: AIEngine;
  private stats = { cardsPlayed: 0, damageDealt: 0, damageReceived: 0 };
  private nextInstanceId = 1;

  constructor(aiRules: AIRule[]) {
    this.aiEngine = new AIEngine(aiRules);
  }

  /** Set up a fresh combat: build player state from deck, instantiate enemies */
  initCombat(
    deckCards: Card[],
    enemyDefs: EnemyDef[],
    playerMaxHp: number = 80,
    playerCurrentHp?: number
  ): CombatState {
    const drawPile = this.buildDeck(deckCards);
    this.shuffle(drawPile);

    const enemies = enemyDefs.map((def) => this.instantiateEnemy(def));

    this.state = {
      player: {
        hp: playerCurrentHp ?? playerMaxHp,
        maxHp: playerMaxHp,
        block: 0,
        energy: STARTING_ENERGY,
        maxEnergy: STARTING_ENERGY,
        statusEffects: createDefaultStatusEffects(),
        hand: [],
        drawPile,
        discardPile: [],
        exhaustPile: [],
      },
      enemies,
      turn: 0,
      maxTurns: TURN_LIMIT,
      phase: 'player_turn',
      log: [],
    };

    this.stats = { cardsPlayed: 0, damageDealt: 0, damageReceived: 0 };
    return this.state;
  }

  /** Run a full combat until win/lose/draw and return a summary */
  runFullCombat(): BattleSummary {
    while (this.state.phase !== 'won' && this.state.phase !== 'lost') {
      if (this.state.turn >= this.state.maxTurns) {
        this.state.phase = 'lost';
        this.log('system', 'Turn limit reached — construct collapses.');
        break;
      }
      this.runTurn();
    }

    const result: BattleResult =
      this.state.phase === 'won' ? 'win' : 'lose';

    return {
      result,
      turnsElapsed: this.state.turn,
      playerHpRemaining: this.state.player.hp,
      enemiesDefeated: this.state.enemies.filter((e) => e.dead).length,
      cardsPlayed: this.stats.cardsPlayed,
      damageDealt: this.stats.damageDealt,
      damageReceived: this.stats.damageReceived,
    };
  }

  /** Execute one full turn: player phase then enemy phase */
  private runTurn(): void {
    this.state.turn++;
    this.state.phase = 'player_turn';
    this.log('system', `=== Turn ${this.state.turn} ===`);

    // --- Start of player turn ---
    this.startOfPlayerTurn();
    if (this.checkWinLose()) return;

    // --- Player AI plays cards ---
    this.playerPhase();
    if (this.checkWinLose()) return;

    // --- End of player turn ---
    this.endOfPlayerTurn();

    // --- Enemy turn ---
    this.state.phase = 'enemy_turn';
    this.enemyPhase();
    this.checkWinLose();
  }

  // ─── PLAYER TURN ──────────────────────────────────────────────

  private startOfPlayerTurn(): void {
    const p = this.state.player;

    // Block decay (unless block_retain)
    if (!p.statusEffects.blockRetain) {
      p.block = 0;
    }

    // Restore energy
    p.energy = p.maxEnergy;

    // STR per turn (e.g. Demon Form)
    if (p.statusEffects.strPerTurn > 0) {
      p.statusEffects.str += p.statusEffects.strPerTurn;
      this.log('player', `Gains ${p.statusEffects.strPerTurn} STR from passive. (Total: ${p.statusEffects.str})`);
    }

    // Poison ticks before action
    if (p.statusEffects.poison > 0) {
      const poisonDmg = p.statusEffects.poison;
      p.hp -= poisonDmg;
      this.log('player', `Takes ${poisonDmg} poison damage. (HP: ${p.hp}/${p.maxHp})`);
      p.statusEffects.poison = Math.max(0, p.statusEffects.poison - 1);
    }

    // Draw cards
    this.drawCards(HAND_SIZE);
  }

  private playerPhase(): void {
    // AI plays cards until it can't find a valid play
    let safety = 0;
    while (safety++ < 30) {
      const action = this.aiEngine.selectAction(this.state);
      if (!action) break;

      const { cardInstance, targetIndex } = action;
      this.playCard(cardInstance, targetIndex);
      this.stats.cardsPlayed++;

      // Remove dead enemies
      this.removeDeadEnemies();
      if (this.allEnemiesDead()) break;
      if (this.state.player.hp <= 0) break;
    }
  }

  private endOfPlayerTurn(): void {
    const p = this.state.player;

    // Discard hand
    while (p.hand.length > 0) {
      const c = p.hand.pop()!;
      p.discardPile.push(c);
    }

    // Temp STR/DEX decay
    if (p.statusEffects.strTemp > 0) {
      p.statusEffects.str -= p.statusEffects.strTemp;
      p.statusEffects.strTemp = 0;
    }
    if (p.statusEffects.dexTemp > 0) {
      p.statusEffects.dex -= p.statusEffects.dexTemp;
      p.statusEffects.dexTemp = 0;
    }
    // Temp thorn decay
    if (p.statusEffects.thornTemp > 0) {
      p.statusEffects.thorn -= p.statusEffects.thornTemp;
      p.statusEffects.thornTemp = 0;
    }
  }

  // ─── CARD PLAYING ─────────────────────────────────────────────

  private playCard(ci: CardInstance, targetIdx: number): void {
    const p = this.state.player;
    const card = ci.card;

    // Pay energy
    p.energy -= card.cost;

    // Remove from hand
    const handIdx = p.hand.indexOf(ci);
    if (handIdx >= 0) p.hand.splice(handIdx, 1);

    this.log('player', `Plays ${card.name} (cost ${card.cost}, energy left: ${p.energy})`);

    // Resolve each effect
    for (const effect of card.effects) {
      this.resolveEffect(effect, ci, targetIdx);
    }

    // Send to discard or exhaust
    if (card.exhaust || ci.exhausted) {
      p.exhaustPile.push(ci);
      this.log('player', `${card.name} exhausts.`);
    } else {
      p.discardPile.push(ci);
    }
  }

  private resolveEffect(
    effect: { type: string; value: number | boolean; target: string; duration?: string; hits?: number; note?: string },
    ci: CardInstance,
    targetIdx: number
  ): void {
    const p = this.state.player;
    const enemies = this.state.enemies.filter((e) => !e.dead);
    const target = enemies[targetIdx] ?? enemies[0];

    switch (effect.type) {
      case 'damage': {
        if (!target) break;
        const baseDmg = (effect.value as number) + ci.rampBonus;
        const totalStr = p.statusEffects.str;
        let dmg = baseDmg + totalStr;
        // Weakness: -25% ATK
        if (p.statusEffects.weakness > 0) {
          dmg = Math.floor(dmg * 0.75);
        }
        this.dealDamageToEnemy(target, dmg);
        break;
      }

      case 'damage_aoe': {
        const baseDmg = effect.value as number;
        const totalStr = p.statusEffects.str;
        let dmg = baseDmg + totalStr;
        if (p.statusEffects.weakness > 0) {
          dmg = Math.floor(dmg * 0.75);
        }
        for (const e of enemies) {
          this.dealDamageToEnemy(e, dmg);
        }
        break;
      }

      case 'block': {
        const baseBlock = effect.value as number;
        const totalDex = p.statusEffects.dex;
        const block = baseBlock + totalDex;
        p.block += block;
        this.log('player', `Gains ${block} block. (Total: ${p.block})`);
        break;
      }

      case 'heal': {
        if (effect.target === 'self') {
          const healAmt = effect.value as number;
          const before = p.hp;
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          this.log('player', `Heals ${p.hp - before} HP. (HP: ${p.hp}/${p.maxHp})`);
        }
        break;
      }

      case 'damage_self': {
        const dmg = effect.value as number;
        p.hp -= dmg;
        this.stats.damageReceived += dmg;
        this.log('player', `Takes ${dmg} self-damage. (HP: ${p.hp}/${p.maxHp})`);
        break;
      }

      case 'poison': {
        if (effect.target === 'enemy' && target) {
          const stacks = effect.value as number;
          target.statusEffects.poison += stacks;
          this.log('player', `Applies ${stacks} Poison to ${target.def.name}. (Total: ${target.statusEffects.poison})`);
        } else if (effect.target === 'self') {
          const stacks = effect.value as number;
          p.statusEffects.poison += stacks;
          this.log('player', `Gains ${stacks} Poison. (Total: ${p.statusEffects.poison})`);
        }
        break;
      }

      case 'poison_aoe': {
        const stacks = effect.value as number;
        for (const e of enemies) {
          e.statusEffects.poison += stacks;
        }
        this.log('player', `Applies ${stacks} Poison to all enemies.`);
        break;
      }

      case 'poison_multiply': {
        if (target) {
          const mult = effect.value as number;
          const before = target.statusEffects.poison;
          target.statusEffects.poison *= mult;
          this.log('player', `Multiplies ${target.def.name}'s Poison by ${mult}. (${before} → ${target.statusEffects.poison})`);
        }
        break;
      }

      case 'weakness': {
        if (effect.target === 'enemy' && target) {
          target.statusEffects.weakness += effect.value as number;
          this.log('player', `Applies ${effect.value} Weakness to ${target.def.name}.`);
        } else if (effect.target === 'all_enemies') {
          for (const e of enemies) {
            e.statusEffects.weakness += effect.value as number;
          }
          this.log('player', `Applies ${effect.value} Weakness to all enemies.`);
        }
        break;
      }

      case 'vulnerability': {
        if (effect.target === 'enemy' && target) {
          target.statusEffects.vulnerability += effect.value as number;
          this.log('player', `Applies ${effect.value} Vulnerability to ${target.def.name}.`);
        } else if (effect.target === 'all_enemies') {
          for (const e of enemies) {
            e.statusEffects.vulnerability += effect.value as number;
          }
          this.log('player', `Applies ${effect.value} Vulnerability to all enemies.`);
        }
        break;
      }

      case 'vulnerability_self': {
        p.statusEffects.vulnerability += effect.value as number;
        this.log('player', `Gains ${effect.value} Vulnerability.`);
        break;
      }

      case 'str': {
        const val = effect.value as number;
        if (effect.duration === 'turn') {
          p.statusEffects.str += val;
          p.statusEffects.strTemp += val;
          this.log('player', `Gains ${val} temporary STR.`);
        } else {
          p.statusEffects.str += val;
          this.log('player', `Gains ${val} STR. (Total: ${p.statusEffects.str})`);
        }
        break;
      }

      case 'dex': {
        const val = effect.value as number;
        if (effect.duration === 'turn') {
          p.statusEffects.dex += val;
          p.statusEffects.dexTemp += val;
          this.log('player', `Gains ${val} temporary DEX.`);
        } else {
          p.statusEffects.dex += val;
          this.log('player', `Gains ${val} DEX. (Total: ${p.statusEffects.dex})`);
        }
        break;
      }

      case 'thorn': {
        const val = effect.value as number;
        if (effect.duration === 'turn') {
          p.statusEffects.thorn += val;
          p.statusEffects.thornTemp += val;
          this.log('player', `Gains ${val} temporary Thorn.`);
        } else {
          p.statusEffects.thorn += val;
          this.log('player', `Gains ${val} Thorn. (Total: ${p.statusEffects.thorn})`);
        }
        break;
      }

      case 'energy': {
        p.energy += effect.value as number;
        this.log('player', `Gains ${effect.value} energy. (Total: ${p.energy})`);
        break;
      }

      case 'draw': {
        this.drawCards(effect.value as number);
        break;
      }

      case 'str_per_turn': {
        const val = effect.value as number;
        p.statusEffects.strPerTurn += val;
        this.log('player', `Will gain ${val} STR at the start of each turn.`);
        break;
      }

      case 'block_retain': {
        p.statusEffects.blockRetain = true;
        this.log('player', 'Block no longer decays.');
        break;
      }

      case 'damage_ramp': {
        ci.rampBonus += effect.value as number;
        this.log('player', `${ci.card.name} gains +${effect.value} damage for next play.`);
        break;
      }

      case 'damage_on_hit': {
        // Thorn-like: stored as temp thorn for the turn
        const val = effect.value as number;
        p.statusEffects.thorn += val;
        p.statusEffects.thornTemp += val;
        this.log('player', `Sets up ${val} retaliation damage.`);
        break;
      }

      case 'corpse_explode': {
        if (target) {
          target.statusEffects.corpseExplode = true;
          this.log('player', `${target.def.name} will explode on death.`);
        }
        break;
      }

      default:
        break;
    }
  }

  // ─── DAMAGE HELPERS ───────────────────────────────────────────

  private dealDamageToEnemy(enemy: EnemyInstance, rawDmg: number): void {
    if (enemy.dead) return;

    // Vulnerability: +50% damage taken
    let dmg = rawDmg;
    if (enemy.statusEffects.vulnerability > 0) {
      dmg = Math.floor(dmg * 1.5);
    }

    // Block absorbs first
    const blockedDmg = Math.min(enemy.block, dmg);
    enemy.block -= blockedDmg;
    const throughDmg = dmg - blockedDmg;
    enemy.hp -= throughDmg;

    this.stats.damageDealt += throughDmg;
    this.log(
      'player',
      `Deals ${dmg} to ${enemy.def.name}${blockedDmg > 0 ? ` (${blockedDmg} blocked)` : ''}. (HP: ${enemy.hp}/${enemy.maxHp})`
    );

    // Thorn: enemy damages attacker when hit by attack
    const totalThorn = enemy.statusEffects.thorn;
    if (totalThorn > 0 && throughDmg > 0) {
      this.state.player.hp -= totalThorn;
      this.stats.damageReceived += totalThorn;
      this.log('enemy', `${enemy.def.name}'s thorns deal ${totalThorn} to player.`);
    }

    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.log('system', `${enemy.def.name} is defeated!`);

      // Corpse explosion
      if (enemy.statusEffects.corpseExplode) {
        const explosionDmg = enemy.maxHp;
        const otherEnemies = this.state.enemies.filter((e) => !e.dead && e !== enemy);
        for (const other of otherEnemies) {
          other.hp -= explosionDmg;
          this.stats.damageDealt += explosionDmg;
          this.log('system', `${enemy.def.name} explodes for ${explosionDmg} damage to ${other.def.name}!`);
          if (other.hp <= 0) {
            other.dead = true;
            this.log('system', `${other.def.name} is defeated!`);
          }
        }
      }
    }
  }

  private dealDamageToPlayer(rawDmg: number, source: string): void {
    const p = this.state.player;

    // Vulnerability: +50% damage taken
    let dmg = rawDmg;
    if (p.statusEffects.vulnerability > 0) {
      dmg = Math.floor(dmg * 1.5);
    }

    const blockedDmg = Math.min(p.block, dmg);
    p.block -= blockedDmg;
    const throughDmg = dmg - blockedDmg;
    p.hp -= throughDmg;
    this.stats.damageReceived += throughDmg;

    this.log(
      'enemy',
      `${source} deals ${dmg} to player${blockedDmg > 0 ? ` (${blockedDmg} blocked)` : ''}. (HP: ${p.hp}/${p.maxHp})`
    );

    // Player thorn
    const totalThorn = p.statusEffects.thorn;
    if (totalThorn > 0) {
      // Find the enemy that attacked for thorn
      const attacker = this.state.enemies.find((e) => !e.dead && e.def.name === source);
      if (attacker) {
        attacker.hp -= totalThorn;
        this.stats.damageDealt += totalThorn;
        this.log('player', `Thorns deal ${totalThorn} to ${attacker.def.name}. (HP: ${attacker.hp}/${attacker.maxHp})`);
        if (attacker.hp <= 0) {
          attacker.dead = true;
          this.log('system', `${attacker.def.name} is defeated by thorns!`);
        }
      }
    }
  }

  // ─── ENEMY TURN ───────────────────────────────────────────────

  private enemyPhase(): void {
    for (const enemy of this.state.enemies) {
      if (enemy.dead) continue;

      // Enemy start-of-turn: poison ticks, block decay
      this.enemyStartOfTurn(enemy);
      if (enemy.dead) continue;
      if (this.state.player.hp <= 0) break;

      // Get current pattern action
      const pattern = this.getEnemyPattern(enemy);
      if (!pattern || pattern.length === 0) continue;

      const action = pattern[enemy.patternIndex % pattern.length];
      this.executeEnemyAction(enemy, action);

      // Advance pattern
      enemy.patternIndex = (enemy.patternIndex + 1) % pattern.length;

      // Enemy end-of-turn: decrement status effects
      this.enemyEndOfTurn(enemy);

      if (this.state.player.hp <= 0) break;
    }
  }

  private enemyStartOfTurn(enemy: EnemyInstance): void {
    // Block decay
    enemy.block = 0;

    // STR per turn (for enemies with buffs)
    if (enemy.statusEffects.strPerTurn > 0) {
      enemy.statusEffects.str += enemy.statusEffects.strPerTurn;
    }

    // Poison ticks
    if (enemy.statusEffects.poison > 0) {
      const poisonDmg = enemy.statusEffects.poison;
      enemy.hp -= poisonDmg;
      this.stats.damageDealt += poisonDmg;
      this.log('system', `${enemy.def.name} takes ${poisonDmg} poison damage. (HP: ${enemy.hp}/${enemy.maxHp})`);
      enemy.statusEffects.poison = Math.max(0, enemy.statusEffects.poison - 1);
      if (enemy.hp <= 0) {
        enemy.dead = true;
        this.log('system', `${enemy.def.name} dies to poison!`);
      }
    }
  }

  private enemyEndOfTurn(enemy: EnemyInstance): void {
    // Decrement weakness / vulnerability
    if (enemy.statusEffects.weakness > 0) enemy.statusEffects.weakness--;
    if (enemy.statusEffects.vulnerability > 0) enemy.statusEffects.vulnerability--;

    // Temp status decay
    if (enemy.statusEffects.strTemp > 0) {
      enemy.statusEffects.str -= enemy.statusEffects.strTemp;
      enemy.statusEffects.strTemp = 0;
    }
    if (enemy.statusEffects.dexTemp > 0) {
      enemy.statusEffects.dex -= enemy.statusEffects.dexTemp;
      enemy.statusEffects.dexTemp = 0;
    }
    if (enemy.statusEffects.thornTemp > 0) {
      enemy.statusEffects.thorn -= enemy.statusEffects.thornTemp;
      enemy.statusEffects.thornTemp = 0;
    }
  }

  private getEnemyPattern(enemy: EnemyInstance): EnemyPatternEntry[] {
    const def = enemy.def;

    // Boss with phases
    if (def.phases && def.phases.length > 0) {
      const hpPercent = enemy.hp / enemy.maxHp;
      // Check phase transitions
      if (def.phases.length >= 2 && hpPercent <= 0.5 && enemy.currentPhase === 0) {
        enemy.currentPhase = 1;
        enemy.patternIndex = 0;

        // Phase transition effects (Crypt Lord: +3 STR, +15 block)
        const phase2 = def.phases[1];
        if (phase2.transitionEffect) {
          enemy.statusEffects.str += 3;
          enemy.block += 15;
          this.log('enemy', `${def.name} enters ${phase2.name}! Gains 3 STR and 15 Block.`);
        }
      }
      return def.phases[enemy.currentPhase].pattern;
    }

    return def.pattern ?? [];
  }

  private executeEnemyAction(enemy: EnemyInstance, action: EnemyPatternEntry): void {
    const name = enemy.def.name;

    switch (action.type) {
      case 'attack': {
        let dmg = action.value + enemy.statusEffects.str;
        if (enemy.statusEffects.weakness > 0) {
          dmg = Math.floor(dmg * 0.75);
        }
        this.log('enemy', `${name} uses ${action.display}.`);
        this.dealDamageToPlayer(dmg, name);

        // Soul Drain lifesteal: heal 50% of damage dealt
        if (action.note?.includes('Heals self for 50%')) {
          const heal = Math.floor(dmg * 0.5);
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
          this.log('enemy', `${name} heals ${heal} from lifesteal. (HP: ${enemy.hp}/${enemy.maxHp})`);
        }
        // Soul Harvest: flat heal
        if (action.note?.includes('Heals 10 HP')) {
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + 10);
          this.log('enemy', `${name} heals 10 HP. (HP: ${enemy.hp}/${enemy.maxHp})`);
        }
        break;
      }

      case 'attack_multi': {
        const hits = action.hits ?? 1;
        const perHit = action.value + enemy.statusEffects.str;
        this.log('enemy', `${name} uses ${action.display} (${hits} hits).`);
        for (let i = 0; i < hits; i++) {
          let dmg = perHit;
          if (enemy.statusEffects.weakness > 0) {
            dmg = Math.floor(dmg * 0.75);
          }
          this.dealDamageToPlayer(dmg, name);
          if (this.state.player.hp <= 0) break;
        }
        break;
      }

      case 'defend': {
        const blockVal = action.value;
        enemy.block += blockVal;
        this.log('enemy', `${name} uses ${action.display}. Gains ${blockVal} block. (Total: ${enemy.block})`);
        break;
      }

      case 'attack_defend': {
        // Combined: deals damage AND gains block
        const blockVal = action.block ?? 0;
        enemy.block += blockVal;
        this.log('enemy', `${name} uses ${action.display}. Gains ${blockVal} block.`);
        let dmg = action.value + enemy.statusEffects.str;
        if (enemy.statusEffects.weakness > 0) {
          dmg = Math.floor(dmg * 0.75);
        }
        this.dealDamageToPlayer(dmg, name);
        break;
      }

      case 'defend_attack': {
        const blockVal = action.block ?? 0;
        enemy.block += blockVal;
        this.log('enemy', `${name} uses ${action.display}. Gains ${blockVal} block.`);
        let dmg = action.value + enemy.statusEffects.str;
        if (enemy.statusEffects.weakness > 0) {
          dmg = Math.floor(dmg * 0.75);
        }
        this.dealDamageToPlayer(dmg, name);
        break;
      }

      case 'debuff': {
        const eff = action.effect;
        if (eff === 'weakness') {
          this.state.player.statusEffects.weakness += action.value;
          this.log('enemy', `${name} uses ${action.display}. Player gains ${action.value} Weakness.`);
        } else if (eff === 'poison') {
          this.state.player.statusEffects.poison += action.value;
          this.log('enemy', `${name} uses ${action.display}. Player gains ${action.value} Poison.`);
        }
        break;
      }

      case 'debuff_attack': {
        // Deal damage + apply debuff (e.g. "Oppressive Strike: 8 damage + 2 Weakness")
        let dmg = action.value + enemy.statusEffects.str;
        if (enemy.statusEffects.weakness > 0) {
          dmg = Math.floor(dmg * 0.75);
        }
        this.log('enemy', `${name} uses ${action.display}.`);
        this.dealDamageToPlayer(dmg, name);

        // Parse effect like "weakness:2"
        if (action.effect) {
          const [effType, effVal] = action.effect.split(':');
          const val = parseInt(effVal) || action.value;
          if (effType === 'weakness') {
            this.state.player.statusEffects.weakness += val;
            this.log('enemy', `Player gains ${val} Weakness.`);
          } else if (effType === 'vulnerability') {
            this.state.player.statusEffects.vulnerability += val;
            this.log('enemy', `Player gains ${val} Vulnerability.`);
          }
        }
        break;
      }

      case 'buff': {
        const eff = action.effect;
        if (eff === 'str') {
          enemy.statusEffects.str += action.value;
          this.log('enemy', `${name} uses ${action.display}. Gains ${action.value} STR. (Total: ${enemy.statusEffects.str})`);
        } else if (eff === 'summon_skeleton') {
          // Summoning is simplified: spawn a basic skeleton
          this.log('enemy', `${name} uses ${action.display}. Summons a Skeleton.`);
          // We'll add a skeleton to the enemy list if we have the def
          this.spawnSkeleton(1);
        } else if (eff?.startsWith('summon_skeleton:')) {
          const count = parseInt(eff.split(':')[1]) || 1;
          this.log('enemy', `${name} uses ${action.display}. Summons ${count} Skeletons.`);
          this.spawnSkeleton(count);
        }
        break;
      }

      case 'buff_all': {
        const eff = action.effect;
        if (eff === 'str') {
          const aliveEnemies = this.state.enemies.filter((e) => !e.dead);
          for (const e of aliveEnemies) {
            e.statusEffects.str += action.value;
          }
          this.log('enemy', `${name} uses ${action.display}. All enemies gain ${action.value} STR.`);
        }
        break;
      }

      default:
        this.log('enemy', `${name} uses ${action.display}. (unhandled type: ${action.type})`);
        break;
    }
  }

  private spawnSkeleton(count: number): void {
    for (let i = 0; i < count; i++) {
      // Create a minimal skeleton
      const skelDef: EnemyDef = {
        id: 'skeleton_summon',
        name: 'Skeleton',
        type: 'normal',
        baseHp: 28,
        baseAtk: 7,
        floors: [1, 10],
        pattern: [
          { type: 'attack', value: 7, display: 'Slash' },
          { type: 'attack', value: 7, display: 'Slash' },
          { type: 'defend', value: 5, display: 'Bone Shield' },
        ],
        special: null,
      };
      const instance = this.instantiateEnemy(skelDef);
      this.state.enemies.push(instance);
    }
  }

  // ─── DECK MANAGEMENT ──────────────────────────────────────────

  private buildDeck(cards: Card[]): CardInstance[] {
    return cards.map((card) => ({
      card,
      instanceId: this.nextInstanceId++,
      rampBonus: 0,
      exhausted: false,
    }));
  }

  private drawCards(count: number): void {
    const p = this.state.player;
    for (let i = 0; i < count; i++) {
      if (p.hand.length >= MAX_HAND_SIZE) break;

      // Reshuffle discard if draw pile is empty
      if (p.drawPile.length === 0) {
        if (p.discardPile.length === 0) break;
        p.drawPile = [...p.discardPile];
        p.discardPile = [];
        this.shuffle(p.drawPile);
      }

      const card = p.drawPile.pop()!;
      p.hand.push(card);
    }
    this.log('player', `Draws ${count} cards. Hand: ${p.hand.map((c) => c.card.name).join(', ')}`);
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // ─── ENEMY INSTANTIATION ─────────────────────────────────────

  private instantiateEnemy(def: EnemyDef): EnemyInstance {
    return {
      id: def.id,
      def,
      instanceId: this.nextInstanceId++,
      hp: def.baseHp,
      maxHp: def.baseHp,
      block: 0,
      patternIndex: 0,
      statusEffects: createDefaultStatusEffects(),
      currentPhase: 0,
      dead: false,
    };
  }

  // ─── UTILITY ──────────────────────────────────────────────────

  private removeDeadEnemies(): void {
    // Don't remove — just mark dead. Keeps indices stable for corpse explosion etc.
  }

  private allEnemiesDead(): boolean {
    return this.state.enemies.every((e) => e.dead);
  }

  private checkWinLose(): boolean {
    if (this.allEnemiesDead()) {
      this.state.phase = 'won';
      this.log('system', 'All enemies defeated — Victory!');
      return true;
    }
    if (this.state.player.hp <= 0) {
      this.state.phase = 'lost';
      this.log('system', 'Player HP reached 0 — Defeat.');
      return true;
    }
    return false;
  }

  private log(phase: CombatLogEntry['phase'], message: string): void {
    this.state.log.push({ turn: this.state.turn, phase, message });
  }

  /** Expose state for external inspection */
  getState(): CombatState {
    return this.state;
  }
}
