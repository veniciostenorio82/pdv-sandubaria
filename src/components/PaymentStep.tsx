import { useState } from 'react';
import type { PaymentEntry, OrderItem } from '../lib/types';
import { formatCurrency, paymentMethods } from '../lib/data';
import AddPaymentModal from './AddPaymentModal';

interface PaymentStepProps {
  totalAmount: number;
  items: OrderItem[];
  payments: PaymentEntry[];
  onAddPayment: (entry: Omit<PaymentEntry, 'id'>) => void;
  onRemovePayment: (id: string) => void;
  onBack: () => void;
  onFinalize: () => void;
}

export default function PaymentStep({
  totalAmount,
  payments,
  onAddPayment,
  onRemovePayment,
  onBack,
  onFinalize,
}: PaymentStepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalResetKey, setModalResetKey] = useState(0);

  const received = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, Math.round((totalAmount - received) * 100) / 100);
  const fullyPaid = remaining <= 0.009;
  const progressPct = totalAmount > 0 ? Math.min(100, (received / totalAmount) * 100) : 0;

  const getMethodInfo = (method: string) =>
    paymentMethods.find((p) => p.id === method) ?? {
      name: method,
      emoji: '💳',
    };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">
            💳
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pagamento</h1>
            <p className="text-sm text-gray-600">
              Escolha uma ou mais formas de pagamento
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-5 shadow-xl shadow-blue-200 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
              Total do pedido
            </p>
            <p className="text-3xl font-black mt-0.5">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
              Falta
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${fullyPaid ? 'text-green-300' : ''}`}>
              {fullyPaid ? '✓ Pago' : formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              fullyPaid ? 'bg-green-400' : 'bg-white'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-blue-100 font-medium">
          <span>Recebido: {formatCurrency(received)}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-24 space-y-4">
        {payments.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-2 px-1">
              Pagamentos adicionados ({payments.length})
            </h2>
            <div className="space-y-2.5">
              {payments.map((p) => {
                const info = getMethodInfo(p.method);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                        {info.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{info.name}</p>
                        {p.method === 'dinheiro' &&
                          typeof p.cashReceived === 'number' &&
                          p.change !== undefined && (
                            <p className="text-xs text-green-700 font-medium">
                              Recebido {formatCurrency(p.cashReceived)} • Troco {formatCurrency(p.change)}
                            </p>
                          )}
                        {p.method === 'dinheiro' && (!p.cashReceived || !p.change) && (
                          <p className="text-xs text-gray-500">Pagamento exato ou crédito</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-blue-700 whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </span>
                      <button
                        onClick={() => onRemovePayment(p.id)}
                        className="p-2 rounded-xl text-gray-400 active:text-red-500 active:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!fullyPaid && (
          <div className="sticky bottom-0 z-20 -mx-1 bg-white/95 backdrop-blur-sm pt-4 pb-1">
            <button
              onClick={() => {
                setModalResetKey((prev) => prev + 1);
                setModalOpen(true);
              }}
              className="w-full p-5 rounded-3xl border-2 border-dashed border-blue-300 bg-blue-50/50 active:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center justify-center gap-3 text-blue-700">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black group-active:scale-95 transition-transform">
                  +
                </div>
                <div className="text-left">
                  <p className="font-bold text-base">Adicionar forma de pagamento</p>
                  <p className="text-sm text-blue-600">
                    Restante: {formatCurrency(remaining)}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {payments.length === 0 && (
          <div className="text-center py-6">
            <p className="text-5xl mb-3">💰</p>
            <p className="text-gray-600 font-medium">Nenhum pagamento adicionado</p>
            <p className="text-sm text-gray-500 mt-1">
              Toque acima para adicionar. Você pode dividir em mais de uma forma.
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t-2 border-gray-200 bg-white space-y-3 mt-auto">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBack}
            className="py-4 rounded-2xl font-bold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors text-base"
          >
            ← Voltar ao carrinho
          </button>
          <button
            disabled={!fullyPaid}
            onClick={onFinalize}
            className={`py-4 rounded-2xl font-bold text-white transition-colors text-base shadow-lg ${
              fullyPaid
                ? 'bg-blue-600 active:bg-blue-700 shadow-blue-200'
                : 'bg-gray-300 cursor-not-allowed shadow-none'
            }`}
          >
            {fullyPaid ? '✓ Finalizar pedido' : `Falta ${formatCurrency(remaining)}`}
          </button>
        </div>
      </div>

      <AddPaymentModal
        key={modalResetKey}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalResetKey((prev) => prev + 1);
        }}
        onAdd={onAddPayment}
        remainingAmount={remaining}
        resetKey={modalResetKey}
      />
    </div>
  );
}
