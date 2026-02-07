import { useState, useCallback } from 'react';
import { BattleEngine } from '../engine/BattleEngine';
import { allEnemies } from '../data/gameData';
import type { Card, AIRule, BattleSummary } from '../models';

interface QuickTestPopupProps {
  deckCards: Card[];
  aiRules: AIRule[];
  onClose: () => void;
}

export function QuickTestPopup({ deckCards, aiRules, onClose }: QuickTestPopupProps) {
  const [results, setResults] = useState<BattleSummary[] | null>(null);
  const [running, setRunning] = useState(false);

  const skeleton = allEnemies.find((e) => e.id === 'skeleton') ?? allEnemies[0];

  const runTests = useCallback(() => {
    setRunning(true);
    // Run async-like via setTimeout to let UI update
    setTimeout(() => {
      const summaries: BattleSummary[] = [];
      for (let i = 0; i < 10; i++) {
        const engine = new BattleEngine(aiRules);
        engine.initCombat(deckCards, [skeleton]);
        summaries.push(engine.runFullCombat());
      }
      setResults(summaries);
      setRunning(false);
    }, 50);
  }, [deckCards, aiRules, skeleton]);

  const wins = results?.filter((r) => r.result === 'win').length ?? 0;
  const total = results?.length ?? 0;
  const avgTurns = total > 0 ? (results!.reduce((s, r) => s + r.turnsElapsed, 0) / total).toFixed(1) : '—';
  const avgDmg = total > 0 ? (results!.reduce((s, r) => s + r.damageDealt, 0) / total).toFixed(0) : '—';
  const avgTaken = total > 0 ? (results!.reduce((s, r) => s + r.damageReceived, 0) / total).toFixed(0) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">Quick Test</h3>
        <p className="text-xs text-gray-500 mb-4">
          10 battles vs {skeleton.name} ({skeleton.baseHp} HP)
        </p>

        {!results && !running && (
          <button
            onClick={runTests}
            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
          >
            Run 10 Battles
          </button>
        )}

        {running && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 animate-pulse">Running battles...</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            {/* Winrate bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Winrate</span>
                <span className={`font-bold ${wins >= 7 ? 'text-emerald-400' : wins >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {wins}/{total} ({Math.round((wins / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${wins >= 7 ? 'bg-emerald-500' : wins >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${(wins / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-800 rounded-lg p-2">
                <p className="text-[10px] text-gray-500 uppercase">Avg Turns</p>
                <p className="text-sm font-bold">{avgTurns}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <p className="text-[10px] text-gray-500 uppercase">Avg Dmg</p>
                <p className="text-sm font-bold text-red-400">{avgDmg}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <p className="text-[10px] text-gray-500 uppercase">Avg Taken</p>
                <p className="text-sm font-bold text-orange-400">{avgTaken}</p>
              </div>
            </div>

            {/* Individual results */}
            <div className="text-[10px] text-gray-500 space-y-0.5 max-h-24 overflow-y-auto scrollbar-thin">
              {results.map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span>#{i + 1} {r.result === 'win' ? '\u2713' : '\u2717'} {r.result.toUpperCase()}</span>
                  <span>{r.turnsElapsed}t | HP:{Math.max(0, r.playerHpRemaining)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={runTests}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Re-run
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!results && !running && (
          <button
            onClick={onClose}
            className="mt-2 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
