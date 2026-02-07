import type { EnemyInstance, EnemyPatternEntry } from '../models';
import { HpBar } from './HpBar';
import { StatusBadges } from './StatusBadges';

interface EnemyDisplayProps {
  enemy: EnemyInstance;
}

function getIntent(enemy: EnemyInstance): EnemyPatternEntry | null {
  const def = enemy.def;
  let pattern: EnemyPatternEntry[];

  if (def.phases && def.phases.length > 0) {
    pattern = def.phases[enemy.currentPhase]?.pattern ?? [];
  } else {
    pattern = def.pattern ?? [];
  }

  if (pattern.length === 0) return null;
  return pattern[enemy.patternIndex % pattern.length];
}

function IntentIcon({ intent }: { intent: EnemyPatternEntry }) {
  const t = intent.type;

  if (t === 'attack' || t === 'attack_multi' || t === 'debuff_attack') {
    const dmg = intent.type === 'attack_multi'
      ? `${intent.value}x${intent.hits ?? 1}`
      : String(intent.value);
    return (
      <div className="flex items-center gap-1 text-red-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.5 2.5l1.5 1.5-4.5 4.5 7 7-1.5 1.5-7-7-4.5 4.5L4 13l4.5-4.5L2 2l6.5 6.5z"/>
          <path d="M18 13l3.5 3.5-1.5 1.5-3.5-3.5z"/>
        </svg>
        <span className="text-xs font-bold">{dmg}</span>
      </div>
    );
  }

  if (t === 'defend' || t === 'attack_defend' || t === 'defend_attack') {
    return (
      <div className="flex items-center gap-1 text-sky-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
        </svg>
        <span className="text-xs font-bold">{intent.block ?? intent.value}</span>
        {(t === 'attack_defend' || t === 'defend_attack') && (
          <>
            <span className="text-gray-500">/</span>
            <span className="text-red-400 text-xs font-bold">{intent.value}</span>
          </>
        )}
      </div>
    );
  }

  if (t === 'debuff') {
    return (
      <div className="flex items-center gap-1 text-purple-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span className="text-xs font-bold">{intent.effect}</span>
      </div>
    );
  }

  if (t === 'buff' || t === 'buff_all') {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
        </svg>
        <span className="text-xs font-bold">buff</span>
      </div>
    );
  }

  return (
    <div className="text-gray-500 text-xs">?</div>
  );
}

const TYPE_BADGE: Record<string, string> = {
  normal: 'bg-gray-700 text-gray-300',
  elite: 'bg-amber-900 text-amber-300',
  boss: 'bg-red-900 text-red-300',
};

export function EnemyDisplay({ enemy }: EnemyDisplayProps) {
  const intent = getIntent(enemy);
  const isDead = enemy.dead;
  const typeBadge = TYPE_BADGE[enemy.def.type] || TYPE_BADGE.normal;

  return (
    <div
      className={`
        flex flex-col items-center w-36 p-3 rounded-lg border
        ${isDead
          ? 'border-gray-800 bg-gray-900/50 opacity-40'
          : 'border-gray-700 bg-gray-800/80'
        }
        transition-all duration-300
      `}
    >
      {/* Enemy type badge */}
      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${typeBadge} mb-1`}>
        {enemy.def.type}
      </span>

      {/* Enemy icon (skull) */}
      <div className={`text-3xl mb-1 ${isDead ? 'grayscale' : ''}`}>
        {enemy.def.type === 'boss' ? '\uD83D\uDC80' : enemy.def.type === 'elite' ? '\uD83D\uDC79' : '\uD83D\uDC7B'}
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-center truncate w-full">{enemy.def.name}</p>

      {/* HP bar */}
      <div className="w-full mt-1">
        <HpBar
          current={Math.max(0, enemy.hp)}
          max={enemy.maxHp}
          color={isDead ? 'bg-gray-600' : 'bg-red-600'}
          height="h-2.5"
        />
      </div>

      {/* Block */}
      {enemy.block > 0 && !isDead && (
        <div className="flex items-center gap-1 mt-1 text-sky-400">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
          </svg>
          <span className="text-xs font-bold">{enemy.block}</span>
        </div>
      )}

      {/* Status effects */}
      <div className="mt-1">
        <StatusBadges statuses={enemy.statusEffects} compact />
      </div>

      {/* Intent */}
      {!isDead && intent && (
        <div className="mt-2 px-2 py-1 bg-gray-900/60 rounded border border-gray-700/50">
          <p className="text-[8px] text-gray-500 uppercase tracking-wider text-center mb-0.5">Intent</p>
          <div className="flex justify-center">
            <IntentIcon intent={intent} />
          </div>
          <p className="text-[9px] text-gray-400 text-center mt-0.5">{intent.display}</p>
        </div>
      )}
    </div>
  );
}
