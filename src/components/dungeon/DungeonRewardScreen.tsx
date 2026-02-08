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

function formatEffectShort(eff: { type: string; value: number | boolean }): string {
  const v = typeof eff.value === 'number' ? eff.value : '';
  switch (eff.type) {
    case 'damage': return `${v} dmg`;
    case 'damage_aoe': return `${v} AoE`;
    case 'block': return `${v} blk`;
    case 'heal': return `${v} heal`;
    case 'poison': return `${v} psn`;
    case 'poison_aoe': return `${v} psn AoE`;
    case 'poison_multiply': return `x${v} psn`;
    case 'poison_self': return `${v} self-psn`;
    case 'weakness': return `${v} weak`;
    case 'vulnerability': return `${v} vuln`;
    case 'vulnerability_self': return `${v} self-vuln`;
    case 'str': return `+${v} STR`;
    case 'str_per_turn': return `+${v} STR/t`;
    case 'dex': return `+${v} DEX`;
    case 'thorn': return `+${v} thorn`;
    case 'energy': return `+${v} energy`;
    case 'draw': return `draw ${v}`;
    case 'damage_self': return `-${v} self`;
    case 'damage_ramp': return `+${v}/play`;
    case 'damage_on_hit': return `${v} retl`;
    case 'block_retain': return 'retain blk';
    case 'corpse_explode': return 'explode';
    default: return `${eff.type}`;
  }
}

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
                        {formatEffectShort(eff)}
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
