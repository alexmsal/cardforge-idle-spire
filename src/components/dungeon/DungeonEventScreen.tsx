import { useState, useMemo } from 'react';
import type { GameEvent } from '../../models/Dungeon';
import { gameEvents } from '../../data/gameData';

interface DungeonEventScreenProps {
  eventId?: string;
  gold: number;
  onChoice: (choiceIndex: number) => string;
  onClose: () => void;
}

export function DungeonEventScreen({ eventId, gold, onChoice, onClose }: DungeonEventScreenProps) {
  const [resultText, setResultText] = useState<string | null>(null);
  const [choiceMade, setChoiceMade] = useState(false);

  const event: GameEvent | undefined = useMemo(() => {
    if (eventId) return gameEvents.find((e) => e.id === eventId);
    // Pick a random event
    return gameEvents[Math.floor(Math.random() * gameEvents.length)];
  }, [eventId]);

  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">No event found.</p>
        <button onClick={onClose} className="ml-4 text-blue-400 hover:text-blue-300">Continue</button>
      </div>
    );
  }

  const handleChoice = (index: number) => {
    const result = onChoice(index);
    setResultText(result);
    setChoiceMade(true);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-8 max-w-lg w-full">
        {/* Event name */}
        <div className="text-center mb-4">
          <span className="text-2xl">&#x2753;</span>
          <h2 className="text-xl font-bold text-purple-300 mt-2">{event.name}</h2>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 leading-relaxed mb-6 text-center italic">
          {event.description}
        </p>

        {/* Result text (after choice) */}
        {resultText && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-200 text-center">{resultText}</p>
          </div>
        )}

        {/* Choices */}
        {!choiceMade ? (
          <div className="space-y-2">
            {event.choices.map((choice, i) => {
              // Check if choice is affordable
              const isAffordable = !choice.cost || choice.cost.type !== 'gold' || gold >= (choice.cost.value ?? 0);

              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={!isAffordable}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isAffordable
                      ? 'border-gray-700 hover:border-purple-500 hover:bg-purple-900/10'
                      : 'border-gray-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{choice.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{choice.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
