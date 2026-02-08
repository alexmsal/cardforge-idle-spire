import { useState, useMemo } from 'react';
import { useGameState, calculateFoilGain, getEternalSlots } from '../hooks/useGameState';
import type { FoilUpgrades } from '../hooks/useGameState';
import { prestigeConfig, getCardById } from '../data/gameData';
import type { FoilUpgradeDef } from '../data/gameData';
import type { Card } from '../models';

type Tab = 'overview' | 'shop';

function toRoman(n: number): string {
  if (n <= 0) return '0';
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

export function ReforgeScreen() {
  const {
    foil,
    foilUpgrades,
    prestigeLevel,
    maxFloorReached,
    economyStats,
    eternalCardIds,
    ownedCardIds,
    buyFoilUpgrade,
    executeReforge,
  } = useGameState();

  const [tab, setTab] = useState<Tab>('overview');
  const [showReforgeFlow, setShowReforgeFlow] = useState(false);
  const [selectedEternals, setSelectedEternals] = useState<string[]>([...eternalCardIds]);
  const [showConfirm, setShowConfirm] = useState(false);

  const foilGain = calculateFoilGain(maxFloorReached, economyStats.totalBossKills);
  const eternalSlots = getEternalSlots(foilUpgrades);

  // Unique owned cards for eternal selection (exclude generators)
  const ownedUniqueCards = useMemo(() => {
    const seen = new Set<string>();
    const cards: Card[] = [];
    for (const id of ownedCardIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      const card = getCardById(id);
      if (card && card.type !== 'generator') cards.push(card);
    }
    return cards;
  }, [ownedCardIds]);

  const handleToggleEternal = (cardId: string) => {
    setSelectedEternals((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= eternalSlots) return prev;
      return [...prev, cardId];
    });
  };

  const handleConfirmReforge = () => {
    executeReforge(selectedEternals);
    setShowReforgeFlow(false);
    setShowConfirm(false);
    setSelectedEternals([]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-2.5 flex items-center gap-4 flex-shrink-0 bg-gray-900/80">
        <h2 className="text-lg font-bold text-amber-300">{'\u2728'} Reforge</h2>
        <div className="flex-1" />
        {prestigeLevel > 0 && (
          <span className="text-xs text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded font-mono">
            Prestige {toRoman(prestigeLevel)}
          </span>
        )}
        <div className="flex items-center gap-1.5" title="Foil — earned by Reforging. Spent on permanent upgrades in the Foil Shop.">
          <span className="text-amber-400 text-sm">{'\u2B50'}</span>
          <span className="font-mono text-amber-300 text-sm">{foil} Foil</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 flex gap-1">
        {(['overview', 'shop'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? 'text-amber-300 border-amber-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {t === 'overview' ? 'Cycle Overview' : 'Foil Shop'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-2xl mx-auto">
          {tab === 'overview' ? (
            <OverviewTab
              prestigeLevel={prestigeLevel}
              maxFloorReached={maxFloorReached}
              economyStats={economyStats}
              foilGain={foilGain}
              foil={foil}
              onStartReforge={() => {
                setSelectedEternals([...eternalCardIds]);
                setShowReforgeFlow(true);
              }}
            />
          ) : (
            <FoilShopTab foil={foil} foilUpgrades={foilUpgrades} onBuy={buyFoilUpgrade} />
          )}
        </div>
      </div>

      {/* Eternal card selection overlay */}
      {showReforgeFlow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-amber-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col">
            {!showConfirm ? (
              <>
                <h3 className="text-lg font-bold text-amber-300 mb-1">Choose Eternal Cards</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Select up to {eternalSlots} card{eternalSlots > 1 ? 's' : ''} to keep through reforge.
                  {selectedEternals.length}/{eternalSlots} selected.
                </p>

                <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 mb-4">
                  {ownedUniqueCards.map((card) => {
                    const isSelected = selectedEternals.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleToggleEternal(card.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-amber-900/30 border border-amber-600'
                            : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? 'text-amber-300' : 'text-gray-300'}`}>
                          {card.name}
                        </span>
                        <span className="text-[10px] text-gray-500 capitalize">{card.rarity}</span>
                        <span className="text-[10px] text-gray-500 capitalize">{card.type}</span>
                        <div className="flex-1" />
                        {isSelected && <span className="text-amber-400 text-xs">{'\u2713'}</span>}
                      </button>
                    );
                  })}
                  {ownedUniqueCards.length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-4">No cards to select.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
                  >
                    Continue to Reforge
                  </button>
                  <button
                    onClick={() => setShowReforgeFlow(false)}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-400 mb-3 text-center">Confirm Reforge</h3>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 mb-4 space-y-2">
                  <p className="text-sm text-red-300 font-medium">The following will be RESET:</p>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>All cards (except {selectedEternals.length} eternal)</li>
                    <li>Gold and Shards</li>
                    <li>Station levels (Anvil, Library, Portal)</li>
                    <li>Generators</li>
                    <li>Economy statistics</li>
                  </ul>
                </div>
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 mb-4 space-y-2">
                  <p className="text-sm text-amber-300 font-medium">You will GAIN:</p>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>+{foilGain} Foil (new total: {foil + foilGain})</li>
                    <li>Prestige Level {toRoman(prestigeLevel + 1)}</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmReforge}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/30"
                  >
                    REFORGE
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────

interface OverviewTabProps {
  prestigeLevel: number;
  maxFloorReached: number;
  economyStats: { totalGoldEarned: number; totalRunsCompleted: number; totalBossKills: number };
  foilGain: number;
  foil: number;
  onStartReforge: () => void;
}

function OverviewTab({ prestigeLevel, maxFloorReached, economyStats, foilGain, foil, onStartReforge }: OverviewTabProps) {
  const canReforge = economyStats.totalBossKills > 0;

  return (
    <div className="space-y-6">
      {/* Prestige badge */}
      {prestigeLevel > 0 && (
        <div className="text-center">
          <span className="text-4xl font-bold text-amber-400">{toRoman(prestigeLevel)}</span>
          <p className="text-xs text-gray-500 mt-1">Prestige Level</p>
        </div>
      )}

      {/* Current cycle stats */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Current Cycle</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Max Floor" value={`${maxFloorReached}/10`} />
          <StatCard label="Boss Kills" value={String(economyStats.totalBossKills)} />
          <StatCard label="Total Gold Earned" value={String(economyStats.totalGoldEarned)} />
          <StatCard label="Runs Completed" value={String(economyStats.totalRunsCompleted)} />
        </div>
      </div>

      {/* Foil preview */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-5">
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">Foil Preview</h3>
        <div className="flex items-center justify-center gap-6 mb-3">
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-300 font-mono">{foil}</span>
            <p className="text-[10px] text-gray-500">Current</p>
          </div>
          <span className="text-gray-600">+</span>
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-400 font-mono">{foilGain}</span>
            <p className="text-[10px] text-gray-500">Gain</p>
          </div>
          <span className="text-gray-600">=</span>
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-200 font-mono">{foil + foilGain}</span>
            <p className="text-[10px] text-gray-500">After Reforge</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 text-center">
          Formula: floor(max_floor^1.5 x (1 + boss_kills x 0.3))
        </p>
      </div>

      {/* Reforge button */}
      <div className="text-center">
        {canReforge ? (
          <button
            onClick={onStartReforge}
            className="px-10 py-4 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/40 text-lg uppercase tracking-wider"
          >
            {'\u2728'} Reforge {'\u2728'}
          </button>
        ) : (
          <div>
            <button
              disabled
              className="px-10 py-4 bg-gray-800 text-gray-600 font-bold rounded-xl cursor-not-allowed text-lg uppercase tracking-wider"
            >
              Reforge Locked
            </button>
            <p className="text-xs text-gray-600 mt-2">Defeat the Crypt Lord to unlock Reforge.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/60 rounded-lg px-4 py-3 text-center">
      <span className="text-lg font-mono font-bold text-white">{value}</span>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

// ─── Foil Shop Tab ──────────────────────────────────────

interface FoilShopTabProps {
  foil: number;
  foilUpgrades: FoilUpgrades;
  onBuy: (upgradeId: string) => boolean;
}

const FOIL_DESCRIPTIONS: Record<string, string> = {
  hp_boost: 'Start each dungeon run with 5 extra HP. Stacks up to 10 times (+50 HP total). Base starting HP is 75.',
  gold_boost: 'Earn 1 extra gold from every battle in the dungeon. Stacks up to 10 times.',
  start_card: 'Draw 1 additional card at the start of each turn. Base hand size is 5. Stacks up to 2 times (max 7 cards).',
  eternal_slot: 'Eternal cards survive Reforge and carry into your next cycle. This upgrade lets you designate one more card as Eternal. Stacks up to 2 times.',
};

function FoilShopTab({ foil, foilUpgrades, onBuy }: FoilShopTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <span className="text-amber-400 font-mono text-xl font-bold">{foil}</span>
        <span className="text-gray-400 text-sm ml-1">Foil available</span>
      </div>

      {prestigeConfig.foilUpgrades.map((upgrade: FoilUpgradeDef) => {
        const currentStacks = foilUpgrades[upgrade.id as keyof FoilUpgrades] ?? 0;
        const isMaxed = currentStacks >= upgrade.maxStacks;
        const canAfford = foil >= upgrade.cost && !isMaxed;

        return (
          <div
            key={upgrade.id}
            className={`border rounded-xl p-4 flex items-center gap-4 transition-colors ${
              isMaxed ? 'border-gray-700 bg-gray-800/30' : 'border-amber-800/50 bg-amber-900/10'
            }`}
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">{upgrade.name}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                {FOIL_DESCRIPTIONS[upgrade.id] ?? ''}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-gray-500">
                  {currentStacks}/{upgrade.maxStacks} stacks
                </span>
                {!isMaxed && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    {upgrade.cost} foil
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(currentStacks / upgrade.maxStacks) * 100}%` }}
                />
              </div>
            </div>

            {isMaxed ? (
              <span className="text-xs text-gray-600 font-medium px-3">MAX</span>
            ) : (
              <button
                onClick={() => onBuy(upgrade.id)}
                disabled={!canAfford}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canAfford
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                Buy
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
