import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRunState } from '../../hooks/useRunState';

interface PortalStationProps {
  onBack: () => void;
}

export function PortalStation({ onBack }: PortalStationProps) {
  const { run, isRunActive, abandonRun } = useRunState();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStartExpedition = () => {
    navigate('/dungeon');
  };

  const handleContinue = () => {
    navigate('/dungeon');
  };

  const handleAbandon = () => {
    abandonRun();
    setShowConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-2.5 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">&larr; Back</button>
        <h2 className="text-lg font-bold">{'\uD83C\uDF00'} Portal</h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-8 max-w-md w-full text-center">
          <span className="text-5xl block mb-4">{'\uD83C\uDF00'}</span>

          {isRunActive && run ? (
            <>
              <h3 className="text-xl font-bold text-purple-300 mb-2">Expedition in Progress</h3>
              <div className="space-y-1 mb-6">
                <p className="text-sm text-gray-400">
                  Floor {run.currentFloor}/{run.map.totalFloors}
                </p>
                <p className="text-sm text-gray-400">
                  HP: {run.hp}/{run.maxHp}
                </p>
                <p className="text-sm text-gray-400">
                  Gold earned: {run.goldEarned}
                </p>
                <p className="text-sm text-gray-400">
                  Battles won: {run.battlesWon}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-600/30"
                >
                  Continue Expedition
                </button>

                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full px-4 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Abandon Run
                  </button>
                ) : (
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                    <p className="text-xs text-red-400 mb-2">Are you sure? All progress will be lost.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleAbandon}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Abandon
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-purple-300 mb-2">The Crypt Awaits</h3>
              <p className="text-sm text-gray-400 mb-6">
                Enter the dungeon and fight through 10 floors of enemies, events, and treasure.
              </p>
              <button
                onClick={handleStartExpedition}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 text-lg"
              >
                Start Expedition
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
