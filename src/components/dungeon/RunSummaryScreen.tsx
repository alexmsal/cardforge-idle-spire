import type { RunSummary } from '../../models/Dungeon';

interface RunSummaryScreenProps {
  summary: RunSummary;
  onReturn: () => void;
}

export function RunSummaryScreen({ summary, onReturn }: RunSummaryScreenProps) {
  const isVictory = summary.result === 'victory';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className={`bg-gray-900 border rounded-xl p-8 max-w-md w-full ${
        isVictory ? 'border-yellow-600' : 'border-red-800'
      }`}>
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl">{isVictory ? '\uD83C\uDFC6' : '\uD83D\uDC80'}</span>
          <h2 className={`text-2xl font-bold mt-2 ${isVictory ? 'text-yellow-400' : 'text-red-400'}`}>
            {isVictory ? 'Victory!' : 'Defeat'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isVictory
              ? 'You conquered the Crypt!'
              : 'Your construct has fallen...'}
          </p>
        </div>

        {/* Combat Stats */}
        <div className="space-y-2 mb-4">
          <SectionLabel text="Combat" />
          <StatRow label="Floors Cleared" value={`${summary.floorsCleared}/10`} />
          <StatRow label="Battles Won" value={String(summary.battlesWon)} />
          <StatRow label="Elites Slain" value={String(summary.elitesSlain)} />
          {summary.bossKill && (
            <StatRow label="Boss Defeated" value="Yes" highlight="text-purple-400" />
          )}
          <StatRow label="Final HP" value={`${summary.finalHp}/${summary.maxHp}`} />
          <StatRow label="Final Deck Size" value={String(summary.deckSize)} />
        </div>

        {/* Economy Breakdown */}
        <div className="space-y-2 mb-6">
          <SectionLabel text="Economy" />
          <StatRow label="Gold Earned" value={`+${summary.goldEarned}`} highlight="text-yellow-400" />
        </div>

        {/* Return */}
        <div className="text-center">
          <button
            onClick={onReturn}
            className={`px-8 py-3 font-bold rounded-xl transition-colors text-white ${
              isVictory
                ? 'bg-yellow-600 hover:bg-yellow-500 shadow-lg shadow-yellow-600/30'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Collect & Return
          </button>
          <p className="text-[10px] text-gray-600 mt-2">
            Gold will be added to your persistent balance.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="pt-2">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{text}</span>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex justify-between items-center px-2 py-1 border-b border-gray-800/50">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-mono ${highlight ?? 'text-white'}`}>{value}</span>
    </div>
  );
}
