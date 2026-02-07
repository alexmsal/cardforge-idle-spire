import { useState } from 'react';
import { useGameState, getStationUpgradeCost } from '../../hooks/useGameState';
import type { StationLevels } from '../../hooks/useGameState';
import { stationsConfig } from '../../data/gameData';
import { AnvilStation } from './AnvilStation';
import { LibraryStation } from './LibraryStation';
import { PortalStation } from './PortalStation';

type StationView = 'hub' | 'anvil' | 'library' | 'portal';

const STATION_ICONS: Record<string, string> = {
  anvil: '\u2692\uFE0F',
  library: '\uD83D\uDCDA',
  portal: '\uD83C\uDF00',
};

const STATION_COLORS: Record<string, { border: string; bg: string; glow: string }> = {
  anvil: { border: 'border-orange-600', bg: 'bg-orange-900/20', glow: 'hover:shadow-orange-600/20' },
  library: { border: 'border-blue-600', bg: 'bg-blue-900/20', glow: 'hover:shadow-blue-600/20' },
  portal: { border: 'border-purple-600', bg: 'bg-purple-900/20', glow: 'hover:shadow-purple-600/20' },
};

export function WorkshopScreen() {
  const { gold, shards, stationLevels, upgradeStation } = useGameState();
  const [view, setView] = useState<StationView>('hub');

  if (view === 'anvil') {
    return <AnvilStation onBack={() => setView('hub')} />;
  }
  if (view === 'library') {
    return <LibraryStation onBack={() => setView('hub')} />;
  }
  if (view === 'portal') {
    return <PortalStation onBack={() => setView('hub')} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar: resources */}
      <div className="border-b border-gray-800 px-6 py-2.5 flex items-center gap-6 flex-shrink-0 bg-gray-900/80">
        <h2 className="text-lg font-bold">Workshop</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-500 text-sm">G</span>
          <span className="font-mono text-yellow-300 text-sm">{gold}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-500 text-sm">{'\u2B50'}</span>
          <span className="font-mono text-cyan-300 text-sm">{shards}</span>
        </div>
      </div>

      {/* Station panels */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-3 gap-6 max-w-3xl w-full">
          {(['anvil', 'library', 'portal'] as const).map((stationId) => {
            const cfg = stationsConfig[stationId];
            if (!cfg) return null;
            const level = stationLevels[stationId];
            const upgradeCost = getStationUpgradeCost(stationId, level);
            const isMaxLevel = level >= cfg.maxLevel;
            const canAfford = gold >= upgradeCost;
            const colors = STATION_COLORS[stationId];

            return (
              <div
                key={stationId}
                className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-6 flex flex-col items-center transition-all hover:shadow-lg ${colors.glow}`}
              >
                {/* Icon + name */}
                <span className="text-4xl mb-3">{STATION_ICONS[stationId]}</span>
                <h3 className="text-lg font-bold text-white mb-1">{cfg.name}</h3>

                {/* Level */}
                <span className="text-xs text-gray-400 mb-3">
                  Level {level}/{cfg.maxLevel}
                </span>

                {/* Description */}
                <p className="text-[11px] text-gray-500 text-center mb-4 leading-relaxed">
                  {cfg.perLevel}
                </p>

                {/* Station info */}
                <StationInfo stationId={stationId} level={level} />

                {/* Actions */}
                <div className="mt-auto pt-4 space-y-2 w-full">
                  <button
                    onClick={() => setView(stationId)}
                    className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Open
                  </button>
                  {!isMaxLevel && (
                    <button
                      onClick={() => upgradeStation(stationId)}
                      disabled={!canAfford}
                      className={`w-full px-4 py-1.5 text-xs rounded-lg transition-colors border ${
                        canAfford
                          ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/20'
                          : 'border-gray-700 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      Upgrade &middot; {upgradeCost}G
                    </button>
                  )}
                  {isMaxLevel && (
                    <span className="block text-center text-[10px] text-gray-600">MAX LEVEL</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StationInfo({ stationId, level }: { stationId: keyof StationLevels; level: number }) {
  const { ownedCardIds, libraryCapacity } = useGameState();

  switch (stationId) {
    case 'library': {
      const uniqueIds = new Set(ownedCardIds);
      return (
        <span className="text-xs text-gray-400">
          {uniqueIds.size}/{libraryCapacity} unique cards
        </span>
      );
    }
    case 'anvil':
      return (
        <span className="text-xs text-gray-400">
          {level >= 2 ? 'Crafting unlocked' : 'Craft unlocks at Lv2'}
        </span>
      );
    case 'portal':
      return (
        <span className="text-xs text-gray-400">
          Speed x{[1, 2, 4, 100][Math.min(level - 1, 3)]}
        </span>
      );
    default:
      return null;
  }
}
