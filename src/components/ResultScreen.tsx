import type { BattleSummary } from '../models';

interface ResultScreenProps {
  summary: BattleSummary;
  onNewBattle: () => void;
}

export function ResultScreen({ summary, onNewBattle }: ResultScreenProps) {
  const isWin = summary.result === 'win';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`
        w-80 rounded-xl border-2 p-6 text-center shadow-2xl
        ${isWin
          ? 'border-emerald-500 bg-gray-900 shadow-emerald-500/20'
          : 'border-red-500 bg-gray-900 shadow-red-500/20'
        }
      `}>
        {/* Result header */}
        <div className="text-5xl mb-2">{isWin ? '\uD83C\uDFC6' : '\uD83D\uDC80'}</div>
        <h2 className={`text-2xl font-bold mb-4 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
          {isWin ? 'Victory!' : 'Defeat'}
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs uppercase">Turns</p>
            <p className="text-white font-bold text-lg">{summary.turnsElapsed}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs uppercase">HP Left</p>
            <p className={`font-bold text-lg ${summary.playerHpRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.max(0, summary.playerHpRemaining)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs uppercase">Dmg Dealt</p>
            <p className="text-red-400 font-bold text-lg">{summary.damageDealt}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs uppercase">Dmg Taken</p>
            <p className="text-orange-400 font-bold text-lg">{summary.damageReceived}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs uppercase">Cards Played</p>
            <p className="text-blue-400 font-bold text-lg">{summary.cardsPlayed}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs uppercase">Enemies Slain</p>
            <p className="text-amber-400 font-bold text-lg">{summary.enemiesDefeated}</p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={onNewBattle}
          className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg"
        >
          New Battle
        </button>
      </div>
    </div>
  );
}
