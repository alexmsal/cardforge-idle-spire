import { useState, useMemo } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { getCardById } from '../../data/gameData';
import { CardDetailModal } from '../CardDetailModal';
import type { Card, Rarity, CardType, Archetype } from '../../models';

interface LibraryStationProps {
  onBack: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-blue-600',
  rare: 'border-amber-600',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-800/60',
  uncommon: 'bg-blue-900/20',
  rare: 'bg-amber-900/20',
};

const TYPE_ICON: Record<string, string> = {
  attack: '\u2694',
  defense: '\uD83D\uDEE1',
  skill: '\u2728',
  reaction: '\u21A9',
};

type SortField = 'name' | 'rarity' | 'type' | 'archetype';
type FilterDeck = 'all' | 'in_deck' | 'not_in_deck';

const RARITY_ORDER: Record<string, number> = { common: 0, uncommon: 1, rare: 2 };

export function LibraryStation({ onBack }: LibraryStationProps) {
  const { ownedCardIds, deckCardIds, libraryCapacity } = useGameState();
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [filterType, setFilterType] = useState<CardType | 'all'>('all');
  const [filterArchetype, setFilterArchetype] = useState<Archetype | 'all'>('all');
  const [filterDeck, setFilterDeck] = useState<FilterDeck>('all');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [search, setSearch] = useState('');
  const [detailCard, setDetailCard] = useState<Card | null>(null);

  // Build deduplicated owned card list with counts
  const deckSet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of deckCardIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [deckCardIds]);

  const ownedUnique = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of ownedCardIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ card: getCardById(id), id, count, inDeck: deckSet.get(id) ?? 0 }))
      .filter((c) => c.card !== undefined) as Array<{ card: Card; id: string; count: number; inDeck: number }>;
  }, [ownedCardIds, deckSet]);

  const uniqueCardCount = new Set(ownedCardIds).size;

  // Filter + sort
  const displayCards = useMemo(() => {
    let cards = [...ownedUnique];

    // Filters
    if (filterRarity !== 'all') cards = cards.filter((c) => c.card.rarity === filterRarity);
    if (filterType !== 'all') cards = cards.filter((c) => c.card.type === filterType);
    if (filterArchetype !== 'all') cards = cards.filter((c) => c.card.archetype === filterArchetype);
    if (filterDeck === 'in_deck') cards = cards.filter((c) => c.inDeck > 0);
    if (filterDeck === 'not_in_deck') cards = cards.filter((c) => c.inDeck === 0);
    if (search) {
      const q = search.toLowerCase();
      cards = cards.filter((c) => c.card.name.toLowerCase().includes(q));
    }

    // Sort
    cards.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.card.name.localeCompare(b.card.name);
        case 'rarity': return (RARITY_ORDER[a.card.rarity] ?? 0) - (RARITY_ORDER[b.card.rarity] ?? 0);
        case 'type': return a.card.type.localeCompare(b.card.type);
        case 'archetype': return a.card.archetype.localeCompare(b.card.archetype);
        default: return 0;
      }
    });

    return cards;
  }, [ownedUnique, filterRarity, filterType, filterArchetype, filterDeck, search, sortBy]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-2.5 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">&larr; Back</button>
        <h2 className="text-lg font-bold">{'\uD83D\uDCDA'} Library</h2>
        <div className="flex-1" />
        <span className={`text-sm font-mono px-2 py-0.5 rounded ${
          uniqueCardCount >= libraryCapacity
            ? 'bg-amber-900/40 text-amber-400'
            : 'bg-gray-800 text-gray-400'
        }`}>
          {uniqueCardCount}/{libraryCapacity} unique cards
        </span>
      </div>

      {/* Filter bar */}
      <div className="border-b border-gray-800 px-6 py-2 flex items-center gap-2 flex-wrap flex-shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-600 w-32 focus:outline-none focus:border-gray-500"
        />
        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none">
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as CardType | 'all')}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none">
          <option value="all">All Types</option>
          <option value="attack">Attack</option>
          <option value="defense">Defense</option>
          <option value="skill">Skill</option>
          <option value="reaction">Reaction</option>
        </select>
        <select value={filterArchetype} onChange={(e) => setFilterArchetype(e.target.value as Archetype | 'all')}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none">
          <option value="all">All Archetypes</option>
          <option value="neutral">Neutral</option>
          <option value="berserker">Berserker</option>
          <option value="poison">Poison</option>
          <option value="shield">Shield</option>
        </select>
        <select value={filterDeck} onChange={(e) => setFilterDeck(e.target.value as FilterDeck)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none">
          <option value="all">All</option>
          <option value="in_deck">In Deck</option>
          <option value="not_in_deck">Not in Deck</option>
        </select>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-500 mr-1">Sort:</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortField)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none">
          <option value="name">Name</option>
          <option value="rarity">Rarity</option>
          <option value="type">Type</option>
          <option value="archetype">Archetype</option>
        </select>
        <span className="text-[10px] text-gray-600">{displayCards.length} shown</span>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
          {displayCards.map(({ card, count, inDeck }) => (
            <div
              key={card.id}
              onClick={() => setDetailCard(card)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer hover:brightness-125 transition-all ${RARITY_BORDER[card.rarity]} ${RARITY_BG[card.rarity]}`}
            >
              {/* Cost */}
              <span className="w-6 h-6 rounded-full bg-blue-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 border border-blue-500/50">
                {card.cost}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{TYPE_ICON[card.type]}</span>
                  <span className="text-sm font-medium truncate">{card.name}</span>
                </div>
                <p className="text-[10px] text-gray-500 capitalize">
                  {card.rarity} &middot; {card.archetype}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                {count > 1 && (
                  <span className="text-[10px] text-gray-500 font-mono">x{count}</span>
                )}
                {inDeck > 0 && (
                  <span className="text-[9px] text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">
                    In Deck{inDeck > 1 ? ` x${inDeck}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {displayCards.length === 0 && (
          <p className="text-center text-gray-600 py-8">No cards match your filters.</p>
        )}
      </div>

      {/* Detail modal */}
      {detailCard && <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} />}
    </div>
  );
}
