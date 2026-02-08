import { useState, useMemo } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { getCardById, craftingConfig, getRandomCard } from '../../data/gameData';
import type { Card, Rarity } from '../../models';

interface AnvilStationProps {
  onBack: () => void;
}

type AnvilTab = 'enhance' | 'transmute' | 'dismantle' | 'craft';

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

const NEXT_RARITY: Record<string, Rarity> = {
  common: 'uncommon',
  uncommon: 'rare',
};

export function AnvilStation({ onBack }: AnvilStationProps) {
  const { ownedCardIds, removeOwnedCard, addOwnedCard, shards, addShards, spendShards, stationLevels } = useGameState();
  const [tab, setTab] = useState<AnvilTab>('enhance');

  const tabs: { id: AnvilTab; label: string; locked?: boolean }[] = [
    { id: 'enhance', label: 'Enhance' },
    { id: 'transmute', label: 'Transmute' },
    { id: 'dismantle', label: 'Dismantle' },
    { id: 'craft', label: 'Craft', locked: stationLevels.anvil < 2 },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-2.5 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">&larr; Back</button>
        <h2 className="text-lg font-bold">{'\u2692\uFE0F'} Anvil</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-500 text-sm">{'\u2B50'}</span>
          <span className="font-mono text-cyan-300 text-sm">{shards}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => !t.locked && setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? 'text-white border-orange-500'
                : t.locked
                ? 'text-gray-700 border-transparent cursor-not-allowed'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {t.label}
            {t.locked && <span className="ml-1 text-[9px] text-gray-700">(Lv2)</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'enhance' && <EnhanceTab ownedCardIds={ownedCardIds} />}
        {tab === 'transmute' && <TransmuteTab ownedCardIds={ownedCardIds} removeOwnedCard={removeOwnedCard} addOwnedCard={addOwnedCard} />}
        {tab === 'dismantle' && <DismantleTab ownedCardIds={ownedCardIds} removeOwnedCard={removeOwnedCard} addShards={addShards} />}
        {tab === 'craft' && <CraftTab shards={shards} spendShards={spendShards} addOwnedCard={addOwnedCard} />}
      </div>
    </div>
  );
}

// ─── Enhance Tab ─────────────────────────────────────────

function formatEffectShort(type: string, value: number | boolean): string {
  const v = typeof value === 'number' ? value : '';
  switch (type) {
    case 'damage': return `${v} dmg`;
    case 'damage_aoe': return `${v} AoE`;
    case 'block': return `${v} blk`;
    case 'heal': return `${v} heal`;
    case 'poison': return `${v} psn`;
    case 'poison_aoe': return `${v} psn AoE`;
    case 'poison_multiply': return `x${v} psn`;
    case 'poison_self': return `${v} self-psn`;
    case 'weakness': return `${v} weak`;
    case 'vulnerability': return `${v} vuln`;
    case 'vulnerability_self': return `${v} self-vuln`;
    case 'str': return `+${v} STR`;
    case 'str_per_turn': return `+${v} STR/t`;
    case 'dex': return `+${v} DEX`;
    case 'thorn': return `+${v} thorn`;
    case 'energy': return `+${v} energy`;
    case 'draw': return `draw ${v}`;
    case 'damage_self': return `-${v} self`;
    case 'damage_ramp': return `+${v}/play`;
    case 'damage_on_hit': return `${v} retl`;
    case 'block_retain': return 'retain blk';
    case 'corpse_explode': return 'explode';
    default: return `${type}`;
  }
}

