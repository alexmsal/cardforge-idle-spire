import type { DungeonMap, MapNode, NodeType } from '../../models/Dungeon';

interface DungeonMapViewProps {
  map: DungeonMap;
  currentNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

const NODE_ICONS: Record<NodeType, string> = {
  battle: '\u2694\uFE0F',
  elite: '\uD83D\uDDE1\uFE0F',
  event: '\u2753',
  shop: '\uD83D\uDED2',
  chest: '\uD83D\uDCE6',
  rest: '\uD83D\uDD25',
  boss: '\uD83D\uDC80',
};

const NODE_COLORS: Record<NodeType, string> = {
  battle: 'border-red-600 bg-red-900/30',
  elite: 'border-amber-500 bg-amber-900/30',
  event: 'border-purple-500 bg-purple-900/30',
  shop: 'border-green-500 bg-green-900/30',
  chest: 'border-yellow-500 bg-yellow-900/30',
  rest: 'border-cyan-500 bg-cyan-900/30',
  boss: 'border-red-500 bg-red-900/50',
};

const NODE_LABELS: Record<NodeType, string> = {
  battle: 'Battle',
  elite: 'Elite',
  event: 'Event',
  shop: 'Shop',
  chest: 'Chest',
  rest: 'Rest',
  boss: 'Boss',
};

export function DungeonMapView({ map, currentNodeId, onSelectNode }: DungeonMapViewProps) {
  // Render floors bottom-to-top (floor 1 at bottom)
  const floorsReversed = [...map.floors].reverse();

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {floorsReversed.map((floorNodes, reversedIdx) => {
        const floorNum = map.totalFloors - reversedIdx;
        return (
          <div key={floorNum} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">
              Floor {floorNum}
            </span>
            <div className="flex gap-4">
              {floorNodes.map((node) => (
                <MapNodeButton
                  key={node.id}
                  node={node}
                  isCurrent={node.id === currentNodeId}
                  onClick={() => onSelectNode(node.id)}
                />
              ))}
            </div>
            {/* Connection lines to next floor */}
            {reversedIdx < floorsReversed.length - 1 && (
              <ConnectionLines
                fromNodes={floorNodes}
                toNodes={floorsReversed[reversedIdx + 1]}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MapNodeButton({ node, isCurrent, onClick }: { node: MapNode; isCurrent: boolean; onClick: () => void }) {
  const colorClass = NODE_COLORS[node.type];
  const isClickable = node.available && !node.visited;
  const isVisited = node.visited;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all
        ${colorClass}
        ${isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}
        ${isClickable ? 'hover:scale-110 cursor-pointer hover:brightness-125' : ''}
        ${isVisited ? 'opacity-40' : ''}
        ${!isClickable && !isVisited ? 'opacity-25 cursor-not-allowed' : ''}
      `}
      title={`${NODE_LABELS[node.type]} (Floor ${node.floor})`}
    >
      <span className="text-lg">{NODE_ICONS[node.type]}</span>
      <span className="text-[9px] text-gray-300 mt-0.5">{NODE_LABELS[node.type]}</span>
    </button>
  );
}

function ConnectionLines({ fromNodes, toNodes }: { fromNodes: MapNode[]; toNodes: MapNode[] }) {
  // Simple text-based connections
  const hasConnections = fromNodes.some((n) => n.connections.length > 0);
  if (!hasConnections) return null;

  return (
    <div className="h-4 flex items-center justify-center">
      <div className="text-gray-700 text-xs">|</div>
    </div>
  );
}
