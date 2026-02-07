import type { Card } from '../models';

interface CardDetailModalProps {
  card: Card;
  onClose: () => void;
}

const RARITY_COLOR: Record<string, string> = {
  common: 'border-gray-500 text-gray-300',
  uncommon: 'border-emerald-500 text-emerald-400',
  rare: 'border-blue-500 text-blue-400',
};

const TYPE_COLOR: Record<string, string> = {
  attack: 'text-red-400',
  defense: 'text-sky-400',
  skill: 'text-yellow-400',
  reaction: 'text-purple-400',
};

function formatEffectDetail(e: { type: string; value: number | boolean; target: string; duration?: string; note?: string; hits?: number }): string {
  const val = typeof e.value === 'number' ? e.value : '';
  let text = '';
  switch (e.type) {
    case 'damage': text = `Deal ${val} damage`; break;
    case 'damage_aoe': text = `Deal ${val} damage to ALL enemies`; break;
    case 'block': text = `Gain ${val} block`; break;
    case 'heal': text = `Heal ${val} HP`; break;
    case 'poison': text = `Apply ${val} Poison`; break;
    case 'poison_aoe': text = `Apply ${val} Poison to ALL enemies`; break;
    case 'poison_multiply': text = `Multiply enemy Poison by ${val}`; break;
    case 'weakness': text = `Apply ${val} Weakness`; break;
    case 'vulnerability': text = `Apply ${val} Vulnerability`; break;
    case 'vulnerability_self': text = `Gain ${val} Vulnerability`; break;
    case 'str': text = `Gain ${val} STR`; break;
    case 'dex': text = `Gain ${val} DEX`; break;
    case 'thorn': text = `Gain ${val} Thorn`; break;
    case 'energy': text = `Gain ${val} energy`; break;
    case 'draw': text = `Draw ${val} card(s)`; break;
    case 'damage_self': text = `Take ${val} self-damage`; break;
    case 'damage_ramp': text = `+${val} damage each play this combat`; break;
    case 'str_per_turn': text = `Gain ${val} STR each turn`; break;
    case 'block_retain': text = `Block no longer decays`; break;
    case 'corpse_explode': text = `Enemy explodes on death for max HP damage`; break;
    case 'damage_on_hit': text = `${val} retaliation damage`; break;
    default: text = `${e.type}: ${val}`;
  }
  if (e.duration === 'turn') text += ' (this turn)';
  if (e.duration === 'combat') text += ' (this combat)';
  if (e.target === 'self') text += ' [self]';
  else if (e.target === 'all_enemies') text += ' [all enemies]';
  if (e.note) text += ` — ${e.note}`;
  return text;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const rarityStyle = RARITY_COLOR[card.rarity] || RARITY_COLOR.common;
  const typeColor = TYPE_COLOR[card.type] || 'text-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-96 rounded-xl border-2 ${rarityStyle.split(' ')[0]} bg-gray-900 p-5 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold">{card.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs uppercase ${typeColor}`}>{card.type}</span>
              <span className={`text-xs uppercase ${rarityStyle.split(' ')[1]}`}>{card.rarity}</span>
              <span className="text-xs text-gray-500">{card.archetype}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold border border-blue-400 flex-shrink-0">
            {card.cost}
          </div>
        </div>

        {/* Keywords */}
        {card.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.keywords.map((kw) => (
              <span key={kw} className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{kw}</span>
            ))}
          </div>
        )}

        {/* Effects */}
        <div className="bg-gray-800 rounded-lg p-3 mb-3 space-y-1.5">
          {card.effects.map((e, i) => (
            <p key={i} className="text-sm text-gray-200">
              {formatEffectDetail(e)}
            </p>
          ))}
        </div>

        {card.exhaust && (
          <p className="text-xs text-red-400 mb-3">Exhausts after use</p>
        )}

        {/* PP Budget */}
        {card.ppCalc && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">PP Budget</p>
            <p className="text-xs text-gray-400">{card.ppCalc}</p>
            <p className="text-xs text-gray-500">Total: {card.ppTotal} PP</p>
          </div>
        )}

        {/* Upgrades */}
        {card.upgrade && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Upgrades</p>
            <div className="space-y-0.5">
              {Object.entries(card.upgrade).map(([level, stats]) => (
                <p key={level} className="text-xs text-gray-400">
                  <span className="text-amber-500 font-bold">+{level}</span>{' '}
                  {Object.entries(stats)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')}
                  {stats._bonus ? ` (${stats._bonus})` : ''}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Design note */}
        {card.designNote && (
          <p className="text-[10px] text-gray-600 italic">{card.designNote}</p>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-3 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
