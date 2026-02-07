import type { BattleSpeed, SimState } from '../hooks/useBattleSimulation';

interface BattleControlsProps {
  simState: SimState;
  speed: BattleSpeed;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onChangeSpeed: (speed: BattleSpeed) => void;
  onReset: () => void;
}

const SPEEDS: BattleSpeed[] = [1, 2, 4, 100];
const SPEED_LABELS: Record<number, string> = {
  1: 'x1',
  2: 'x2',
  4: 'x4',
  100: 'Instant',
};

export function BattleControls({
  simState,
  speed,
  onStart,
  onPause,
  onResume,
  onStep,
  onChangeSpeed,
  onReset,
}: BattleControlsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Primary action button */}
      {simState === 'idle' && (
        <button
          onClick={onStart}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
        >
          Start Battle
        </button>
      )}

      {simState === 'running' && (
        <button
          onClick={onPause}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors"
        >
          Pause
        </button>
      )}

      {simState === 'paused' && (
        <div className="flex gap-2">
          <button
            onClick={onResume}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
          >
            Resume
          </button>
          <button
            onClick={onStep}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors border border-gray-500"
          >
            Step
          </button>
        </div>
      )}

      {simState === 'finished' && (
        <button
          onClick={onReset}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
        >
          New Battle
        </button>
      )}

      {/* Speed controls */}
      {simState !== 'idle' && simState !== 'finished' && (
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-400 mr-1">Speed:</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-1 text-xs rounded transition-colors
                ${speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                }`}
            >
              {SPEED_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {/* Reset (always visible when not idle) */}
      {simState !== 'idle' && simState !== 'finished' && (
        <button
          onClick={onReset}
          className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors ml-auto"
        >
          Reset
        </button>
      )}
    </div>
  );
}
