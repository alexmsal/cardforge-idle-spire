interface HpBarProps {
  current: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  height?: string;
}

export function HpBar({ current, max, color = 'bg-red-600', showLabel = true, height = 'h-3' }: HpBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-center text-gray-400 mt-0.5 font-mono">
          {current}/{max}
        </p>
      )}
    </div>
  );
}
