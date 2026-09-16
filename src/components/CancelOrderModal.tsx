import Modal from './Modal';

interface CancelOrderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelOrderModal({
  open,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="md" dismissible={true}>
      <div className="flex flex-col">
        <div className="p-6 text-center border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-5xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-gray-900">Cancelar pedido?</h2>
          <p className="text-gray-600 mt-2">
            Todos os itens e pagamentos adicionados serão perdidos. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-4 rounded-2xl font-bold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors text-base"
          >
            Não, continuar pedido
          </button>
          <button
            onClick={onConfirm}
            className="py-4 rounded-2xl font-bold text-white bg-red-600 active:bg-red-700 transition-colors text-base shadow-lg shadow-red-200"
          >
            Sim, cancelar tudo
          </button>
        </div>
      </div>
    </Modal>
  );
}
