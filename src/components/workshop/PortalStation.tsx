import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRunState } from '../../hooks/useRunState';
import { useGameState } from '../../hooks/useGameState';
import { idleConfig, getCardById, generatorCards } from '../../data/gameData';
import { HelpTip } from '../Tooltip';
import { getGeneratorInfo, getGeneratorRates } from '../../engine/IdleEngine';

interface PortalStationProps {
  onBack: () => void;
}

export function PortalStation({ onBack }: PortalStationProps) {
  const { run, isRunActive, abandonRun } = useRunState();
  const { generators, installGenerator, removeGenerator, ownedCardIds, economyStats } = useGameState();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const now = Date.now();
  const rates = getGeneratorRates(generators, idleConfig.generatorDegradationPerDay, now);

  // Available generator cards in the player's collection (not yet installed)
  const availableGenerators = useMemo(() => {
    const installedIds = new Set(generators.map((g) => g.cardId));
    const counts = new Map<string, number>();
    for (const id of ownedCardIds) {
      const card = getCardById(id);
      if (card && card.type === 'generator' && !installedIds.has(id)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([id]) => getCardById(id)!).filter(Boolean);
  }, [ownedCardIds, generators]);

  const handleStartExpedition = () => {
    navigate('/dungeon');
  };

  const handleContinue = () => {
    navigate('/dungeon');
  };

  const handleAbandon = () => {
    abandonRun();
    setShowConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-2.5 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">&larr; Back</button>
        <h2 className="text-lg font-bold">{'\uD83C\uDF00'} Portal</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Runs: <span className="text-white font-mono">{economyStats.totalRunsCompleted}</span></span>
          <span>Boss Kills: <span className="text-white font-mono">{economyStats.totalBossKills}</span></span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Expedition panel */}
          <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-6 text-center">
            <span className="text-4xl block mb-3">{'\uD83C\uDF00'}</span>

            {isRunActive && run ? (
              <>
                <h3 className="text-xl font-bold text-purple-300 mb-2">Expedition in Progress</h3>
                <div className="space-y-1 mb-5">
                  <p className="text-sm text-gray-400">
                    Floor {run.currentFloor}/{run.map.totalFloors}
                  </p>
                  <p className="text-sm text-gray-400">
                    HP: {run.hp}/{run.maxHp}
                  </p>
                  <p className="text-sm text-gray-400">
                    Gold earned: {run.goldEarned}
                  </p>
                  <p className="text-sm text-gray-400">
                    Battles won: {run.battlesWon}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleContinue}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-600/30"
                  >
                    Continue Expedition
                  </button>

                  {!showConfirm ? (
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="w-full px-4 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Abandon Run
                    </button>
                  ) : (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                      <p className="text-xs text-red-400 mb-2">Are you sure? All progress will be lost.</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleAbandon}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                        >
                          Abandon
                        </button>
                        <button
                          onClick={() => setShowConfirm(false)}
                          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-purple-300 mb-2">The Crypt Awaits</h3>
                <p className="text-sm text-gray-400 mb-5">
                  Enter the dungeon and fight through 10 floors of enemies, events, and treasure.
                </p>
                <button
                  onClick={handleStartExpedition}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 text-lg"
                >
                  Start Expedition
                </button>
              </>
            )}
          </div>

          {/* Generators panel */}
          <div className="bg-gray-900 border border-cyan-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-1.5">
                {'\u2699\uFE0F'} Generators
                <HelpTip
                  text="Generators are special cards that produce resources passively while you're away. They're the core of idle progression — the more generators you have, the faster you earn resources offline."
                  position="bottom"
                />
              </h3>
              {(rates.goldPerMin > 0 || rates.shardsPerMin > 0) && (
                <div className="flex items-center gap-3 text-xs">
                  {rates.goldPerMin > 0 && (
                    <span className="text-yellow-400 font-mono">+{rates.goldPerMin.toFixed(1)} G/min</span>
                  )}
                  {rates.shardsPerMin > 0 && (
                    <span className="text-cyan-400 font-mono">+{rates.shardsPerMin.toFixed(1)} {'\u2B50'}/min</span>
                  )}
                </div>
              )}
            </div>

            {generators.length === 0 && availableGenerators.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">No generators owned yet</p>
                <div className="grid gap-2">
                  {generatorCards.map((card) => {
                    const goldEff = card.effects.find((e) => e.type === 'generate_gold');
                    const shardEff = card.effects.find((e) => e.type === 'generate_shards');
                    const rateParts: string[] = [];
                    if (goldEff) rateParts.push(`${goldEff.value} Gold/min`);
                    if (shardEff) rateParts.push(`${shardEff.value} Shard/min`);

                    return (
                      <div
                        key={card.id}
                        className="bg-gray-800/40 border border-gray-700/60 rounded-lg p-3 flex items-center gap-3 opacity-50"
                      >
                        <span className="text-xl text-gray-600 w-8 text-center flex-shrink-0">{'\uD83D\uDD12'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400">{card.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                              card.rarity === 'rare' ? 'bg-amber-900/40 text-amber-500'
                                : card.rarity === 'uncommon' ? 'bg-blue-900/40 text-blue-400'
                                : 'bg-gray-700/60 text-gray-500'
                            }`}>
                              {card.rarity}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Generates {rateParts.join(' + ')} while idle
                          </p>
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            {'\uD83D\uDD13'} Craft at Anvil (Lv2) or find in dungeon chests
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                  Upgrade the Anvil to Lv2 to unlock crafting, or find rare generator cards in dungeon chests.
                </p>
              </div>
            )}

            {/* Installed generators */}
            {generators.length > 0 && (
              <div className="space-y-2 mb-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Installed</span>
                {generators.map((gen) => {
                  const info = getGeneratorInfo(gen, idleConfig.generatorDegradationPerDay, now);
                  if (!info.card) return null;
                  const effPercent = Math.round(info.efficiency * 100);

                  return (
                    <div
                      key={gen.cardId + '-' + gen.installedAt}
                      className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{info.card.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            effPercent > 50 ? 'bg-green-900/40 text-green-400'
                              : effPercent > 20 ? 'bg-yellow-900/40 text-yellow-400'
                              : 'bg-red-900/40 text-red-400'
                          }`}>
                            {effPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                          {info.goldPerMin > 0 && <span className="text-yellow-500">+{info.goldPerMin.toFixed(1)} G/min</span>}
                          {info.shardsPerMin > 0 && <span className="text-cyan-500">+{info.shardsPerMin.toFixed(1)} {'\u2B50'}/min</span>}
                          <span>{info.daysRemaining.toFixed(1)}d remaining</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeGenerator(gen.cardId)}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1"
                        title="Remove generator"
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available to install */}
            {availableGenerators.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Available to Install</span>
                {availableGenerators.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-300">{card.name}</span>
                      <p className="text-[10px] text-gray-500 capitalize">{card.rarity}</p>
                    </div>
                    <button
                      onClick={() => installGenerator(card.id)}
                      className="text-xs px-3 py-1.5 bg-cyan-800 hover:bg-cyan-700 text-cyan-200 rounded-lg transition-colors"
                    >
                      Install
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <p className="text-[10px] text-gray-600 mt-4">
              Generators produce resources while idle. Efficiency degrades {Math.round(idleConfig.generatorDegradationPerDay * 100)}% per day.
              Offline earnings are {Math.round(idleConfig.offlineRewardMultiplier * 100)}% of online rate (max {idleConfig.maxOfflineHours}h).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
