import type { EnemyDef } from '../models';

interface EnemySelectorProps {
  enemies: EnemyDef[];
  selected: EnemyDef;
  onSelect: (enemy: EnemyDef) => void;
}

const TYPE_COLOR: Record<string, string> = {
  normal: 'border-gray-600 hover:border-gray-400',
  elite: 'border-amber-800 hover:border-amber-500',
  boss: 'border-red-800 hover:border-red-500',
};

const TYPE_BG: Record<string, string> = {
  normal: 'bg-gray-800',
  elite: 'bg-amber-950/30',
  boss: 'bg-red-950/30',
};

export function EnemySelector({ enemies, selected, onSelect }: EnemySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {enemies.map((e) => {
        const isSelected = e.id === selected.id;
        const borderColor = TYPE_COLOR[e.type] || TYPE_COLOR.normal;
        const bg = TYPE_BG[e.type] || TYPE_BG.normal;

        return (
          <button
            key={e.id}
            onClick={() => onSelect(e)}
            className={`
              px-3 py-1.5 rounded-lg border text-xs transition-all
              ${bg} ${borderColor}
              ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
          >
            <span className="font-semibold">{e.name}</span>
            <span className="text-gray-500 ml-1">({e.baseHp} HP)</span>
          </button>
        );
      })}
    </div>
  );
}
