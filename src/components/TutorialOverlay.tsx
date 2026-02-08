import type { TutorialStep } from '../hooks/useTutorial';

interface TutorialOverlayProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const STEP_ICONS: Record<string, string> = {
  welcome: '\uD83C\uDCCF',
  card_detail: '\uD83D\uDCA0',
  ai_editor: '\uD83E\uDDE0',
  ai_priority: '\u2195\uFE0F',
  dungeon_intro: '\uD83C\uDFF0',
  workshop_intro: '\uD83D\uDD28',
  complete: '\uD83C\uDF1F',
};

export function TutorialOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="fixed inset-0 bg-black/40 pointer-events-auto" onClick={() => {}} />

      {/* Tutorial card */}
      <div className="relative pointer-events-auto bg-gray-900 border border-blue-700/60 rounded-xl shadow-2xl shadow-blue-900/30 max-w-md w-full mx-4 p-5 animate-fade-in">
        {/* Step counter + skip */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStep ? 'bg-blue-400' : i < currentStep ? 'bg-blue-700' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Skip Tutorial
          </button>
        </div>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{STEP_ICONS[step.id] ?? '\u2139\uFE0F'}</span>
          <h3 className="text-base font-bold text-white">{step.title}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              &larr; Back
            </button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-emerald-600/30"
            >
              Start Playing
            </button>
          ) : (
            <button
              onClick={onNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Next &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Welcome modal (shown before tutorial starts) ───────

interface WelcomeModalProps {
  onBeginTutorial: () => void;
  onSkip: () => void;
}

export function WelcomeModal({ onBeginTutorial, onSkip }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
        <span className="text-5xl block mb-4">{'\u2694\uFE0F'}</span>
        <h1 className="text-2xl font-bold text-white mb-2">
          CardForge: Idle Spire
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          Build a deck, program your AI, and send your construct into the Crypt.
          Defeat enemies, collect cards, and upgrade your workshop to grow stronger
          with each expedition.
        </p>

        <div className="space-y-2">
          <button
            onClick={onBeginTutorial}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30 text-lg"
          >
            Begin Tutorial
          </button>
          <button
            onClick={onSkip}
            className="w-full px-6 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip — I know what I'm doing
          </button>
        </div>
      </div>
    </div>
  );
}
