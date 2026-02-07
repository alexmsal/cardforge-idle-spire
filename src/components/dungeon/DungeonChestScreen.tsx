import type { ChestReward } from '../../models/Dungeon';

interface DungeonChestScreenProps {
  reward: ChestReward;
  onCollect: (takeCard: boolean) => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-blue-500',
  rare: 'border-amber-500',
};

export function DungeonChestScreen({ reward, onCollect }: DungeonChestScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-yellow-800/50 rounded-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-3xl">{'\uD83D\uDCE6'}</span>
          <h2 className="text-xl font-bold text-yellow-300 mt-2">Treasure Chest</h2>
        </div>

        {/* Gold */}
        <div className="text-center mb-4">
          <span className="text-yellow-400 font-bold text-lg">+{reward.gold} Gold</span>
        </div>

        {/* Card */}
        {reward.card && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 text-center mb-2">You also find a card:</p>
            <div className={`border-2 ${RARITY_BORDER[reward.card.rarity] ?? 'border-gray-600'} rounded-lg p-4 bg-gray-800/60 mx-auto max-w-[200px]`}>
              <p className="text-sm font-bold text-white">{reward.card.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{reward.card.rarity} {reward.card.type}</p>
              <p className="text-xs text-blue-400 mt-1">Cost: {reward.card.cost}</p>
              <div className="mt-1.5 space-y-0.5">
                {reward.card.effects.slice(0, 3).map((eff, j) => (
                  <p key={j} className="text-[10px] text-gray-300">
                    {eff.type}: {String(eff.value)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {reward.card && (
            <button
              onClick={() => onCollect(true)}
              className="px-6 py-2 text-sm bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              Take Card + Gold
            </button>
          )}
          <button
            onClick={() => onCollect(false)}
            className={`px-6 py-2 text-sm rounded-lg transition-colors ${
              reward.card
                ? 'text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500'
                : 'bg-yellow-700 hover:bg-yellow-600 text-white'
            }`}
          >
            {reward.card ? 'Gold Only' : 'Collect Gold'}
          </button>
        </div>
      </div>
    </div>
  );
}
