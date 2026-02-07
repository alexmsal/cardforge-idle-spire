import type { StatusEffects } from '../models';

interface StatusBadgesProps {
  statuses: StatusEffects;
  compact?: boolean;
}

interface BadgeInfo {
  label: string;
  value: number | boolean;
  color: string;
  icon: string;
}

export function StatusBadges({ statuses, compact }: StatusBadgesProps) {
  const badges: BadgeInfo[] = [];

  if (statuses.poison > 0) badges.push({ label: 'Poison', value: statuses.poison, color: 'bg-green-700 text-green-200', icon: '\u2620' });
  if (statuses.weakness > 0) badges.push({ label: 'Weak', value: statuses.weakness, color: 'bg-yellow-800 text-yellow-200', icon: '\u25BC' });
  if (statuses.vulnerability > 0) badges.push({ label: 'Vuln', value: statuses.vulnerability, color: 'bg-orange-800 text-orange-200', icon: '\u25C6' });
  if (statuses.str > 0) badges.push({ label: 'STR', value: statuses.str, color: 'bg-red-800 text-red-200', icon: '\u2694' });
  if (statuses.dex > 0) badges.push({ label: 'DEX', value: statuses.dex, color: 'bg-blue-800 text-blue-200', icon: '\u26CA' });
  if (statuses.thorn > 0) badges.push({ label: 'Thorn', value: statuses.thorn, color: 'bg-amber-800 text-amber-200', icon: '\u2748' });
  if (statuses.strPerTurn > 0) badges.push({ label: 'STR/t', value: statuses.strPerTurn, color: 'bg-red-900 text-red-300', icon: '\u21E7' });
  if (statuses.blockRetain) badges.push({ label: 'Retain', value: true, color: 'bg-cyan-800 text-cyan-200', icon: '\u26E8' });
  if (statuses.corpseExplode) badges.push({ label: 'Explode', value: true, color: 'bg-purple-800 text-purple-200', icon: '\u2737' });

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'justify-center' : ''}`}>
      {badges.map((b) => (
        <span
          key={b.label}
          className={`${b.color} ${compact ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-xs'} rounded font-mono`}
          title={b.label}
        >
          {b.icon}{typeof b.value === 'number' ? b.value : ''}
        </span>
      ))}
    </div>
  );
}
