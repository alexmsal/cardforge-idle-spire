import { useState } from 'react';
import type { ReactNode } from 'react';

// ─── Keyword / status descriptions ──────────────────────

const KEYWORD_DESCRIPTIONS: Record<string, string> = {
  poison: 'Deals damage at start of enemy turn, then decreases by 1.',
  burn: 'Deals damage at start of enemy turn.',
  thorn: 'Reflects damage back to the attacker when hit.',
  weakness: 'Reduces attack damage dealt by 25%.',
  vulnerability: 'Increases damage received by 50%.',
  strength: 'Increases attack damage dealt by the STR amount.',
  str: 'Increases attack damage dealt by the STR amount.',
  dexterity: 'Increases block gained by the DEX amount.',
  dex: 'Increases block gained by the DEX amount.',
  block: 'Absorbs incoming damage. Decays at the start of your turn.',
  exhaust: 'Card is removed from the battle after playing.',
  ramp: 'Gains bonus damage each time it is played in the same combat.',
  energy: 'Resets to 3 each turn. Cards cost energy to play.',
  generator: 'Produces resources over time while idle. Efficiency degrades daily.',
  common: 'Basic card. Power Budget: ~4 PP.',
  uncommon: 'Stronger card. Power Budget: ~7 PP.',
  rare: 'Powerful card. Power Budget: ~11 PP.',
  attack: 'Deals damage to enemies.',
  defense: 'Grants block to absorb damage.',
  skill: 'Applies buffs, debuffs, or special effects.',
};

export function getKeywordDescription(keyword: string): string | undefined {
  return KEYWORD_DESCRIPTIONS[keyword.toLowerCase()];
}

// ─── Tooltip wrapper ────────────────────────────────────

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={`absolute z-50 px-2.5 py-1.5 text-[11px] text-gray-200 bg-gray-800 border border-gray-700 rounded-lg shadow-xl whitespace-normal max-w-[200px] leading-snug pointer-events-none ${positionClasses[position]}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Help icon with tooltip ─────────────────────────────

interface HelpTipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTip({ text, position = 'top' }: HelpTipProps) {
  return (
    <Tooltip text={text} position={position}>
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] rounded-full border border-gray-600 text-gray-500 cursor-help hover:text-gray-300 hover:border-gray-400 transition-colors">
        ?
      </span>
    </Tooltip>
  );
}

// ─── Keyword tooltip (inline text) ──────────────────────

interface KeywordTooltipProps {
  keyword: string;
  children?: ReactNode;
}

export function KeywordTooltip({ keyword, children }: KeywordTooltipProps) {
  const desc = getKeywordDescription(keyword);
  if (!desc) return <span>{children ?? keyword}</span>;

  return (
    <Tooltip text={desc} position="top">
      <span className="border-b border-dotted border-gray-500 cursor-help">
        {children ?? keyword}
      </span>
    </Tooltip>
  );
}
