import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameStateProvider } from './hooks/useGameState';
import { NavBar } from './components/NavBar';
import { BattleScreen } from './components/BattleScreen';
import { DeckBuilder } from './components/DeckBuilder';
import { AIEditor } from './components/AIEditor';

function App() {
  return (
    <GameStateProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <NavBar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/battle" element={<BattleScreen />} />
              <Route path="/deck" element={<DeckBuilder />} />
              <Route path="/ai" element={<AIEditor />} />
              <Route path="*" element={<Navigate to="/battle" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </GameStateProvider>
  );
}

export default App
