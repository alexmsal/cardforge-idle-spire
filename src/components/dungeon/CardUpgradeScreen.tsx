import { getCardById } from '../../data/gameData';
import type { Card } from '../../models';

interface CardUpgradeScreenProps {
  deckCardIds: string[];
  onUpgrade: (cardId: string) => void;
  onCancel: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-blue-600',
  rare: 'border-amber-600',
};

function getUpgradePreview(card: Card): string | null {
  if (!card.upgrade) return null;
  const level1 = card.upgrade['1'];
  if (!level1) return null;
  return Object.entries(level1)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => {
      switch (k) {
        case 'damage': return `${v} dmg`;
        case 'damage_aoe': return `${v} AoE dmg`;
        case 'block': return `${v} block`;
        case 'heal': return `${v} heal`;
        case 'poison': return `${v} poison`;
        case 'poison_aoe': return `${v} AoE psn`;
        case 'poison_multiply': return `x${v} poison`;
        case 'poison_self': return `${v} self-psn`;
        case 'weakness': return `${v} weakness`;
        case 'vulnerability': return `${v} vuln`;
        case 'vulnerability_self': return `${v} self-vuln`;
        case 'str': return `+${v} STR`;
        case 'str_per_turn': return `+${v} STR/turn`;
        case 'dex': return `+${v} DEX`;
        case 'thorn': return `+${v} thorn`;
        case 'draw': return `draw ${v}`;
        case 'energy': return `+${v} energy`;
        case 'damage_self': return `-${v} self-dmg`;
        case 'damage_ramp': return `+${v}/play`;
        case 'damage_on_hit': return `${v} retaliation`;
        case 'block_retain': return 'Retain Block';
        case 'corpse_explode': return 'Corpse Explode';
        default: return `${k}: ${v}`;
      }
    }).join(', ');
}

function getEffectSummary(card: Card): string {
  return card.effects.map((e) => {
    const val = typeof e.value === 'number' ? e.value : '';
    switch (e.type) {
      case 'damage': return `${val} dmg`;
      case 'damage_aoe': return `${val} AoE`;
      case 'block': return `${val} blk`;
      case 'heal': return `${val} heal`;
      case 'poison': return `${val} psn`;
      case 'poison_aoe': return `${val} psn AoE`;
      case 'poison_multiply': return `x${val} psn`;
      case 'poison_self': return `${val} self-psn`;
      case 'weakness': return `${val} weak`;
      case 'vulnerability': return `${val} vuln`;
      case 'vulnerability_self': return `${val} self-vuln`;
      case 'str': return `+${val} STR`;
      case 'str_per_turn': return `+${val} STR/t`;
      case 'dex': return `+${val} DEX`;
      case 'thorn': return `+${val} thorn`;
      case 'energy': return `+${val} energy`;
      case 'draw': return `draw ${val}`;
      case 'damage_self': return `-${val} self`;
      case 'damage_ramp': return `+${val}/play`;
      case 'damage_on_hit': return `${val} retl`;
      case 'block_retain': return 'retain blk';
      case 'corpse_explode': return 'explode';
      default: return e.type;
    }
  }).join(', ');
}

export function CardUpgradeScreen({ deckCardIds, onUpgrade, onCancel }: CardUpgradeScreenProps) {
  const cardCounts = new Map<string, number>();
  for (const id of deckCardIds) {
    cardCounts.set(id, (cardCounts.get(id) ?? 0) + 1);
  }

  const uniqueCards = [...cardCounts.entries()]
    .map(([id, count]) => ({ card: getCardById(id), id, count }))
    .filter((c) => c.card !== undefined)
    .sort((a, b) => a.card!.name.localeCompare(b.card!.name));

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-amber-800/50 rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">{'\u2692\uFE0F'}</div>
          <h2 className="text-lg font-bold text-amber-300">Upgrade a Card</h2>
          <p className="text-xs text-gray-500">Select a card to upgrade by +1 level</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {uniqueCards.map(({ card, id, count }) => {
            const preview = getUpgradePreview(card!);
            const hasUpgrade = preview !== null;
            return (
              <button
                key={id}
                onClick={() => onUpgrade(id)}
                disabled={!hasUpgrade}
                className={`w-full text-left p-2.5 rounded border ${RARITY_BORDER[card!.rarity] ?? 'border-gray-700'}
                  ${hasUpgrade
                    ? 'bg-gray-800/60 hover:bg-amber-900/20 hover:border-amber-500 cursor-pointer'
                    : 'bg-gray-800/30 opacity-50 cursor-not-allowed'
                  } transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{card!.name}</span>
                      <span className="text-[10px] text-gray-500 capitalize">{card!.type}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Current: {getEffectSummary(card!)}
                    </p>
                    {hasUpgrade && (
                      <p className="text-[10px] text-amber-400 mt-0.5">
                        {'\u2B06'} Upgraded: {preview}
                      </p>
                    )}
                    {!hasUpgrade && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Max level
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {count > 1 && (
                      <span className="text-xs text-gray-500">x{count}</span>
                    )}
                    <span className="text-xs text-blue-400">{card!.cost}E</span>
                  </div>
                </div>
              </button>
            );
          })}
          {uniqueCards.length === 0 && (
            <p className="text-sm text-gray-600 italic text-center py-4">
              No cards in deck to upgrade
            </p>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
