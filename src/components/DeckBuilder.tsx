import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import { starterTemplates, DECK_MIN, DECK_MAX, getCardById } from '../data/gameData';
import { CardDetailModal } from './CardDetailModal';
import { QuickTestPopup } from './QuickTestPopup';
import type { Card, Rarity, CardType, Archetype } from '../models';

// ─── Helpers ──────────────────────────────────────────────

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-emerald-600',
  rare: 'border-blue-600',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-800/60',
  uncommon: 'bg-emerald-950/30',
  rare: 'bg-blue-950/30',
};

const TYPE_ICON: Record<string, string> = {
  attack: '\u2694',
  defense: '\uD83D\uDEE1',
  skill: '\u2728',
  reaction: '\u21A9',
};

// ─── Component ────────────────────────────────────────────

export function DeckBuilder() {
  const { deckCards, deckCardIds, addCard, removeCardAt, loadTemplate, aiRules, ownedCardIds } = useGameState();

  const [filterType, setFilterType] = useState<CardType | 'all'>('all');
  const [filterArchetype, setFilterArchetype] = useState<Archetype | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [search, setSearch] = useState('');
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Count occurrences of each card id in deck
  const deckCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of deckCardIds) {
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [deckCardIds]);

  // Deduplicated deck for display
  const deckDisplay = useMemo(() => {
    const seen = new Set<string>();
    const items: { card: Card; count: number; firstIndex: number }[] = [];
    deckCardIds.forEach((id, idx) => {
      if (!seen.has(id)) {
        seen.add(id);
        const card = getCardById(id);
        if (card) items.push({ card, count: deckCounts[id], firstIndex: idx });
      }
    });
    return items;
  }, [deckCardIds, deckCounts]);

  // Deduplicated owned cards for library display
  const ownedUnique = useMemo(() => {
    const seen = new Set<string>();
    const cards: Card[] = [];
    for (const id of ownedCardIds) {
      if (!seen.has(id)) {
        seen.add(id);
        const card = getCardById(id);
        if (card) cards.push(card);
      }
    }
    return cards;
  }, [ownedCardIds]);

  // Filtered library (from owned cards)
  const filteredCards = useMemo(() => {
    return ownedUnique.filter((c) => {
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterArchetype !== 'all' && c.archetype !== filterArchetype) return false;
      if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ownedUnique, filterType, filterArchetype, filterRarity, search]);

  // Deck stats
  const stats = useMemo(() => {
    const types: Record<string, number> = { attack: 0, defense: 0, skill: 0, reaction: 0 };
    const archetypes: Record<string, number> = { neutral: 0, berserker: 0, poison: 0, shield: 0 };
    let totalCost = 0;
    for (const card of deckCards) {
      types[card.type] = (types[card.type] || 0) + 1;
      archetypes[card.archetype] = (archetypes[card.archetype] || 0) + 1;
      totalCost += card.cost;
    }
    const avgCost = deckCards.length > 0 ? (totalCost / deckCards.length).toFixed(1) : '0';
    return { types, archetypes, avgCost };
  }, [deckCards]);

  const handleRemoveOne = (cardId: string) => {
    // Find last occurrence and remove it
    const idx = deckCardIds.lastIndexOf(cardId);
    if (idx >= 0) removeCardAt(idx);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">Deck Builder</h2>
          <span className={`text-sm font-mono px-2 py-0.5 rounded ${deckCards.length < DECK_MIN ? 'bg-red-900/40 text-red-400' : deckCards.length >= DECK_MAX ? 'bg-amber-900/40 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
            {deckCards.length}/{DECK_MAX}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Load Template
            </button>
            {showTemplates && (
              <div className="absolute right-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                {starterTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { loadTemplate(t); setShowTemplates(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-gray-500">{t.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowTest(true)}
            className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Test Deck
          </button>
        </div>
      </div>

      {/* Main content: two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Your Deck */}
        <div className="w-80 border-r border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-2 border-b border-gray-800 flex-shrink-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Your Deck</p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
            {deckDisplay.length === 0 && (
              <p className="text-sm text-gray-600 italic text-center py-8">Deck is empty. Add cards from the library.</p>
            )}
            {deckDisplay.map(({ card, count }) => (
              <div
                key={card.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded border ${RARITY_BORDER[card.rarity]} ${RARITY_BG[card.rarity]} cursor-pointer hover:brightness-125 transition-all group`}
                onClick={() => handleRemoveOne(card.id)}
                onContextMenu={(e) => { e.preventDefault(); setDetailCard(card); }}
              >
                {/* Cost */}
                <span className="w-5 h-5 rounded-full bg-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {card.cost}
                </span>
                {/* Type icon */}
                <span className="text-xs flex-shrink-0">{TYPE_ICON[card.type] || ''}</span>
                {/* Name */}
                <span className="text-xs flex-1 truncate">{card.name}</span>
                {/* Count */}
                {count > 1 && (
                  <span className="text-[10px] text-gray-500 font-mono">x{count}</span>
                )}
                {/* Remove hint */}
                <span className="text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  -
                </span>
              </div>
            ))}
          </div>

          {/* Deck stats */}
          <div className="border-t border-gray-800 px-3 py-2 flex-shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Deck Stats</p>
            {/* Avg cost */}
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Avg Cost</span>
              <span className="text-white font-mono">{stats.avgCost}</span>
            </div>
            {/* Type distribution bar */}
            <div className="mb-1.5">
              <p className="text-[10px] text-gray-600 mb-0.5">Types</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                {deckCards.length > 0 && (
                  <>
                    <div className="bg-red-600 transition-all" style={{ width: `${(stats.types.attack / deckCards.length) * 100}%` }} title={`Attack: ${stats.types.attack}`} />
                    <div className="bg-sky-600 transition-all" style={{ width: `${(stats.types.defense / deckCards.length) * 100}%` }} title={`Defense: ${stats.types.defense}`} />
                    <div className="bg-yellow-600 transition-all" style={{ width: `${(stats.types.skill / deckCards.length) * 100}%` }} title={`Skill: ${stats.types.skill}`} />
                    <div className="bg-purple-600 transition-all" style={{ width: `${(stats.types.reaction / deckCards.length) * 100}%` }} title={`Reaction: ${stats.types.reaction}`} />
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-0.5 text-[9px] text-gray-600">
                <span><span className="text-red-400">{'\u25CF'}</span> ATK {stats.types.attack}</span>
                <span><span className="text-sky-400">{'\u25CF'}</span> DEF {stats.types.defense}</span>
                <span><span className="text-yellow-400">{'\u25CF'}</span> SKL {stats.types.skill}</span>
                <span><span className="text-purple-400">{'\u25CF'}</span> RCT {stats.types.reaction}</span>
              </div>
            </div>
            {/* Archetype distribution bar */}
            <div>
              <p className="text-[10px] text-gray-600 mb-0.5">Archetypes</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                {deckCards.length > 0 && (
                  <>
                    <div className="bg-gray-500 transition-all" style={{ width: `${(stats.archetypes.neutral / deckCards.length) * 100}%` }} />
                    <div className="bg-red-700 transition-all" style={{ width: `${(stats.archetypes.berserker / deckCards.length) * 100}%` }} />
                    <div className="bg-green-700 transition-all" style={{ width: `${(stats.archetypes.poison / deckCards.length) * 100}%` }} />
                    <div className="bg-sky-700 transition-all" style={{ width: `${(stats.archetypes.shield / deckCards.length) * 100}%` }} />
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-0.5 text-[9px] text-gray-600">
                <span><span className="text-gray-400">{'\u25CF'}</span> NTR {stats.archetypes.neutral}</span>
                <span><span className="text-red-400">{'\u25CF'}</span> BRK {stats.archetypes.berserker}</span>
                <span><span className="text-green-400">{'\u25CF'}</span> PSN {stats.archetypes.poison}</span>
                <span><span className="text-sky-400">{'\u25CF'}</span> SHL {stats.archetypes.shield}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel: Card Library */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter bar */}
          <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2 flex-wrap flex-shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-600 w-36 focus:outline-none focus:border-gray-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CardType | 'all')}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="attack">Attack</option>
              <option value="defense">Defense</option>
              <option value="skill">Skill</option>
              <option value="reaction">Reaction</option>
            </select>
            <select
              value={filterArchetype}
              onChange={(e) => setFilterArchetype(e.target.value as Archetype | 'all')}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none"
            >
              <option value="all">All Archetypes</option>
              <option value="neutral">Neutral</option>
              <option value="berserker">Berserker</option>
              <option value="poison">Poison</option>
              <option value="shield">Shield</option>
            </select>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
            </select>
            <span className="text-[10px] text-gray-600 ml-auto">{filteredCards.length} cards</span>
          </div>

          {/* Card grid */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
              {filteredCards.map((card) => {
                const inDeck = deckCounts[card.id] || 0;
                return (
                  <div
                    key={card.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${RARITY_BORDER[card.rarity]} ${RARITY_BG[card.rarity]} cursor-pointer hover:brightness-125 transition-all ${inDeck > 0 ? 'ring-1 ring-blue-500/30' : ''}`}
                    onClick={() => addCard(card.id)}
                    onContextMenu={(e) => { e.preventDefault(); setDetailCard(card); }}
                  >
                    {/* Cost orb */}
                    <span className="w-6 h-6 rounded-full bg-blue-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 border border-blue-500/50">
                      {card.cost}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{TYPE_ICON[card.type]}</span>
                        <span className="text-sm font-medium truncate">{card.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">
                        {card.effects.map((e) => {
                          const v = typeof e.value === 'number' ? e.value : '';
                          switch (e.type) {
                            case 'damage': return `${v} dmg`;
                            case 'damage_aoe': return `${v} AoE`;
                            case 'block': return `${v} blk`;
                            case 'heal': return `${v} heal`;
                            case 'poison': return `${v} psn`;
                            case 'weakness': return `${v} weak`;
                            case 'vulnerability': return `${v} vuln`;
                            case 'str': return `+${v} STR`;
                            case 'dex': return `+${v} DEX`;
                            case 'thorn': return `+${v} thorn`;
                            case 'draw': return `draw ${v}`;
                            case 'energy': return `+${v} energy`;
                            default: return e.type;
                          }
                        }).join(', ')}
                      </p>
                    </div>

                    {/* In-deck indicator */}
                    {inDeck > 0 && (
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-900/40 px-1.5 py-0.5 rounded flex-shrink-0">
                        {'\u2713'}{inDeck}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailCard && <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} />}

      {/* Quick test popup */}
      {showTest && (
        <QuickTestPopup
          deckCards={deckCards}
          aiRules={aiRules}
          onClose={() => setShowTest(false)}
        />
      )}
    </div>
  );
}
