import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GameStateProvider, useGameState } from './hooks/useGameState';
import { RunStateProvider } from './hooks/useRunState';
import { useTutorial } from './hooks/useTutorial';
import { NavBar } from './components/NavBar';
import { BattleScreen } from './components/BattleScreen';
import { DeckBuilder } from './components/DeckBuilder';
import { AIEditor } from './components/AIEditor';
import { DungeonScreen } from './components/dungeon/DungeonScreen';
import { WorkshopScreen } from './components/workshop/WorkshopScreen';
import { ReforgeScreen } from './components/ReforgeScreen';
import { WelcomeBackScreen } from './components/WelcomeBackScreen';
import { TutorialOverlay, WelcomeModal } from './components/TutorialOverlay';

/** Inner shell — lives inside HashRouter so useNavigate works */
function AppShell() {
  const { pendingOfflineProgress, dismissOfflineProgress } = useGameState();
  const navigate = useNavigate();
  const {
    hasCompleted,
    isActive,
    currentStep,
    totalSteps,
    step,
    startTutorial,
    nextStep,
    prevStep,
    completeTutorial,
    skipTutorial,
    resetTutorial,
  } = useTutorial();

  // Auto-navigate to the route for the current tutorial step
  useEffect(() => {
    if (isActive && step.route) {
      navigate(step.route, { replace: true });
    }
  }, [isActive, step.route, navigate]);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <NavBar onResetTutorial={resetTutorial} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/dungeon" element={<DungeonScreen />} />
            <Route path="/workshop" element={<WorkshopScreen />} />
            <Route path="/battle" element={<BattleScreen />} />
            <Route path="/deck" element={<DeckBuilder />} />
            <Route path="/ai" element={<AIEditor />} />
            <Route path="/reforge" element={<ReforgeScreen />} />
            <Route path="*" element={<Navigate to="/dungeon" replace />} />
          </Routes>
        </div>
      </div>

      {/* Offline welcome-back modal */}
      {pendingOfflineProgress && (
        <WelcomeBackScreen
          progress={pendingOfflineProgress}
          onCollect={dismissOfflineProgress}
        />
      )}

      {/* First-launch welcome modal */}
      {!hasCompleted && !isActive && (
        <WelcomeModal onBeginTutorial={startTutorial} onSkip={skipTutorial} />
      )}

      {/* Tutorial overlay */}
      {isActive && (
        <TutorialOverlay
          step={step}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
          onComplete={completeTutorial}
        />
      )}
    </>
  );
}

function App() {
  return (
    <GameStateProvider>
      <RunStateProvider>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </RunStateProvider>
    </GameStateProvider>
  );
}

export default App
