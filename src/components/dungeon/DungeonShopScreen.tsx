import type { ShopState } from '../../models/Dungeon';

interface DungeonShopScreenProps {
  shop: ShopState;
  gold: number;
  onBuyCard: (index: number) => boolean;
  onBuyHeal: () => boolean;
  onBuyRemoval: () => void;
  onLeave: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-blue-500',
  rare: 'border-amber-500',
};

export function DungeonShopScreen({ shop, gold, onBuyCard, onBuyHeal, onBuyRemoval, onLeave }: DungeonShopScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-900 border border-green-800/50 rounded-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-2xl">{'\uD83D\uDED2'}</span>
          <h2 className="text-xl font-bold text-green-300 mt-2">Shop</h2>
          <p className="text-sm text-yellow-400 mt-1">Gold: {gold}</p>
        </div>

        {/* Cards for sale */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Cards</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {shop.cards.map((item, i) => (
              <button
                key={i}
                onClick={() => onBuyCard(i)}
                disabled={item.sold || gold < item.price}
                className={`w-40 border-2 ${RARITY_BORDER[item.card.rarity] ?? 'border-gray-600'} rounded-lg p-3 transition-all text-left ${
                  item.sold
                    ? 'opacity-30 cursor-not-allowed'
                    : gold < item.price
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:brightness-125 hover:scale-105'
                } bg-gray-800/60`}
              >
                <p className="text-sm font-bold text-white truncate">{item.card.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{item.card.rarity} {item.card.type}</p>
                <p className="text-xs text-blue-400 mt-1">Cost: {item.card.cost} energy</p>
                <div className="mt-1.5 space-y-0.5">
                  {item.card.effects.slice(0, 2).map((eff, j) => (
                    <p key={j} className="text-[10px] text-gray-300">
                      {eff.type}: {String(eff.value)}
                    </p>
                  ))}
                </div>
                <div className="mt-2 border-t border-gray-700 pt-1.5">
                  {item.sold ? (
                    <span className="text-xs text-red-400">SOLD</span>
                  ) : (
                    <span className={`text-xs font-bold ${gold >= item.price ? 'text-yellow-400' : 'text-gray-600'}`}>
                      {item.price}G
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Services</p>
          <div className="flex gap-3 justify-center">
            {/* Heal Flask */}
            <button
              onClick={onBuyHeal}
              disabled={shop.healFlask.sold || gold < shop.healFlask.price}
              className={`px-4 py-3 border border-gray-700 rounded-lg transition-all ${
                shop.healFlask.sold
                  ? 'opacity-30 cursor-not-allowed'
                  : gold < shop.healFlask.price
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-green-500 hover:bg-green-900/10'
              }`}
            >
              <p className="text-sm text-white">Healing Flask</p>
              <p className="text-xs text-gray-400">+{shop.healFlask.healAmount} HP</p>
              {shop.healFlask.sold ? (
                <span className="text-xs text-red-400">SOLD</span>
              ) : (
                <span className={`text-xs font-bold ${gold >= shop.healFlask.price ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {shop.healFlask.price}G
                </span>
              )}
            </button>

            {/* Card Removal */}
            <button
              onClick={onBuyRemoval}
              disabled={gold < shop.removalPrice}
              className={`px-4 py-3 border border-gray-700 rounded-lg transition-all ${
                gold < shop.removalPrice
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-red-500 hover:bg-red-900/10'
              }`}
            >
              <p className="text-sm text-white">Remove a Card</p>
              <p className="text-xs text-gray-400">Delete one card from deck</p>
              <span className={`text-xs font-bold ${gold >= shop.removalPrice ? 'text-yellow-400' : 'text-gray-600'}`}>
                {shop.removalPrice}G
              </span>
            </button>
          </div>
        </div>

        {/* Leave */}
        <div className="text-center">
          <button
            onClick={onLeave}
            className="px-6 py-2 text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-lg hover:border-gray-500"
          >
            Leave Shop
          </button>
        </div>
      </div>
    </div>
  );
}
