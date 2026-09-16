import type { AppStep, OrderItem } from '../lib/types';
import { formatCurrency } from '../lib/data';

interface HeaderProps {
  step: AppStep;
  cartItems: OrderItem[];
  onBack: () => void;
  onCancel: () => void;
  canGoBack: boolean;
  canCancel: boolean;
  totalAmount: number;
}

const stepTitle: Record<AppStep, string> = {
  inicial: 'Novo Pedido',
  categoria: 'Selecionar Categoria',
  produtos: 'Selecionar Produto',
  carrinho: 'Carrinho',
  pagamento: 'Pagamento',
  finalizacao: 'Finalização',
};

export default function Header({
  step,
  cartItems,
  onBack,
  onCancel,
  canGoBack,
  canCancel,
  totalAmount,
}: HeaderProps) {
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
  const isInicial = step === 'inicial';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg shadow-md shadow-blue-200 flex-shrink-0">
            🍴
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-gray-900 text-sm leading-tight truncate">
              PDV Lanchonete
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {stepTitle[step]}
              {!isInicial && totalQty > 0 && (
                <span className="ml-1.5 text-blue-700 font-semibold">
                  • {totalQty} itens ({formatCurrency(totalAmount)})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canGoBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm active:bg-gray-200 transition-colors"
              aria-label="Voltar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-sm active:bg-red-100 transition-colors border border-red-200"
              aria-label="Cancelar pedido"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Cancelar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
