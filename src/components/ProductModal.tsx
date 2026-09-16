import { useEffect, useState } from 'react';
import type { Product } from '../lib/types';
import { formatCurrency } from '../lib/data';
import Modal from './Modal';

interface ProductModalProps {
  open: boolean;
  product: Product | null;
  initialQuantity?: number;
  initialObservations?: string | string[];
  onClose: () => void;
  onAdd: (product: Product, quantity: number, observations: string | string[]) => void;
}

const quickObservations = [
  'Sem cebola',
  'Sem alface',
  'Sem tomate',
  'Sem queijo',
  'Sem molho',
  'Sem picles',
  'Extra queijo',
  'Extra bacon',
  'Bem passado',
  'Mal passado',
  'Sem gergelim',
  'Para viagem',
];

export default function ProductModal({
  open,
  product,
  initialQuantity = 1,
  initialObservations = '',
  onClose,
  onAdd,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState<number>(() => initialQuantity);
  const [observations, setObservations] = useState<string>(() =>
    typeof initialObservations === 'string' ? initialObservations : ''
  );
  const [observationsArr, setObservationsArr] = useState<string[]>(() =>
    Array.isArray(initialObservations)
      ? initialObservations
      : Array.from({ length: initialQuantity }, () => '')
  );
  const [focusedObsIndex, setFocusedObsIndex] = useState<number>(0);

  useEffect(() => {
    if (!open || !product) {
      setQuantity(initialQuantity);
      setObservations(typeof initialObservations === 'string' ? initialObservations : '');
      setObservationsArr(
        Array.isArray(initialObservations)
          ? initialObservations
          : Array.from({ length: initialQuantity }, () => '')
      );
      setFocusedObsIndex(0);
      return;
    }

    setQuantity(initialQuantity);
    if (initialQuantity && initialQuantity > 1) {
      setObservationsArr(
        Array.from({ length: initialQuantity }, (_, i) => {
          if (Array.isArray(initialObservations)) return initialObservations[i] ?? '';
          if (typeof initialObservations === 'string') return i === 0 ? initialObservations : '';
          return '';
        })
      );
      setObservations('');
    } else {
      setObservations(typeof initialObservations === 'string' ? initialObservations : '');
      setObservationsArr(Array.from({ length: Math.max(1, initialQuantity) }, () => ''));
    }
    setFocusedObsIndex(0);
  }, [open, product?.id, initialQuantity, initialObservations]);

  if (!product) return null;

  const itemTotal = product.price * quantity;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[92vh]">
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-xl font-bold text-white active:bg-white/25 transition-colors"
          >
            ✕
          </button>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-5xl shadow-inner">
              {product.emoji}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-2xl font-bold leading-tight">{product.name}</h2>
              <p className="text-white/80 mt-1">{product.description}</p>
              <p className="text-3xl font-bold mt-3">{formatCurrency(product.price)}</p>
              <p className="text-xs text-white/70 mt-0.5">por unidade</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-6">
          <div>
            <label className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-900 text-base">Quantidade</span>
            </label>
            <div className="flex items-center justify-center gap-5 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
              <button
                onClick={() =>
                  setQuantity((q) => {
                    const next = Math.max(1, q - 1);
                    setObservationsArr((prev) => {
                      if (prev.length > next) return prev.slice(0, next);
                      if (prev.length < next) return [...prev, ...Array(next - prev.length).fill('')];
                      return prev;
                    });
                    setFocusedObsIndex((fi) => Math.min(fi, Math.max(0, next - 1)));
                    return next;
                  })
                }
                disabled={quantity <= 1}
                className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-3xl flex items-center justify-center active:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm"
              >
                −
              </button>
              <span className="font-black text-4xl text-blue-700 min-w-[80px] text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => {
                    const next = q + 1;
                    setObservationsArr((prev) => {
                      if (prev.length < next) return [...prev, ...Array(next - prev.length).fill('')];
                      if (prev.length > next) return prev.slice(0, next);
                      return prev;
                    });
                    return next;
                  })
                }
                className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-3xl flex items-center justify-center active:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                +
              </button>
            </div>
            {quantity > 1 && (
              <div className="flex gap-2 mt-3">
                {Array.from({ length: quantity }).map((_, i) => {
                  const active = focusedObsIndex === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setFocusedObsIndex(i)}
                      className={
                        active
                          ? 'py-2.5 px-3 rounded-xl font-bold text-base bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'py-2.5 px-3 rounded-xl font-bold text-base bg-white border-2 border-gray-200 text-gray-700 active:bg-gray-50'
                      }
                    >
                      {i + 1}x
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-900 text-base mb-3">📝 Observações</label>
            {quantity > 1 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Adicione observações individuais para cada unidade</p>
                <div className="flex flex-col gap-2">
                  <textarea
                    value={observationsArr[focusedObsIndex] ?? ''}
                    onChange={(e) =>
                      setObservationsArr((prev) => {
                        const copy = [...prev];
                        copy[focusedObsIndex] = e.target.value;
                        return copy;
                      })
                    }
                    placeholder={`Unidade ${focusedObsIndex + 1} — Ex: Sem cebola, bem passada...`}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none text-base min-h-[80px] active:border-blue-400"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const copy = observationsArr.slice();
                        if (copy.length === 0) return;
                        const val = copy[0] || '';
                        setObservationsArr(copy.map(() => val));
                      }}
                      className="py-2 px-3 rounded-xl bg-gray-100 text-sm text-gray-700"
                    >
                      Copiar primeira observação para todas
                    </button>
                    <p className="text-xs text-gray-500">ou use os botões abaixo para inserir observações rápidas na unidade selecionada</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {quickObservations.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setObservationsArr((prev) => {
                            const copy = [...prev];
                            const current = copy[focusedObsIndex] || '';
                            const sep = current ? ', ' : '';
                            copy[focusedObsIndex] = current + sep + q;
                            return copy;
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700"
                      >
                        + {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Sem cebola, sem alface, ponto da carne bem passada..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none text-base min-h-[100px] active:border-blue-400"
                />
                <p className="text-xs text-gray-500 mt-1.5">Campo opcional — adicione instruções para a cozinha</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickObservations.map((obs) => {
                    const already = observations.toLowerCase().includes(obs.toLowerCase());
                    const base = 'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border';
                    const selected = already
                      ? 'bg-blue-100 text-blue-700 border-blue-600'
                      : 'bg-gray-100 text-gray-700 active:bg-blue-50 active:text-blue-700 border-transparent';
                    return (
                      <button
                        key={obs}
                        onClick={() => {
                          if (already) return;
                          const current = observations.trim();
                          const sep = current ? ', ' : '';
                          setObservations(current + sep + obs);
                        }}
                        className={`${base} ${selected}`}
                      >
                        {already ? '✓ ' : '+ '}
                        {obs}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-5 border-t-2 border-gray-100 bg-white space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-sm text-gray-600">
                {quantity} × {formatCurrency(product.price)}
              </p>
              <p className="text-xs text-gray-500">Total do item</p>
            </div>
            <p className="text-3xl font-black text-blue-700">
              {formatCurrency(itemTotal)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              className="py-4 rounded-2xl font-bold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors text-base"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const obsToSend = quantity > 1 ? observationsArr : observations.trim();
                onAdd(product, quantity, obsToSend);
                onClose();
              }}
              className="py-4 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-200"
            >
              🛒 Adicionar ao pedido
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
