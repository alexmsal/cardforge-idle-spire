import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameStateProvider } from './hooks/useGameState';
import { RunStateProvider } from './hooks/useRunState';
import { NavBar } from './components/NavBar';
import { BattleScreen } from './components/BattleScreen';
import { DeckBuilder } from './components/DeckBuilder';
import { AIEditor } from './components/AIEditor';
import { DungeonScreen } from './components/dungeon/DungeonScreen';

function App() {
  return (
    <GameStateProvider>
      <RunStateProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <NavBar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Routes>
                <Route path="/dungeon" element={<DungeonScreen />} />
                <Route path="/battle" element={<BattleScreen />} />
                <Route path="/deck" element={<DeckBuilder />} />
                <Route path="/ai" element={<AIEditor />} />
                <Route path="*" element={<Navigate to="/dungeon" replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </RunStateProvider>
    </GameStateProvider>
  );
}

export default App
