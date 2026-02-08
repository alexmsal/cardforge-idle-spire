interface CurrencyGuideProps {
  onClose: () => void;
}

const CURRENCIES = [
  {
    icon: 'G',
    iconColor: 'text-yellow-500',
    name: 'Gold',
    earned: 'Battles, dungeon runs, chests, and events',
    spent: 'Shop items, Workshop station upgrades',
  },
  {
    icon: '\u2B50',
    iconColor: 'text-cyan-400',
    name: 'Shards',
    earned: 'Dismantling cards at the Anvil, idle generators',
    spent: 'Crafting new cards at the Anvil',
  },
  {
    icon: '\u2728',
    iconColor: 'text-amber-400',
    name: 'Foil',
    earned: 'Reforging (prestige reset) — scales with max floor reached and boss kills',
    spent: 'Permanent upgrades in the Foil Shop (HP, hand size, gold per battle, eternal slots)',
  },
];

export function CurrencyGuide({ onClose }: CurrencyGuideProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Currency Guide</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-sm px-2"
          >
            {'\u2715'}
          </button>
        </div>

        <div className="space-y-4">
          {CURRENCIES.map((c) => (
            <div key={c.name} className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`${c.iconColor} text-lg`}>{c.icon}</span>
                <h4 className="text-sm font-bold text-white">{c.name}</h4>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-gray-400">
                  <span className="text-emerald-400 font-medium">Earned:</span> {c.earned}
                </p>
                <p className="text-gray-400">
                  <span className="text-red-400 font-medium">Spent:</span> {c.spent}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
