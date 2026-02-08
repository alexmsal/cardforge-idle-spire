interface DungeonRestScreenProps {
  hp: number;
  maxHp: number;
  onHeal: () => void;
  onUpgrade: () => void;
}

export function DungeonRestScreen({ hp, maxHp, onHeal, onUpgrade }: DungeonRestScreenProps) {
  const healAmount = Math.floor(maxHp * 0.3);
  const wouldHeal = Math.min(healAmount, maxHp - hp);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-cyan-800/50 rounded-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-3xl">{'\uD83D\uDD25'}</span>
          <h2 className="text-xl font-bold text-cyan-300 mt-2">Rest Site</h2>
          <p className="text-sm text-gray-400 mt-1">
            A quiet place to recover. Choose wisely.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={onHeal}
            className="w-full text-left p-4 rounded-lg border border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/10 transition-all"
          >
            <p className="text-sm font-bold text-white">Rest</p>
            <p className="text-xs text-gray-400">
              Heal 30% of max HP (+{wouldHeal} HP)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Current: {hp}/{maxHp}
            </p>
          </button>

          <button
            onClick={onUpgrade}
            className="w-full text-left p-4 rounded-lg border border-gray-700 hover:border-amber-500 hover:bg-amber-900/10 transition-all"
          >
            <p className="text-sm font-bold text-white">Smith</p>
            <p className="text-xs text-gray-400">
              Upgrade one card by +1 level
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
