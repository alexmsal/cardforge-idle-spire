import { useState, useCallback, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import { QuickTestPopup } from './QuickTestPopup';
import { MAX_AI_RULES } from '../data/gameData';
import type { AIRule, AICondition, AITarget } from '../models';

// ─── Constants ────────────────────────────────────────────

const PARAMETERS = [
  { value: 'always', label: 'Always' },
  { value: 'hp_percent', label: 'HP %' },
  { value: 'block', label: 'Block' },
  { value: 'energy', label: 'Energy' },
  { value: 'enemy_count', label: 'Enemy Count' },
  { value: 'poison_on_enemy', label: 'Poison on Enemy' },
  { value: 'player_poison', label: 'Player Poison' },
  { value: 'player_str', label: 'Player STR' },
  { value: 'hand_size', label: 'Hand Size' },
];

const OPERATORS = ['<', '>', '<=', '>=', '=', '!='] as const;

const TARGETS: { value: AITarget; label: string }[] = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'lowest_hp', label: 'Weakest' },
  { value: 'highest_hp', label: 'Strongest' },
  { value: 'random', label: 'Random' },
  { value: 'self', label: 'Self' },
];

// ─── Rule Row ─────────────────────────────────────────────

interface RuleRowProps {
  rule: AIRule;
  index: number;
  cardOptions: { id: string; name: string }[];
  onUpdate: (index: number, rule: AIRule) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
}

