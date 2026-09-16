import type { ProductCategory, OrderItem } from '../lib/types';
import { formatCurrency } from '../lib/data';

interface CategoryStepProps {
  onSelectCategory: (category: ProductCategory) => void;
  onViewCart: () => void;
  cartItems: OrderItem[];
}

const categories: {
  id: ProductCategory;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string;
}[] = [
  {
    id: 'lanche',
    name: 'Sanduíches',
    subtitle: 'Hambúrgueres e passaportes',
    emoji: '🍔',
    gradient: 'from-blue-500 to-blue-700',
  },
  {
    id: 'acompanhamento',
    name: 'Acompanhamentos',
    subtitle: 'Batatas, porções, entradas',
    emoji: '🍟',
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    id: 'bebida',
    name: 'Bebidas',
    subtitle: 'Refrigerantes',
    emoji: '🥤',
    gradient: 'from-blue-400 to-blue-600',
  },
];

export default function CategoryStep({
  onSelectCategory,
  onViewCart,
  cartItems,
}: CategoryStepProps) {
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const hasCart = cartItems.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8 mt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Novo Pedido
        </h1>
        <p className="text-gray-600 text-base">
          Toque em uma categoria para começar
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4 sm:gap-5 pb-24">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`relative w-full p-5 sm:p-7 rounded-3xl bg-gradient-to-br ${cat.gradient} text-white text-left shadow-lg shadow-blue-200 active:scale-[0.98] transition-all duration-150 overflow-hidden group`}
          >
            <div className="absolute -right-6 -top-6 text-9xl opacity-20 group-active:scale-110 transition-transform">
              {cat.emoji}
            </div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl sm:text-5xl shadow-inner">
                {cat.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                  {cat.name}
                </h2>
                <p className="text-white/80 text-sm sm:text-base mt-1">
                  {cat.subtitle}
                </p>
              </div>
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasCart && (
        <div className="sticky bottom-0 mt-auto z-20 -mx-1 bg-white/95 backdrop-blur-sm pt-4 pb-1">
          <button
            onClick={onViewCart}
            className="w-full p-4 sm:p-5 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-300 active:bg-blue-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-2xl">
                    🛒
                  </div>
                  <span className="absolute -top-2 -right-2 min-w-[26px] h-6 px-1.5 rounded-full bg-white text-blue-700 text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm text-white/80 font-medium">
                    Ver carrinho
                  </div>
                  <div className="text-xs text-white/70">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} adicionados
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <div className="text-xs text-white/80 mt-0.5">Ir para pagamento →</div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
