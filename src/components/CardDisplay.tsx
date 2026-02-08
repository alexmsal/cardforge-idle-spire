import type { CardInstance } from '../models';
import { KeywordTooltip } from './Tooltip';

interface CardDisplayProps {
  cardInstance: CardInstance;
  isPlaying?: boolean;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-emerald-500',
  rare: 'border-blue-500',
};

const RARITY_GLOW: Record<string, string> = {
  common: '',
  uncommon: 'shadow-emerald-500/20',
  rare: 'shadow-blue-500/30',
};

const TYPE_COLOR: Record<string, string> = {
  attack: 'text-red-400',
  defense: 'text-sky-400',
  skill: 'text-yellow-400',
  reaction: 'text-purple-400',
};

function getEffectSummary(card: CardInstance['card']): string {
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
      case 'damage_self': return `-${val} HP self`;
      case 'damage_ramp': return `+${val}/play`;
      case 'damage_on_hit': return `${val} retl`;
      case 'block_retain': return 'Retain Block';
      case 'corpse_explode': return 'explode';
      default: return e.type;
    }
  }).join(', ');
}

export function CardDisplay({ cardInstance, isPlaying }: CardDisplayProps) {
  const { card } = cardInstance;
  const border = RARITY_BORDER[card.rarity] || 'border-gray-500';
  const glow = RARITY_GLOW[card.rarity] || '';
  const typeColor = TYPE_COLOR[card.type] || 'text-gray-400';

  return (
    <div
      className={`
        relative w-28 h-40 rounded-lg border-2 ${border}
        bg-gray-800 p-2 flex flex-col
        shadow-lg ${glow}
        ${isPlaying ? 'ring-2 ring-yellow-400 scale-105' : 'hover:scale-102'}
        transition-all duration-200
      `}
    >
      {/* Cost orb */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold border border-blue-400 shadow">
        {card.cost}
      </div>

      {/* Name */}
      <p className="text-[11px] font-semibold text-white mt-2 leading-tight truncate">{card.name}</p>

      {/* Type line */}
      <p className={`text-[9px] ${typeColor} uppercase tracking-wider mt-0.5`}>{card.type}</p>

      {/* Divider */}
      <div className={`border-t ${border} my-1 opacity-50`} />

      {/* Effect text */}
      <p className="text-[9px] text-gray-300 leading-tight flex-1">
        {getEffectSummary(card)}
      </p>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-auto">
          {card.keywords.map((kw) => (
            <KeywordTooltip key={kw} keyword={kw}>
              <span className="text-[8px] px-1 py-0 rounded bg-gray-700 text-gray-400 cursor-help">{kw}</span>
            </KeywordTooltip>
          ))}
        </div>
      )}

      {/* Exhaust indicator */}
      {card.exhaust && (
        <KeywordTooltip keyword="exhaust">
          <span className="absolute -bottom-1 -right-1 text-[8px] px-1 rounded bg-red-900 text-red-300 border border-red-700 cursor-help">
            exhaust
          </span>
        </KeywordTooltip>
      )}
    </div>
  );
}
