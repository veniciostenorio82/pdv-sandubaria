import { useState } from 'react';
import type { PaymentMethod, PaymentEntry } from '../lib/types';
import { paymentMethods, formatCurrency } from '../lib/data';
import Modal from './Modal';

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<PaymentEntry, 'id'>) => void;
  remainingAmount: number;
  resetKey?: number;
}

export default function AddPaymentModal({
  open,
  onClose,
  onAdd,
  remainingAmount,
}: AddPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(() => null);
  const [amount, setAmount] = useState<number | ''>(() =>
    remainingAmount > 0 ? Math.round(remainingAmount * 100) / 100 : ''
  );
  const [cashReceived, setCashReceived] = useState<number | ''>(() => '');

  const numericAmount = typeof amount === 'number' ? amount : 0;
  const change =
    method === 'dinheiro' && typeof cashReceived === 'number' && cashReceived > numericAmount
      ? Math.round((cashReceived - numericAmount) * 100) / 100
      : 0;

  const canConfirm =
    method !== null &&
    typeof amount === 'number' &&
    amount > 0 &&
    (method !== 'dinheiro' ||
      (typeof cashReceived === 'number' && cashReceived >= numericAmount));

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Adicionar Pagamento</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Restante: <span className="font-bold text-blue-700">{formatCurrency(remainingAmount)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 active:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          <div>
            <label className="block font-bold text-gray-900 text-base mb-3">
              Forma de pagamento
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {paymentMethods.map((pm) => {
                const sel = method === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      sel
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                        : 'border-gray-200 bg-white active:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{pm.emoji}</div>
                    <div className={`font-bold text-sm ${sel ? 'text-blue-700' : 'text-gray-900'}`}>
                      {pm.name}
                    </div>
                    {sel && (
                      <div className="mt-1.5 text-xs text-blue-600 font-semibold">✓ Selecionado</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {method && (
            <div>
              <label className="block font-bold text-gray-900 text-base mb-2">
                Valor a pagar com {paymentMethods.find((p) => p.id === method)?.name.toLowerCase()}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : Math.round(parseFloat(e.target.value) * 100) / 100)
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-xl font-black text-gray-900 active:border-blue-400 transition-colors"
                  placeholder="0,00"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: 'Restante', val: remainingAmount },
                  { label: '50%', val: Math.round((remainingAmount * 0.5) * 100) / 100 },
                  { label: '25%', val: Math.round((remainingAmount * 0.25) * 100) / 100 },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setAmount(q.val)}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold active:bg-blue-100 active:text-blue-700 transition-colors"
                  >
                    {q.label} ({formatCurrency(q.val)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === 'dinheiro' && numericAmount > 0 && (
            <div>
              <label className="block font-bold text-gray-900 text-base mb-2">
                💵 Valor recebido em dinheiro
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={cashReceived}
                  onChange={(e) =>
                    setCashReceived(
                      e.target.value === '' ? '' : Math.round(parseFloat(e.target.value) * 100) / 100
                    )
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-xl font-black text-gray-900 active:border-blue-400 transition-colors"
                  placeholder="0,00"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  numericAmount,
                  Math.ceil(numericAmount / 10) * 10,
                  Math.ceil(numericAmount / 20) * 20,
                  numericAmount + 5,
                  numericAmount + 10,
                ].map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setCashReceived(Math.round(v * 100) / 100)}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold active:bg-blue-100 active:text-blue-700 transition-colors"
                  >
                    R$ {v.toFixed(2)}
                  </button>
                ))}
              </div>
              {change > 0 && (
                <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-700">Troco</span>
                    <span className="text-xl font-black text-green-700">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
              {typeof cashReceived === 'number' && cashReceived < numericAmount && cashReceived > 0 && (
                <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <p className="text-sm font-semibold text-red-700">
                    ⚠️ Valor recebido menor que o pagamento
                  </p>
                </div>
              )}
            </div>
          )}

          {method === 'pix' && numericAmount > 0 && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="font-bold text-blue-800 text-sm">Chave PIX</p>
              <p className="text-blue-700 font-mono text-sm">lanchonete@email.com</p>
              <p className="text-xs text-blue-600 mt-1">Confirme após receber o pagamento</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t-2 border-gray-100 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-4 rounded-2xl font-bold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors text-base"
          >
            Cancelar
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => {
              if (method === null || typeof amount !== 'number') return;
              onAdd({
                method,
                amount: numericAmount,
                ...(method === 'dinheiro' && typeof cashReceived === 'number'
                  ? {
                      cashReceived,
                      change: change > 0 ? change : undefined,
                    }
                  : {}),
              });
              onClose();
            }}
            className="py-4 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-base shadow-lg shadow-blue-200 disabled:shadow-none"
          >
            ✓ Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
