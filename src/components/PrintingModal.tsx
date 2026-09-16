import { useState } from 'react';
import Modal from './Modal';

interface PrintingModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  autoCompleteKey?: number;
}

export default function PrintingModal({
  open,
  onClose,
  onDone,
}: PrintingModalProps) {
  const [stage, setStage] = useState<'printing' | 'done'>(() => 'printing');
  const [timerStarted, setTimerStarted] = useState<boolean>(() => false);

  if (open && !timerStarted) {
    setTimeout(() => setStage('done'), 1800);
    setTimerStarted(true);
  }

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
              <h2 className="text-2xl font-black text-gray-900">Imprimindo pedido...</h2>
              <p className="text-gray-600 mt-2">
                Enviando para a impressora da cozinha e do balcão.
              </p>
              <div className="mt-5 w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-printing-progress rounded-full" />
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl mx-auto mb-5 shadow-md shadow-green-100">
                ✅
              </div>
              <h2 className="text-2xl font-black text-gray-900">Pedido impresso!</h2>
              <p className="text-gray-600 mt-2">
                Comprovante enviado. O pedido foi encaminhado para a cozinha.
              </p>
            </>
          )}
        </div>
        {stage === 'done' && (
          <div className="px-5 pb-5">
            <button
              onClick={onDone}
              className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-200"
            >
              ✓ OK — Voltar para a tela inicial
            </button>
          </div>
        )}
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
