import type { OfflineProgress } from '../engine/IdleEngine';

interface WelcomeBackScreenProps {
  progress: OfflineProgress;
  onCollect: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function WelcomeBackScreen({ progress, onCollect }: WelcomeBackScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl block mb-2">{'\u2728'}</span>
          <h2 className="text-xl font-bold text-white">Welcome Back!</h2>
          <p className="text-sm text-gray-400 mt-1">
            You were away for {formatDuration(progress.elapsedMs)}
          </p>
        </div>

        {/* Rewards */}
        <div className="space-y-3 mb-6">
          {progress.goldGenerated > 0 && (
            <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-800/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">G</span>
                <span className="text-sm text-gray-300">Gold Generated</span>
              </div>
              <span className="text-yellow-400 font-bold font-mono">+{progress.goldGenerated}</span>
            </div>
          )}

          {progress.shardsGenerated > 0 && (
            <div className="flex items-center justify-between bg-cyan-900/20 border border-cyan-800/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-cyan-500">{'\u2B50'}</span>
                <span className="text-sm text-gray-300">Shards Generated</span>
              </div>
              <span className="text-cyan-400 font-bold font-mono">+{progress.shardsGenerated}</span>
            </div>
          )}

          {progress.generatorsExpired.length > 0 && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-red-400">
                {progress.generatorsExpired.length} generator{progress.generatorsExpired.length > 1 ? 's' : ''} depleted while you were away.
              </p>
            </div>
          )}
        </div>

        {/* Collect button */}
        <button
          onClick={onCollect}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 text-lg"
        >
          Collect
        </button>
      </div>
    </div>
  );
}