function RuleRow({ rule, index, cardOptions, onUpdate, onRemove, onDragStart, onDragOver, onDragEnd, isDragTarget }: RuleRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isAlways = rule.condition.parameter === 'always';

  const updateCondition = (partial: Partial<AICondition>) => {
    const newCondition = { ...rule.condition, ...partial };
    // If switching to "always", clear operator/value
    if (partial.parameter === 'always') {
      delete newCondition.operator;
      delete newCondition.value;
    }
    // If switching FROM always, set defaults
    if (rule.condition.parameter === 'always' && partial.parameter !== 'always' && partial.parameter !== undefined) {
      newCondition.operator = newCondition.operator ?? '<';
      newCondition.value = newCondition.value ?? 50;
    }
    onUpdate(index, { ...rule, condition: newCondition });
  };

  // Human-readable preview
  const preview = isAlways
    ? 'ALWAYS'
    : `IF ${PARAMETERS.find((p) => p.value === rule.condition.parameter)?.label ?? rule.condition.parameter} ${rule.condition.operator ?? '='} ${rule.condition.value ?? 0}`;
  const cardName = cardOptions.find((c) => c.id === rule.cardId)?.name ?? rule.cardId;
  const targetLabel = TARGETS.find((t) => t.value === rule.target)?.label ?? rule.target;

  return (
    <div
      className={`border rounded-lg p-3 transition-all ${isDragTarget ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-800/60'}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
    >
      {/* Top row: drag handle + priority + preview + delete */}
      <div className="flex items-center gap-2 mb-2">
        <span className="cursor-grab text-gray-600 hover:text-gray-400 text-lg" title="Drag to reorder">{'\u2630'}</span>
        <span className="text-xs font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">#{rule.priority}</span>
        <p className="text-xs text-gray-400 flex-1 truncate">
          {preview} {'\u2192'} Play <span className="text-white font-medium">{cardName}</span> {'\u2192'} TARGET <span className="text-blue-400">{targetLabel}</span>
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-600 hover:text-red-400 transition-colors text-sm p-1"
            title="Delete rule"
          >
            {'\uD83D\uDDD1'}
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-red-400">Delete?</span>
            <button
              onClick={() => onRemove(index)}
              className="px-1.5 py-0.5 text-[10px] bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-1.5 py-0.5 text-[10px] bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Edit row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Condition: parameter */}
        <select
          value={rule.condition.parameter}
          onChange={(e) => updateCondition({ parameter: e.target.value })}
          className="px-1.5 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500"
        >
          {PARAMETERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Condition: operator + value (hidden for "always") */}
        {!isAlways && (
          <>
            <select
              value={rule.condition.operator ?? '<'}
              onChange={(e) => updateCondition({ operator: e.target.value as typeof OPERATORS[number] })}
              className="px-1 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none w-12"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            <input
              type="number"
              value={rule.condition.value ?? 0}
              onChange={(e) => updateCondition({ value: Number(e.target.value) })}
              className="px-1.5 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none w-14"
            />
          </>
        )}

        <span className="text-[10px] text-gray-600">{'\u2192'}</span>

        {/* Card selector */}
        <select
          value={rule.cardId}
          onChange={(e) => onUpdate(index, { ...rule, cardId: e.target.value })}
          className="px-1.5 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none max-w-[140px]"
        >
          <option value="">-- Select Card --</option>
          {cardOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <span className="text-[10px] text-gray-600">{'\u2192'}</span>

        {/* Target selector */}
        <select
          value={rule.target}
          onChange={(e) => onUpdate(index, { ...rule, target: e.target.value as AITarget })}
          className="px-1.5 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none"
        >
          {TARGETS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function AIEditor() {
  const { deckCards, deckCardIds, ownedCards, aiRules, addRule, updateRule, removeRule, moveRule } = useGameState();
  const [showTest, setShowTest] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Card dropdown: show ALL owned cards so rules can reference any card the player has
  const cardOptions = (() => {
    const seen = new Set<string>();
    const options: { id: string; name: string }[] = [];
    // Primary: all owned cards (full collection)
    for (const card of ownedCards) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        options.push({ id: card.id, name: card.name });
      }
    }
    // Also include current deck cards (in case owned list is stale)
    for (const card of deckCards) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        options.push({ id: card.id, name: card.name });
      }
    }
    return options.sort((a, b) => a.name.localeCompare(b.name));
  })();

  const handleDragStart = useCallback((index: number) => {
    dragFrom.current = index;
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIdx(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragFrom.current !== null && dragOverIdx !== null && dragFrom.current !== dragOverIdx) {
      moveRule(dragFrom.current, dragOverIdx);
    }
    dragFrom.current = null;
    setDragOverIdx(null);
  }, [dragOverIdx, moveRule]);

  const handleAddRule = () => {
    const defaultCardId = cardOptions.length > 0 ? cardOptions[0].id : '';
    const newRule: AIRule = {
      priority: aiRules.length + 1,
      condition: { parameter: 'always' },
      cardId: defaultCardId,
      target: 'nearest',
    };
    addRule(newRule);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">AI Rules</h2>
          <span className={`text-sm font-mono px-2 py-0.5 rounded ${aiRules.length >= MAX_AI_RULES ? 'bg-amber-900/40 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
            {aiRules.length}/{MAX_AI_RULES}
          </span>
        </div>
        <button
          onClick={() => setShowTest(true)}
          className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          Test Deck
        </button>
      </div>

      {/* Description */}
      <div className="px-6 py-3 border-b border-gray-800/50 flex-shrink-0">
        <p className="text-xs text-gray-500">
          Rules are evaluated top-to-bottom each time the AI plays a card. The first rule whose condition is met AND whose card is in hand with enough energy will be played. Drag to reorder priority.
        </p>
      </div>

      {/* Rule list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-2">
        {aiRules.length === 0 && (
          <p className="text-sm text-gray-600 italic text-center py-8">No rules defined. Add a rule to get started.</p>
        )}
        {aiRules.map((rule, i) => (
          <RuleRow
            key={`rule-${i}-${rule.priority}`}
            rule={rule}
            index={i}
            cardOptions={cardOptions}
            onUpdate={updateRule}
            onRemove={removeRule}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            isDragTarget={dragOverIdx === i}
          />
        ))}

        {/* Add rule button */}
        {aiRules.length < MAX_AI_RULES && (
          <button
            onClick={handleAddRule}
            className="w-full px-4 py-2.5 border-2 border-dashed border-gray-700 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
          >
            + Add Rule
          </button>
        )}
      </div>

      {/* Deck info footer */}
      <div className="border-t border-gray-800 px-6 py-2 flex-shrink-0">
        <p className="text-[10px] text-gray-600">
          Deck: {deckCardIds.length} cards. Showing {cardOptions.length} unique cards from your collection.
        </p>
      </div>

      {/* Quick test */}
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
