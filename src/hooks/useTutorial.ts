import { useState, useCallback } from 'react';

const STORAGE_TUTORIAL = 'cardforge_tutorial_completed';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  route: string;
  highlight?: string; // CSS selector hint (for display context)
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Your Deck',
    description: 'This is your deck. You start with basic Strike and Defend cards. Your deck is shuffled at the start of each battle, and you draw 5 cards per turn.',
    route: '/deck',
  },
  {
    id: 'card_detail',
    title: 'Card Anatomy',
    description: 'Each card has an energy cost (top-left), a type (Attack, Defense, Skill), and effects. Common cards are simple, Uncommon cards are stronger, and Rare cards have powerful combos.',
    route: '/deck',
  },
  {
    id: 'ai_editor',
    title: 'AI Rules',
    description: 'Your AI fights for you! Rules are checked top-to-bottom each turn. The first matching rule plays that card. For example: "IF HP < 30% \u2192 Play Defend" keeps your construct alive.',
    route: '/ai',
  },
  {
    id: 'ai_priority',
    title: 'Rule Priority',
    description: 'Drag rules to reorder them. Higher rules are checked first. Put defensive rules near the top so your AI survives, and offensive rules below to deal damage.',
    route: '/ai',
  },
  {
    id: 'dungeon_intro',
    title: 'The Dungeon',
    description: 'Enter the Crypt to fight through 10 floors of enemies, events, shops, and treasure. Each run uses your current deck and AI rules. Gold earned transfers to your persistent balance.',
    route: '/dungeon',
  },
  {
    id: 'workshop_intro',
    title: 'The Workshop',
    description: 'Upgrade three stations: Anvil (craft & dismantle cards), Library (manage your collection), and Portal (launch expeditions & manage generators).',
    route: '/workshop',
  },
  {
    id: 'complete',
    title: "You're Ready!",
    description: 'Build your deck, refine your AI, and conquer the Crypt. After defeating the Crypt Lord boss, you can Reforge for permanent upgrades. Good luck!',
    route: '/dungeon',
  },
];

export function useTutorial() {
  const [hasCompleted, setHasCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_TUTORIAL) === 'true';
    } catch { return false; }
  });

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    try { localStorage.setItem(STORAGE_TUTORIAL, 'true'); } catch { /* noop */ }
  }, []);

  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  const resetTutorial = useCallback(() => {
    setHasCompleted(false);
    try { localStorage.removeItem(STORAGE_TUTORIAL); } catch { /* noop */ }
  }, []);

  const step = TUTORIAL_STEPS[currentStep] ?? TUTORIAL_STEPS[0];

  return {
    hasCompleted,
    isActive,
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    step,
    startTutorial,
    nextStep,
    prevStep,
    completeTutorial,
    skipTutorial,
    resetTutorial,
  };
}
