import type { OrderItem, PaymentEntry } from '../lib/types';
import { formatCurrency, paymentMethods } from '../lib/data';

interface FinalizeStepProps {
  items: OrderItem[];
  payments: PaymentEntry[];
  totalAmount: number;
  orderNumber: string;
  createdAt: Date;
  onBackToPayment: () => void;
  onConfirmPrint: () => void;
}

export default function FinalizeStep({
  items,
  payments,
  totalAmount,
  orderNumber,
  createdAt,
  onBackToPayment,
  onConfirmPrint,
}: FinalizeStepProps) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const formatTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-5xl mb-4 shadow-md shadow-green-100">
          ✅
        </div>
        <h1 className="text-2xl font-black text-gray-900">Tudo certo!</h1>
        <p className="text-gray-600 mt-1">Revise o pedido antes de finalizar</p>
      </div>

      <div className="flex-1 overflow-auto pb-4 space-y-5">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-5 shadow-xl shadow-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
                Nº do Pedido
              </p>
              <p className="text-4xl font-black mt-0.5">#{orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
                {formatDate(createdAt)}
              </p>
              <p className="text-2xl font-bold mt-0.5">{formatTime(createdAt)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
                Total do pedido
              </p>
              <p className="text-3xl font-black mt-0.5">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-200 uppercase tracking-wide font-semibold">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </p>
              <div className="mt-1 px-3 py-1 rounded-full bg-green-400/20 border border-green-300/40">
                <p className="text-xs font-bold text-green-200">✓ PAGO</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">📋 Itens do pedido</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-bold">
              {totalItems}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((i) => (
              <div key={i.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{i.product.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-tight">
                        <span className="text-blue-700">{i.quantity}x</span> {i.product.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(i.product.price)} un.
                      </p>
                      {i.observations && (
                        <p className="mt-1.5 text-xs italic text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                          📝 {i.observations}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-sm text-gray-900 whitespace-nowrap">
                    {formatCurrency(i.product.price * i.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">💳 Pagamento</p>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-lg font-bold">
              {formatCurrency(totalPaid)} recebidos
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.map((p) => {
              const info =
                paymentMethods.find((m) => m.id === p.method) ?? { name: p.method, emoji: '💳' };
              return (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{info.name}</p>
                      {p.method === 'dinheiro' &&
                        typeof p.cashReceived === 'number' &&
                        p.change !== undefined && (
                          <p className="text-xs text-green-700 font-medium">
                            Receb. {formatCurrency(p.cashReceived)} • Troco {formatCurrency(p.change)}
                          </p>
                        )}
                    </div>
                  </div>
                  <span className="font-black text-sm text-blue-700 whitespace-nowrap">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t-2 border-gray-200 bg-white space-y-3 mt-auto">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBackToPayment}
            className="py-4 rounded-2xl font-bold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors text-base"
          >
            ← Voltar
          </button>
          <button
            onClick={onConfirmPrint}
            className="py-4 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-200"
          >
            🖨️ Finalizar e imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
