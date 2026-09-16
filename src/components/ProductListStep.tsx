import type { Product, ProductCategory, OrderItem } from '../lib/types';
import { formatCurrency } from '../lib/data';

interface ProductListStepProps {
  category: ProductCategory;
  products: Product[];
  cartItems: OrderItem[];
  onSelectProduct: (product: Product) => void;
  onViewCart: () => void;
}

const categoryInfo: Record<ProductCategory, { name: string; emoji: string; subtitle: string }> = {
  lanche: { name: 'Sanduíches', emoji: '🍔', subtitle: 'Selecione um lanche para ver detalhes' },
  bebida: { name: 'Bebidas', emoji: '🥤', subtitle: 'Selecione uma bebida para ver detalhes' },
  acompanhamento: { name: 'Acompanhamentos', emoji: '🍟', subtitle: 'Selecione um acompanhamento' },
};

export default function ProductListStep({
  category,
  products,
  cartItems,
  onSelectProduct,
  onViewCart,
}: ProductListStepProps) {
  const info = categoryInfo[category];
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const hasCart = cartItems.length > 0;

  const getQuantityInCart = (productId: string) =>
    cartItems
      .filter((i) => i.product.id === productId)
      .reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">
            {info.emoji}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{info.name}</h1>
            <p className="text-sm text-gray-600">{info.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {products.map((product) => {
            const qty = getQuantityInCart(product.id);
            return (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] ${
                  qty > 0
                    ? 'bg-blue-50 border-blue-400 shadow-md shadow-blue-100'
                    : 'bg-white border-gray-200 hover:border-blue-300 active:border-blue-400'
                }`}
              >
                {qty > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {qty}x
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                    {product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-snug">
                      {product.description}
                    </p>
                    <p className="mt-2 text-lg font-bold text-blue-700">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
                <div className={`mt-3 w-full py-2.5 rounded-xl text-center font-semibold text-sm ${
                  qty > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {qty > 0 ? `Editar / Adicionar mais` : 'Selecionar →'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {hasCart && (
        <div className="sticky bottom-0 mt-auto z-20 -mx-1 bg-white/95 backdrop-blur-sm pt-4 pb-1">
          <button
            onClick={onViewCart}
            className="w-full p-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 active:bg-blue-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className="text-xl">🛒</span>
                  <span className="absolute -top-2 -right-3 min-w-[22px] h-5 px-1 rounded-full bg-white text-blue-700 text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <span className="text-sm font-medium text-white/90">
                  Ver carrinho ({totalItems} itens)
                </span>
              </div>
              <div className="text-xl font-bold">{formatCurrency(totalValue)}</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
