import { useEffect, useState } from 'react';
import type { Product, ProductCategory } from '../lib/types';
import Modal from './Modal';
import { formatCurrency } from '../lib/data';

interface MenuSettingsModalProps {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onSave: (products: Product[]) => void;
}

const emptyProduct = (id: string): Product => ({
  id,
  name: '',
  description: '',
  price: 0,
  category: 'lanche',
  emoji: '🍔',
});

export default function MenuSettingsModal({ open, products, onClose, onSave }: MenuSettingsModalProps) {
  const [local, setLocal] = useState<Product[]>(products);

  useEffect(() => {
    setLocal(products);
  }, [open, products]);

  const handleAdd = () => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    setLocal((p) => [...p, emptyProduct(id)]);
  };

  const handleRemove = (id: string) => {
    setLocal((p) => p.filter((x) => x.id !== id));
  };

  const handleChange = (id: string, changes: Partial<Product>) => {
    setLocal((p) => p.map((x) => (x.id === id ? { ...x, ...changes } : x)));
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="max-h-[85vh] overflow-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Configurar Cardápio</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onSave(local); onClose(); }}
              className="py-2 px-3 rounded-xl bg-blue-600 text-white font-bold"
            >
              Salvar
            </button>
            <button onClick={onClose} className="py-2 px-3 rounded-xl bg-gray-100">Fechar</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Itens no cardápio: <span className="font-bold">{local.length}</span></p>
            <div>
              <button onClick={handleAdd} className="py-2 px-3 rounded-xl bg-green-50 border border-green-200">+ Novo item</button>
            </div>
          </div>

          <div className="grid gap-3">
            {local.map((prod, idx) => (
              <div key={prod.id} className="p-3 border-2 rounded-2xl bg-white flex gap-3 items-start">
                <div className="w-12">
                  <input
                    value={prod.emoji}
                    onChange={(e) => handleChange(prod.id, { emoji: e.target.value })}
                    className="w-12 h-12 text-2xl text-center"
                  />
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    value={prod.name}
                    onChange={(e) => handleChange(prod.id, { name: e.target.value })}
                    placeholder="Nome do produto"
                    className="col-span-2 p-2 rounded-xl border-2"
                  />
                  <div>
                    <select
                      value={prod.category}
                      onChange={(e) => handleChange(prod.id, { category: e.target.value as ProductCategory })}
                      className="w-full p-2 rounded-xl border-2"
                    >
                      <option value="lanche">Sanduíches</option>
                      <option value="acompanhamento">Acompanhamentos</option>
                      <option value="bebida">Bebidas</option>
                    </select>
                  </div>

                  <input
                    value={prod.description}
                    onChange={(e) => handleChange(prod.id, { description: e.target.value })}
                    placeholder="Descrição"
                    className="col-span-2 p-2 rounded-xl border-2"
                  />
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={prod.price}
                      onChange={(e) => handleChange(prod.id, { price: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border-2 text-right"
                    />
                  </div>

                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleRemove(prod.id)} className="py-2 px-3 rounded-xl bg-red-50 border border-red-200 text-red-700">Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
