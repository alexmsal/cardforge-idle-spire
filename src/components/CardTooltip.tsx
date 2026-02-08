import { useState, useRef, useEffect } from 'react';
import type { Card } from '../models';
import { getKeywordDescription } from './Tooltip';

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-emerald-500',
  rare: 'border-blue-500',
};

const TYPE_COLOR: Record<string, string> = {
  attack: 'text-red-400',
  defense: 'text-sky-400',
  skill: 'text-yellow-400',
  reaction: 'text-purple-400',
};

function formatEffect(e: { type: string; value: number | boolean; target: string; duration?: string }): string {
  const val = typeof e.value === 'number' ? e.value : '';
  switch (e.type) {
    case 'damage': return `Deal ${val} damage`;
    case 'damage_aoe': return `${val} damage to ALL`;
    case 'block': return `Gain ${val} block`;
    case 'heal': return `Heal ${val} HP`;
    case 'poison': return `Apply ${val} Poison`;
    case 'poison_aoe': return `${val} Poison to ALL`;
    case 'poison_multiply': return `Multiply Poison x${val}`;
    case 'poison_self': return `Apply ${val} Poison to self`;
    case 'weakness': return `Apply ${val} Weakness`;
    case 'vulnerability': return `Apply ${val} Vulnerability`;
    case 'vulnerability_self': return `Gain ${val} Vulnerability`;
    case 'str': return `+${val} STR`;
    case 'str_per_turn': return `+${val} STR/turn`;
    case 'dex': return `+${val} DEX`;
    case 'thorn': return `+${val} Thorn`;
    case 'energy': return `+${val} energy`;
    case 'draw': return `Draw ${val}`;
    case 'damage_self': return `${val} self-damage`;
    case 'damage_ramp': return `+${val} dmg/play`;
    case 'damage_on_hit': return `${val} retaliation`;
    case 'block_retain': return 'Retain Block';
    case 'corpse_explode': return 'Corpse Explode';
    default: return `${e.type}: ${val}`;
  }
}

interface CardTooltipProps {
  card: Card;
  children: React.ReactNode;
}

export function CardTooltip({ card, children }: CardTooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = () => {
    // Use the first child element for positioning since the wrapper uses display:contents
    const el = wrapRef.current?.children[0] as HTMLElement | undefined;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const x = spaceRight > 280 ? rect.right + 8 : rect.left - 268;
    const y = Math.min(rect.top, window.innerHeight - 300);
    setPos({ x, y });
    timerRef.current = setTimeout(() => setShow(true), 300);
  };

  const handleLeave = () => {
    clearTimeout(timerRef.current);
    setShow(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const border = RARITY_BORDER[card.rarity] ?? 'border-gray-600';
  const typeColor = TYPE_COLOR[card.type] ?? 'text-gray-400';

  return (
    <div ref={wrapRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="contents">
      {children}
      {show && (
        <div
          className={`fixed z-[60] w-64 bg-gray-900 border-2 ${border} rounded-xl p-4 shadow-2xl pointer-events-none`}
          style={{ left: pos.x, top: pos.y }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-white">{card.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] uppercase font-medium ${typeColor}`}>{card.type}</span>
                <span className="text-[10px] text-gray-500 capitalize">{card.rarity}</span>
                <span className="text-[10px] text-gray-600 capitalize">{card.archetype}</span>
              </div>
            </div>
            <span className="w-6 h-6 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 border border-blue-400">
              {card.cost}
            </span>
          </div>

          {/* Keywords */}
          {card.keywords.length > 0 && (
            <div className="mb-2 space-y-1">
              {card.keywords.map((kw) => {
                const desc = getKeywordDescription(kw);
                return (
                  <div key={kw}>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{kw}</span>
                    {desc && <p className="text-[9px] text-gray-500 mt-0.5 leading-snug">{desc}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Effects */}
          <div className="bg-gray-800/80 rounded-lg p-2 space-y-1">
            {card.effects.map((e, i) => (
              <p key={i} className="text-[11px] text-gray-200 leading-relaxed">{formatEffect(e)}</p>
            ))}
          </div>

          {card.exhaust && (
            <p className="text-[10px] text-red-400 mt-1.5">Exhausts after use</p>
          )}
        </div>
      )}
    </div>
  );
}
