import type { PendingReward } from '../../models/Dungeon';
import type { Card } from '../../models';

interface DungeonRewardScreenProps {
  reward: PendingReward;
  onPickCard: (card: Card) => void;
  onSkip: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-blue-500',
  rare: 'border-amber-500',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-800/50',
  uncommon: 'bg-blue-900/20',
  rare: 'bg-amber-900/20',
};

export function DungeonRewardScreen({ reward, onPickCard, onSkip }: DungeonRewardScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg w-full">
        {/* Header */}
        <h2 className="text-xl font-bold text-center mb-2">Victory!</h2>
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400">
            Turns: {reward.battleSummary.turnsElapsed} &middot;
            HP remaining: {reward.battleSummary.playerHpRemaining}
          </p>
        </div>

        {/* Gold */}
        {reward.gold > 0 && (
          <div className="text-center mb-6">
            <span className="text-yellow-400 font-bold text-lg">+{reward.gold} Gold</span>
          </div>
        )}

        {/* Card choices */}
        {reward.cardChoices.length > 0 && (
          <>
            <p className="text-sm text-gray-400 text-center mb-3">Choose a card to add to your deck:</p>
            <div className="flex gap-3 justify-center flex-wrap mb-4">
              {reward.cardChoices.map((card, i) => (
                <button
                  key={`${card.id}-${i}`}
                  onClick={() => onPickCard(card)}
                  className={`w-36 border-2 ${RARITY_BORDER[card.rarity] ?? 'border-gray-600'} ${RARITY_BG[card.rarity] ?? 'bg-gray-800'} rounded-lg p-3 hover:brightness-125 transition-all hover:scale-105 text-left`}
                >
                  <p className="text-sm font-bold text-white truncate">{card.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{card.rarity} {card.type}</p>
                  <p className="text-xs text-blue-400 mt-1">Cost: {card.cost}</p>
                  <div className="mt-1.5 space-y-0.5">
                    {card.effects.slice(0, 3).map((eff, j) => (
                      <p key={j} className="text-[10px] text-gray-300">
                        {eff.type}: {String(eff.value)}
                      </p>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={onSkip}
            className="px-6 py-2 text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-lg hover:border-gray-500"
          >
            {reward.cardChoices.length > 0 ? 'Skip Card' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
