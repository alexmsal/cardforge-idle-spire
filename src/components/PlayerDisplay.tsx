import type { PlayerState } from '../models';
import { HpBar } from './HpBar';
import { StatusBadges } from './StatusBadges';
import { Tooltip } from './Tooltip';

interface PlayerDisplayProps {
  player: PlayerState;
}

function EnergyPips({ current, max }: { current: number; max: number }) {
  const pips = [];
  for (let i = 0; i < max; i++) {
    pips.push(
      <div
        key={i}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-200
          ${i < current
            ? 'bg-blue-500 border-blue-400 text-white shadow-md shadow-blue-500/30'
            : 'bg-gray-800 border-gray-600 text-gray-600'
          }`}
      >
        {i < current ? '\u26A1' : ''}
      </div>
    );
  }
  // Extra energy beyond max
  for (let i = max; i < current; i++) {
    pips.push(
      <div
        key={`extra-${i}`}
        className="w-5 h-5 rounded-full border-2 bg-yellow-500 border-yellow-400 text-white flex items-center justify-center text-[10px] font-bold shadow-md shadow-yellow-500/30"
      >
        {'\u26A1'}
      </div>
    );
  }
  return <div className="flex gap-1">{pips}</div>;
}

export function PlayerDisplay({ player }: PlayerDisplayProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl border border-gray-700 bg-gray-800/60 w-full max-w-md">
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{'\uD83E\uDDF1'}</span>
        <p className="text-lg font-bold">Construct</p>
      </div>

      {/* HP bar */}
      <div className="w-full mb-2">
        <HpBar
          current={Math.max(0, player.hp)}
          max={player.maxHp}
          color={player.hp <= player.maxHp * 0.3 ? 'bg-red-500' : 'bg-emerald-500'}
          height="h-4"
        />
      </div>

      {/* Energy + Block row */}
      <div className="flex items-center justify-between w-full gap-4">
        {/* Energy */}
        <div className="flex items-center gap-2">
          <Tooltip text="Resets to 3 each turn. Cards cost energy to play." position="bottom">
            <span className="text-xs text-gray-400 uppercase tracking-wider cursor-help">Energy</span>
          </Tooltip>
          <EnergyPips current={player.energy} max={player.maxEnergy} />
        </div>

        {/* Block */}
        {player.block > 0 && (
          <Tooltip text="Absorbs incoming damage. Decays at the start of your turn." position="bottom">
            <div className="flex items-center gap-1 px-2 py-1 bg-sky-900/40 rounded border border-sky-800/50 cursor-help">
              <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
              </svg>
              <span className="text-sm font-bold text-sky-400">{player.block}</span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Status effects */}
      <div className="mt-2">
        <StatusBadges statuses={player.statusEffects} />
      </div>

      {/* Deck info */}
      <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
        <span>Draw: {player.drawPile.length}</span>
        <span>Discard: {player.discardPile.length}</span>
        <span>Exhaust: {player.exhaustPile.length}</span>
      </div>
    </div>
  );
}