function EnhanceTab({ ownedCardIds }: { ownedCardIds: string[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Find cards with duplicates
  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of ownedCardIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [ownedCardIds]);

  const duplicateCards = useMemo(() => {
    return [...cardCounts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([id, count]) => ({ card: getCardById(id), id, count }))
      .filter((c) => c.card !== undefined)
      .sort((a, b) => a.card!.name.localeCompare(b.card!.name));
  }, [cardCounts]);

  const selectedCard = selectedId ? getCardById(selectedId) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-gray-400 mb-4">
        Use a duplicate card to enhance the original. Each enhancement level increases stats by 30%.
        Max +3 levels.
      </p>

      {duplicateCards.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No duplicate cards to enhance. Collect more cards!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {duplicateCards.map(({ card, id, count }) => (
            <button
              key={id}
              onClick={() => setSelectedId(id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedId === id
                  ? 'border-orange-500 bg-orange-900/20'
                  : `${RARITY_BORDER[card!.rarity]} ${RARITY_BG[card!.rarity]} hover:brightness-125`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{card!.name}</span>
                <span className="text-xs text-gray-500">x{count}</span>
              </div>
              <p className="text-[10px] text-gray-500 capitalize">{card!.rarity} {card!.type}</p>
            </button>
          ))}
        </div>
      )}

      {selectedCard && (
        <div className="bg-gray-800 border border-orange-700/50 rounded-lg p-4">
          <h4 className="font-bold text-white mb-2">{selectedCard.name}</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current</p>
              {selectedCard.effects.map((eff, i) => (
                <p key={i} className="text-sm text-gray-300">{formatEffectShort(eff.type, eff.value)}</p>
              ))}
            </div>
            <div>
              <p className="text-xs text-orange-400 mb-1">After +1 Enhancement</p>
              {selectedCard.effects.map((eff, i) => (
                <p key={i} className="text-sm text-orange-300">
                  {formatEffectShort(eff.type, typeof eff.value === 'number' ? Math.floor(eff.value * 1.3) : eff.value)}
                </p>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">Cost: 1 duplicate card consumed</p>
          <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors text-sm font-medium">
            Enhance to +1
          </button>
          <p className="text-[10px] text-gray-600 mt-2 italic">
            Note: Card enhancement tracking coming in a future update.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Transmute Tab ───────────────────────────────────────

function TransmuteTab({ ownedCardIds, removeOwnedCard, addOwnedCard }: {
  ownedCardIds: string[];
  removeOwnedCard: (id: string) => void;
  addOwnedCard: (id: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<Card | null>(null);

  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of ownedCardIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [ownedCardIds]);

  // Get the rarity of selected cards (all must match)
  const selectedRarity = selectedIds.length > 0 ? getCardById(selectedIds[0])?.rarity : null;
  const nextRarity = selectedRarity ? NEXT_RARITY[selectedRarity] : null;

  // Cards eligible for transmutation (same rarity, not rare)
  const eligibleCards = useMemo(() => {
    return [...cardCounts.entries()]
      .map(([id, count]) => ({ card: getCardById(id), id, count }))
      .filter((c) => c.card !== undefined && c.card.rarity !== 'rare')
      .sort((a, b) => a.card!.name.localeCompare(b.card!.name));
  }, [cardCounts]);

  const handleSelect = (cardId: string) => {
    if (result) return;
    if (selectedIds.length >= 3) return;
    const card = getCardById(cardId);
    if (!card) return;
    if (selectedIds.length > 0 && card.rarity !== selectedRarity) return;
    setSelectedIds((prev) => [...prev, cardId]);
  };

  const handleRemoveSlot = (index: number) => {
    setSelectedIds((prev) => { const n = [...prev]; n.splice(index, 1); return n; });
  };

  const handleTransmute = () => {
    if (selectedIds.length !== 3 || !nextRarity) return;
    for (const id of selectedIds) {
      removeOwnedCard(id);
    }
    const newCard = getRandomCard(nextRarity);
    addOwnedCard(newCard.id);
    setResult(newCard);
    setSelectedIds([]);
  };

  const handleClear = () => {
    setSelectedIds([]);
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-gray-400 mb-4">
        Combine 3 cards of the same rarity to get 1 random card of the next rarity.
      </p>

      {/* Slots */}
      <div className="flex items-center gap-3 justify-center mb-6">
        {[0, 1, 2].map((i) => {
          const cardId = selectedIds[i];
          const card = cardId ? getCardById(cardId) : null;
          return (
            <button
              key={i}
              onClick={() => cardId ? handleRemoveSlot(i) : undefined}
              className={`w-28 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                card
                  ? `${RARITY_BORDER[card.rarity]} ${RARITY_BG[card.rarity]} border-solid cursor-pointer hover:brightness-125`
                  : 'border-gray-700 text-gray-700'
              }`}
            >
              {card ? (
                <>
                  <span className="text-xs font-medium text-white truncate px-1">{card.name}</span>
                  <span className="text-[9px] text-gray-400 capitalize">{card.rarity}</span>
                </>
              ) : (
                <span className="text-xs">Card {i + 1}</span>
              )}
            </button>
          );
        })}
        <span className="text-gray-600 text-lg">&rarr;</span>
        <div className={`w-28 h-20 rounded-lg border-2 flex flex-col items-center justify-center ${
          result
            ? `${RARITY_BORDER[result.rarity]} ${RARITY_BG[result.rarity]} border-solid`
            : nextRarity
            ? 'border-dashed border-blue-700 text-blue-700'
            : 'border-dashed border-gray-700 text-gray-700'
        }`}>
          {result ? (
            <>
              <span className="text-xs font-medium text-white truncate px-1">{result.name}</span>
              <span className="text-[9px] text-blue-400 capitalize">{result.rarity}</span>
            </>
          ) : (
            <span className="text-xs">?? {nextRarity ?? '???'}</span>
          )}
        </div>
      </div>

      {/* Transmute button */}
      <div className="text-center mb-6">
        {result ? (
          <button onClick={handleClear} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
            Done
          </button>
        ) : (
          <button
            onClick={handleTransmute}
            disabled={selectedIds.length !== 3 || !nextRarity}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            Transmute
          </button>
        )}
      </div>

      {/* Card list */}
      <div className="grid grid-cols-2 gap-2">
        {eligibleCards.map(({ card, id, count }) => {
          const isSelected = selectedIds.filter((s) => s === id).length;
          const disabled = selectedIds.length >= 3 || (selectedRarity !== null && card!.rarity !== selectedRarity);
          const available = count - isSelected;
          return (
            <button
              key={id}
              onClick={() => available > 0 && handleSelect(id)}
              disabled={disabled || available <= 0}
              className={`text-left p-2.5 rounded-lg border transition-all ${
                disabled || available <= 0
                  ? 'border-gray-800 opacity-40 cursor-not-allowed'
                  : `${RARITY_BORDER[card!.rarity]} ${RARITY_BG[card!.rarity]} hover:brightness-125`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{card!.name}</span>
                <span className="text-xs text-gray-500">x{available}</span>
              </div>
              <p className="text-[10px] text-gray-500 capitalize">{card!.rarity}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dismantle Tab ───────────────────────────────────────

function DismantleTab({ ownedCardIds, removeOwnedCard, addShards }: {
  ownedCardIds: string[];
  removeOwnedCard: (id: string) => void;
  addShards: (amount: number) => void;
}) {
  const [confirmCard, setConfirmCard] = useState<{ card: Card; id: string } | null>(null);

  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of ownedCardIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [ownedCardIds]);

  const cards = useMemo(() => {
    return [...cardCounts.entries()]
      .map(([id, count]) => ({ card: getCardById(id), id, count }))
      .filter((c) => c.card !== undefined)
      .sort((a, b) => a.card!.name.localeCompare(b.card!.name));
  }, [cardCounts]);

  const handleDismantle = () => {
    if (!confirmCard) return;
    const shardYield = craftingConfig.dismantleYield[confirmCard.card.rarity] ?? 10;
    removeOwnedCard(confirmCard.id);
    addShards(shardYield);
    setConfirmCard(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-gray-400 mb-4">
        Dismantle cards into shards. Common={craftingConfig.dismantleYield.common},
        Uncommon={craftingConfig.dismantleYield.uncommon},
        Rare={craftingConfig.dismantleYield.rare} shards.
      </p>

      {/* Confirmation dialog */}
      {confirmCard && (
        <div className="bg-gray-800 border border-red-700/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-white mb-2">
            Dismantle <strong>{confirmCard.card.name}</strong> for{' '}
            <span className="text-cyan-400">
              {craftingConfig.dismantleYield[confirmCard.card.rarity] ?? 10} shards
            </span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDismantle}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
            >
              Dismantle
            </button>
            <button
              onClick={() => setConfirmCard(null)}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="space-y-1">
        {cards.map(({ card, id, count }) => {
          const shardYield = craftingConfig.dismantleYield[card!.rarity] ?? 10;
          return (
            <button
              key={id}
              onClick={() => setConfirmCard({ card: card!, id })}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${RARITY_BORDER[card!.rarity]} ${RARITY_BG[card!.rarity]} hover:brightness-125 flex items-center justify-between`}
            >
              <div>
                <span className="text-sm text-white">{card!.name}</span>
                <span className="text-xs text-gray-500 ml-2 capitalize">{card!.rarity} {card!.type}</span>
              </div>
              <div className="flex items-center gap-3">
                {count > 1 && <span className="text-xs text-gray-500">x{count}</span>}
                <span className="text-xs text-cyan-400">+{shardYield} {'\u2B50'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Craft Tab ───────────────────────────────────────────

function CraftTab({ shards, spendShards, addOwnedCard }: {
  shards: number;
  spendShards: (amount: number) => boolean;
  addOwnedCard: (id: string) => void;
}) {
  const [lastCrafted, setLastCrafted] = useState<Card | null>(null);

  const rarities: { rarity: Rarity; label: string; cost: number; color: string }[] = [
    { rarity: 'common', label: 'Common', cost: craftingConfig.craftCost.common, color: 'border-gray-600' },
    { rarity: 'uncommon', label: 'Uncommon', cost: craftingConfig.craftCost.uncommon, color: 'border-blue-600' },
    { rarity: 'rare', label: 'Rare', cost: craftingConfig.craftCost.rare, color: 'border-amber-600' },
  ];

  const handleCraft = (rarity: Rarity, cost: number) => {
    if (!spendShards(cost)) return;
    const card = getRandomCard(rarity);
    addOwnedCard(card.id);
    setLastCrafted(card);
  };

  return (
    <div className="max-w-md mx-auto">
      <p className="text-sm text-gray-400 mb-6">
        Spend shards to craft a random card of a chosen rarity.
      </p>

      <div className="space-y-3 mb-6">
        {rarities.map(({ rarity, label, cost, color }) => (
          <button
            key={rarity}
            onClick={() => handleCraft(rarity, cost)}
            disabled={shards < cost}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${color} ${
              shards >= cost
                ? 'hover:brightness-125 cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">{label} Card</span>
                <p className="text-[10px] text-gray-400">Random {label.toLowerCase()} card</p>
              </div>
              <span className={`text-sm font-mono ${shards >= cost ? 'text-cyan-400' : 'text-gray-600'}`}>
                {cost} {'\u2B50'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {lastCrafted && (
        <div className="bg-gray-800 border border-cyan-700/50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">You crafted:</p>
          <p className="text-lg font-bold text-white">{lastCrafted.name}</p>
          <p className="text-xs text-gray-400 capitalize">{lastCrafted.rarity} {lastCrafted.type}</p>
        </div>
      )}
    </div>
  );
}
