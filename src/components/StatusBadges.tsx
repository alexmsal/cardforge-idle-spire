import type { StatusEffects } from '../models';
import { Tooltip } from './Tooltip';

interface StatusBadgesProps {
  statuses: StatusEffects;
  compact?: boolean;
}

interface BadgeInfo {
  label: string;
  keyword: string;
  value: number | boolean;
  color: string;
  icon: string;
  tip: string;
}

export function StatusBadges({ statuses, compact }: StatusBadgesProps) {
  const badges: BadgeInfo[] = [];

  if (statuses.poison > 0) badges.push({ label: 'Poison', keyword: 'poison', value: statuses.poison, color: 'bg-green-700 text-green-200', icon: '\u2620', tip: 'Deals damage at start of turn, then decreases by 1.' });
  if (statuses.weakness > 0) badges.push({ label: 'Weak', keyword: 'weakness', value: statuses.weakness, color: 'bg-yellow-800 text-yellow-200', icon: '\u25BC', tip: 'Reduces attack damage dealt by 25%.' });
  if (statuses.vulnerability > 0) badges.push({ label: 'Vuln', keyword: 'vulnerability', value: statuses.vulnerability, color: 'bg-orange-800 text-orange-200', icon: '\u25C6', tip: 'Increases damage received by 50%.' });
  if (statuses.str > 0) badges.push({ label: 'STR', keyword: 'str', value: statuses.str, color: 'bg-red-800 text-red-200', icon: '\u2694', tip: 'Increases attack damage dealt.' });
  if (statuses.dex > 0) badges.push({ label: 'DEX', keyword: 'dex', value: statuses.dex, color: 'bg-blue-800 text-blue-200', icon: '\u26CA', tip: 'Increases block gained.' });
  if (statuses.thorn > 0) badges.push({ label: 'Thorn', keyword: 'thorn', value: statuses.thorn, color: 'bg-amber-800 text-amber-200', icon: '\u2748', tip: 'Reflects damage back to attacker when hit.' });
  if (statuses.strPerTurn > 0) badges.push({ label: 'STR/t', keyword: 'str', value: statuses.strPerTurn, color: 'bg-red-900 text-red-300', icon: '\u21E7', tip: 'Gains STR at the start of each turn.' });
  if (statuses.blockRetain) badges.push({ label: 'Retain', keyword: 'block', value: true, color: 'bg-cyan-800 text-cyan-200', icon: '\u26E8', tip: 'Block is retained between turns instead of decaying.' });
  if (statuses.corpseExplode) badges.push({ label: 'Explode', keyword: 'skill', value: true, color: 'bg-purple-800 text-purple-200', icon: '\u2737', tip: 'When an enemy dies, deals its max HP as AoE damage.' });

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'justify-center' : ''}`}>
      {badges.map((b) => (
        <Tooltip key={b.label} text={b.tip} position="top">
          <span
            className={`${b.color} ${compact ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-xs'} rounded font-mono cursor-help`}
          >
            {b.icon}{typeof b.value === 'number' ? b.value : ''}
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
