import type { RunState } from '../../models/Dungeon';

interface RunHUDProps {
  run: RunState;
  onAbandon: () => void;
}

export function RunHUD({ run, onAbandon }: RunHUDProps) {
  const hpPercent = Math.max(0, (run.hp / run.maxHp) * 100);
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-gray-950 border-b border-gray-800 px-6 py-1.5 flex items-center gap-6 text-xs flex-shrink-0">
      {/* Floor */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Floor</span>
        <span className="font-bold text-white">{run.currentFloor}/{run.map.totalFloors}</span>
      </div>

      {/* HP */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">HP</span>
        <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${hpColor} transition-all`} style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="font-mono text-gray-300">{run.hp}/{run.maxHp}</span>
      </div>

      {/* Gold */}
      <div className="flex items-center gap-1.5">
        <span className="text-yellow-500">G</span>
        <span className="font-mono text-yellow-300">{run.gold}</span>
      </div>

      {/* Deck */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Deck</span>
        <span className="font-mono text-gray-300">{run.deckCardIds.length}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Abandon */}
      <button
        onClick={onAbandon}
        className="text-gray-600 hover:text-red-400 transition-colors"
        title="Abandon Run"
      >
        Abandon Run
      </button>
    </div>
  );
}
