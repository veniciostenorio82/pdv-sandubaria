import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { printOrder, type OrderToPrint } from '../services/printer';

interface PrintingModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  orderData?: OrderToPrint;
  autoCompleteKey?: number;
}

type PrintingStage = 'printing' | 'success' | 'error';

export default function PrintingModal({
  open,
  onClose,
  onDone,
  orderData,
  autoCompleteKey,
}: PrintingModalProps) {
  const [stage, setStage] = useState<PrintingStage>('printing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Effect triggers when modal opens or autoCompleteKey changes
  useEffect(() => {
    if (!open) return;

    // Reset state when modal opens
    setStage('printing');
    setErrorMessage('');
    setIsRetrying(false);

    // If no order data, skip printing
    if (!orderData) {
      setStage('success');
      setTimeout(() => setStage('success'), 100);
      return;
    }

    // Try to print
    const doPrint = async () => {
      try {
        const result = await printOrder(orderData);

        if (result.success) {
          setStage('success');
        } else {
          setErrorMessage(result.error?.message || 'Erro desconhecido');
          setStage('error');
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao imprimir');
        setStage('error');
      }
    };

    // Delay slightly to show loading state
    const timer = setTimeout(() => {
      doPrint();
    }, 500);

    return () => clearTimeout(timer);
  }, [open, autoCompleteKey, orderData]);

  const handleRetry = useCallback(async () => {
    if (!orderData) return;

    setIsRetrying(true);
    setStage('printing');
    setErrorMessage('');

    try {
      const result = await printOrder(orderData);

      if (result.success) {
        setStage('success');
      } else {
        setErrorMessage(result.error?.message || 'Erro desconhecido');
        setStage('error');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao imprimir');
      setStage('error');
    } finally {
      setIsRetrying(false);
    }
  }, [orderData]);

  return (
    <Modal open={open} onClose={onClose} size="md" dismissible={false}>
      <div className="flex flex-col">
        <div className="p-8 text-center">
          {stage === 'printing' ? (
            <>
              <div className="relative w-24 h-24 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  🖨️
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900">
                {isRetrying ? 'Reimprimindo...' : 'Imprimindo pedido...'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isRetrying ? 'Tentando novamente...' : 'Enviando para a impressora.'}
              </p>
              <div className="mt-5 w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-printing-progress rounded-full" />
              </div>
            </>
          ) : stage === 'success' ? (
            <>
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl mx-auto mb-5 shadow-md shadow-green-100">
                ✅
              </div>
              <h2 className="text-2xl font-black text-gray-900">Pedido impresso!</h2>
              <p className="text-gray-600 mt-2">
                Comprovante enviado. O pedido foi encaminhado para a cozinha.
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center text-5xl mx-auto mb-5 shadow-md shadow-red-100">
                ❌
              </div>
              <h2 className="text-2xl font-black text-gray-900">Erro ao imprimir</h2>
              <p className="text-red-600 mt-2 text-sm">{errorMessage}</p>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  💡 Verifique se a impressora está conectada e se o Print Agent está rodando.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-5 pb-5">
          {stage === 'success' && (
            <button
              onClick={onDone}
              className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-200"
            >
              ✓ OK — Voltar para a tela inicial
            </button>
          )}
          {stage === 'error' && (
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full py-3 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base shadow-lg shadow-blue-200"
              >
                {isRetrying ? '⏳ Tentando...' : '🔄 Tentar novamente'}
              </button>
              <button
                onClick={onDone}
                className="w-full py-3 rounded-2xl font-bold text-gray-700 bg-gray-200 active:bg-gray-300 transition-colors text-base"
              >
                ✕ Cancelar e voltar
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes printing-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-printing-progress {
          animation: printing-progress 1.8s ease-out forwards;
        }
      `}</style>
    </Modal>
  );
}
