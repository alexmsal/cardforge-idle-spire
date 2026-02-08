import { useState } from 'react';
import { getCardById } from '../../data/gameData';

interface CardRemoveScreenProps {
  deckCardIds: string[];
  onRemove: (cardId: string) => void;
  onCancel: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-blue-600',
  rare: 'border-amber-600',
};

export function CardRemoveScreen({ deckCardIds, onRemove, onCancel }: CardRemoveScreenProps) {
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  // Deduplicate cards with counts
  const cardCounts = new Map<string, number>();
  for (const id of deckCardIds) {
    cardCounts.set(id, (cardCounts.get(id) ?? 0) + 1);
  }

  const uniqueCards = [...cardCounts.entries()]
    .map(([id, count]) => ({ card: getCardById(id), id, count }))
    .filter((c) => c.card !== undefined)
    .sort((a, b) => a.card!.name.localeCompare(b.card!.name));

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-red-800/50 rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-red-300">Remove a Card</h2>
          <p className="text-xs text-gray-500">Click a card to remove it from your deck</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {uniqueCards.map(({ card, id, count }) => (
            <button
              key={id}
              onClick={() => setPendingRemove(id)}
              className={`w-full text-left p-2.5 rounded border ${
                pendingRemove === id ? 'border-red-500 bg-red-900/20' : `${RARITY_BORDER[card!.rarity] ?? 'border-gray-700'} bg-gray-800/60 hover:bg-red-900/20 hover:border-red-500`
              } transition-all flex items-center justify-between`}
            >
              <div>
                <span className="text-sm text-white">{card!.name}</span>
                <span className="text-xs text-gray-500 ml-2 capitalize">{card!.type}</span>
              </div>
              <div className="flex items-center gap-2">
                {count > 1 && (
                  <span className="text-xs text-gray-500">x{count}</span>
                )}
                <span className="text-xs text-blue-400">{card!.cost}E</span>
              </div>
            </button>
          ))}
        </div>

        {/* Confirmation */}
        {pendingRemove && (() => {
          const card = getCardById(pendingRemove);
          return (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-3 text-center">
              <p className="text-xs text-red-300 mb-2">
                Remove <strong className="text-white">{card?.name ?? pendingRemove}</strong> from your deck?
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => { onRemove(pendingRemove); setPendingRemove(null); }}
                  className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setPendingRemove(null)}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
