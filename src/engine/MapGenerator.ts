import type { DungeonMap, MapNode, NodeType } from '../models/Dungeon';

// ─── Config from game-config.json ────────────────────────

interface FloorOverride {
  forced?: NodeType;
  forced_one?: NodeType;
  elite_chance?: number;
}

interface CryptConfig {
  floors: number;
  nodesPerFloor: number;
  nodeTypeWeights: Record<string, number>;
  overrides: Record<string, FloorOverride>;
  encounterWeightsByFloor: Record<string, Record<string, number>>;
  multiEnemyChance: Record<string, number>;
  multiEnemyCount: { min: number; max: number };
}

// ─── Weighted random picker ──────────────────────────────

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Map Generation ──────────────────────────────────────

export function generateDungeonMap(config: CryptConfig): DungeonMap {
  const totalFloors = config.floors;
  const nodesPerFloor = config.nodesPerFloor;
  const floors: MapNode[][] = [];

  for (let f = 0; f < totalFloors; f++) {
    const floorNum = f + 1; // 1-indexed
    const overrideKey = `floor${floorNum}`;
    const override = config.overrides[overrideKey];

    // Determine how many nodes on this floor
    // Boss floor always has 1 node; first floor has 1 node
    const isBossFloor = override?.forced === 'boss';
    const isFirstFloor = override?.forced === 'battle';
    const nodeCount = (isBossFloor || isFirstFloor) ? 1 : nodesPerFloor;

    const nodes: MapNode[] = [];

    for (let n = 0; n < nodeCount; n++) {
      const nodeType = pickNodeType(floorNum, n, nodeCount, override, config);
      nodes.push({
        id: `f${floorNum}-n${n}`,
        floor: floorNum,
        index: n,
        type: nodeType,
        connections: [],
        visited: false,
        available: false,
      });
    }

    floors.push(nodes);
  }

  // Generate connections between floors
  generateConnections(floors);

  // Mark first floor nodes as available
  if (floors.length > 0) {
    for (const node of floors[0]) {
      node.available = true;
    }
  }

  return { floors, totalFloors };
}

function pickNodeType(
  _floorNum: number,
  nodeIndex: number,
  _nodeCount: number,
  override: FloorOverride | undefined,
  config: CryptConfig,
): NodeType {
  // Forced entire floor
  if (override?.forced) return override.forced;

  // Forced one node on this floor (the first one)
  if (override?.forced_one && nodeIndex === 0) return override.forced_one;

  // Elite chance override
  if (override?.elite_chance && Math.random() < override.elite_chance) {
    return 'elite';
  }

  // Normal weighted selection from config
  const weights = config.nodeTypeWeights;
  const types = Object.keys(weights) as NodeType[];
  const typeWeights = types.map((t) => weights[t] ?? 0);

  return weightedPick(types, typeWeights);
}

function generateConnections(floors: MapNode[][]): void {
  for (let f = 0; f < floors.length - 1; f++) {
    const current = floors[f];
    const next = floors[f + 1];

    if (next.length === 1) {
      // All current nodes connect to the single next node
      for (const node of current) {
        node.connections.push(next[0].id);
      }
      continue;
    }

    if (current.length === 1) {
      // Single node connects to all next nodes
      for (const nextNode of next) {
        current[0].connections.push(nextNode.id);
      }
      continue;
    }

    // Multiple to multiple: each node connects to 1-2 next nodes
    // Ensure every next node has at least one incoming connection
    const connected = new Set<string>();

    for (let n = 0; n < current.length; n++) {
      const node = current[n];
      // Connect to the same-index node in next floor
      const primaryIdx = Math.min(n, next.length - 1);
      node.connections.push(next[primaryIdx].id);
      connected.add(next[primaryIdx].id);

      // Randomly connect to an adjacent node
      if (Math.random() < 0.5 && next.length > 1) {
        const adjacentIdx = primaryIdx + (Math.random() < 0.5 ? 1 : -1);
        if (adjacentIdx >= 0 && adjacentIdx < next.length) {
          const adjId = next[adjacentIdx].id;
          if (!node.connections.includes(adjId)) {
            node.connections.push(adjId);
            connected.add(adjId);
          }
        }
      }
    }

    // Ensure all next nodes are reachable
    for (const nextNode of next) {
      if (!connected.has(nextNode.id)) {
        // Connect from a random current node
        const randomCurrent = current[Math.floor(Math.random() * current.length)];
        randomCurrent.connections.push(nextNode.id);
      }
    }
  }
}

// ─── Enemy selection for a floor ─────────────────────────

export function selectEnemiesForFloor(
  floorNum: number,
  config: CryptConfig,
  allEnemyDefs: Array<{ id: string; type: string }>,
): string[] {
  // Find the floor range
  const rangeKey = getFloorRange(floorNum);
  const encounterWeights = config.encounterWeightsByFloor[rangeKey];
  if (!encounterWeights) {
    // Fallback: first enemy
    return [allEnemyDefs[0]?.id ?? 'skeleton'];
  }

  const enemyIds = Object.keys(encounterWeights);
  const weights = enemyIds.map((id) => encounterWeights[id]);

  // Pick primary enemy
  const primaryId = weightedPick(enemyIds, weights);
  const result = [primaryId];

  // Multi-enemy chance
  const multiChance = config.multiEnemyChance[rangeKey] ?? 0;
  if (Math.random() < multiChance) {
    const count = config.multiEnemyCount.min +
      Math.floor(Math.random() * (config.multiEnemyCount.max - config.multiEnemyCount.min + 1));
    // Total enemies = count (includes primary)
    for (let i = result.length; i < count; i++) {
      result.push(weightedPick(enemyIds, weights));
    }
  }

  return result;
}

function getFloorRange(floor: number): string {
  if (floor <= 3) return '1-3';
  if (floor <= 6) return '4-6';
  return '7-9';
}

// ─── Reward calculation ──────────────────────────────────

interface EconomyConfig {
  battleGoldBase: { min: number; max: number };
  battleGoldFloorMultiplier: number;
  cardDropChance: number;
  cardDropRarityWeights: Record<string, number>;
  eliteGoldMultiplier: number;
  bossGoldMultiplier: number;
}

export function calculateBattleGold(
  floorNum: number,
  nodeType: NodeType,
  economy: EconomyConfig,
): number {
  const base = economy.battleGoldBase.min +
    Math.floor(Math.random() * (economy.battleGoldBase.max - economy.battleGoldBase.min + 1));
  const multiplied = Math.floor(base * Math.pow(economy.battleGoldFloorMultiplier, floorNum - 1));

  if (nodeType === 'elite') return Math.floor(multiplied * economy.eliteGoldMultiplier);
  if (nodeType === 'boss') return Math.floor(multiplied * economy.bossGoldMultiplier);
  return multiplied;
}

export function rollCardRewardRarity(
  economy: EconomyConfig,
  rarityBoost: number = 0,
): string | null {
  if (Math.random() > economy.cardDropChance) return null;

  const weights = { ...economy.cardDropRarityWeights };
  // Apply rarity boost (increase uncommon/rare chance)
  if (rarityBoost > 0 && weights['uncommon']) {
    weights['uncommon'] += rarityBoost * 100;
    weights['rare'] = (weights['rare'] ?? 0) + rarityBoost * 50;
  }

  const entries = Object.entries(weights);
  const rarities = entries.map(([r]) => r);
  const ws = entries.map(([, w]) => w);
  const result = weightedPick(rarities, ws);
  return result === 'none' ? null : result;
}
