import type { OrderItem } from '../lib/types';
import { formatCurrency } from '../lib/data';

interface CartStepProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem: (item: OrderItem) => void;
  onAddMore: () => void;
  onGoToPayment: () => void;
}

export default function CartStep({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onAddMore,
  onGoToPayment,
}: CartStepProps) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">
            🛒
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Carrinho</h1>
            <p className="text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? 'item adicionado' : 'itens adicionados'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border-2 border-gray-200 p-4 active:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => onEditItem(item)}
                className="flex items-start gap-3 flex-1 text-left min-w-0"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                  {item.product.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-base truncate">
                      {item.product.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                      {item.quantity}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCurrency(item.product.price)} un. •{' '}
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </p>
                  {item.observations && (
                    <p className="mt-2 text-xs text-gray-700 italic bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                      📝 {item.observations}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    ✏️ Toque para editar
                  </p>
                </div>
              </button>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-2.5 rounded-xl text-gray-400 active:text-red-500 active:bg-red-50 transition-colors flex-shrink-0"
                aria-label="Remover item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-xl flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-black text-xl text-blue-700">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-11 h-11 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center active:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                >
                  +
                </button>
              </div>
              <span className="font-black text-lg text-gray-900">
                {formatCurrency(item.product.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t-2 border-gray-200 bg-white space-y-3 mt-auto">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Total do pedido</p>
              <p className="text-xs text-blue-600">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </p>
            </div>
            <p className="text-3xl font-black text-blue-800">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onAddMore}
            className="py-4 rounded-2xl font-bold text-blue-700 bg-blue-50 border-2 border-blue-200 active:bg-blue-100 transition-colors text-base"
          >
            + Adicionar mais itens
          </button>
          <button
            onClick={onGoToPayment}
            className="py-4 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-200"
          >
            💳 Ir para pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
