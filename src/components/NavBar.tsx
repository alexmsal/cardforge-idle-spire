import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { CurrencyGuide } from './CurrencyGuide';

function toRoman(n: number): string {
  if (n <= 0) return '';
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

const links = [
  { to: '/dungeon', label: 'Dungeon', icon: '\uD83C\uDFF0' },
  { to: '/workshop', label: 'Workshop', icon: '\uD83D\uDD28' },
  { to: '/deck', label: 'Deck', icon: '\uD83C\uDCCF' },
  { to: '/battle', label: 'Battle', icon: '\u2694\uFE0F' },
  { to: '/ai', label: 'AI Rules', icon: '\uD83E\uDDE0' },
];

interface NavBarProps {
  onResetTutorial?: () => void;
}

export function NavBar({ onResetTutorial }: NavBarProps) {
  const { economyStats, prestigeLevel } = useGameState();
  const reforgeUnlocked = economyStats.totalBossKills > 0 || prestigeLevel > 0;
  const [showSettings, setShowSettings] = useState(false);
  const [showCurrencyGuide, setShowCurrencyGuide] = useState(false);

  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-6 py-0 flex items-center gap-1">
      <span className="text-sm font-bold text-gray-300 mr-4">
        CardForge
        {prestigeLevel > 0 && (
          <span className="ml-1.5 text-[10px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded font-mono">
            {toRoman(prestigeLevel)}
          </span>
        )}
      </span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? 'text-white border-blue-500'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
            }`
          }
        >
          <span className="mr-1.5">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
      {/* Reforge tab */}
      {reforgeUnlocked ? (
        <NavLink
          to="/reforge"
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? 'text-amber-300 border-amber-500'
                : 'text-gray-500 border-transparent hover:text-amber-300 hover:border-amber-600'
            }`
          }
        >
          <span className="mr-1.5">{'\u2728'}</span>
          Reforge
        </NavLink>
      ) : (
        <span
          className="px-4 py-2.5 text-sm font-medium text-gray-700 border-b-2 border-transparent cursor-not-allowed"
          title="Unlocks after defeating the Crypt Lord (Boss on Floor 10)"
        >
          <span className="mr-1.5">{'\u2728'}</span>
          Reforge
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings gear */}
      <div className="relative">
        <button
          onClick={() => setShowSettings((prev) => !prev)}
          className="px-2 py-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
          title="Settings"
        >
          {'\u2699\uFE0F'}
        </button>
        {showSettings && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]">
              <button
                onClick={() => {
                  setShowCurrencyGuide(true);
                  setShowSettings(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Currency Guide
              </button>
              <button
                onClick={() => {
                  onResetTutorial?.();
                  setShowSettings(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Reset Tutorial
              </button>
              {/* TODO: Future settings to implement:
                - Battle speed: 0.5x / 1x / 2x / 5x / Skip
                - Auto-battle toggle
                - Sound on/off (when audio is added)
                - Theme: dark/light
                - Export/Import save (JSON download/upload)
                - Difficulty modifier
              */}
            </div>
          </>
        )}
      </div>

      {showCurrencyGuide && <CurrencyGuide onClose={() => setShowCurrencyGuide(false)} />}
    </nav>
  );
}
