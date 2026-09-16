'use client';

import { useState, useCallback, useMemo } from 'react';
import type { AppStep, Product, ProductCategory, OrderItem, PaymentEntry } from '../lib/types';
import { products as initialProducts, formatCurrency } from '../lib/data';
import { type OrderToPrint } from '../services/printer';
import Header from '../components/Header';
import MenuSettingsModal from '../components/MenuSettingsModal';
import CategoryStep from '../components/CategoryStep';
import ProductListStep from '../components/ProductListStep';
import CartStep from '../components/CartStep';
import PaymentStep from '../components/PaymentStep';
import FinalizeStep from '../components/FinalizeStep';
import ProductModal from '../components/ProductModal';
import CancelOrderModal from '../components/CancelOrderModal';
import PrintingModal from '../components/PrintingModal';
import PrinterStatusWidget from '../components/PrinterStatusWidget';

function generateOrderNumber(): string {
  return String(Math.floor(Math.random() * 9000) + 1000);
}

export default function Home() {
  const [step, setStep] = useState<AppStep>('inicial');
  const [, setPreviousStepStack] = useState<AppStep[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState(() => initialProducts);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>(generateOrderNumber());
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [printingModalOpen, setPrintingModalOpen] = useState(false);
  const [printingAutoCompleteKey, setPrintingAutoCompleteKey] = useState(0);
  const [printingOrderData, setPrintingOrderData] = useState<OrderToPrint | undefined>();

  const [modalInitialQuantity, setModalInitialQuantity] = useState(1);
  const [modalInitialObservations, setModalInitialObservations] = useState('');

  const totalAmount = useMemo(
    () => items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [items]
  );
  const roundedTotal = useMemo(
    () => Math.round(totalAmount * 100) / 100,
    [totalAmount]
  );

  const resetAll = useCallback(() => {
    setItems([]);
    setPayments([]);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setEditingItemId(null);
    setPreviousStepStack([]);
    setOrderNumber(generateOrderNumber());
    setCreatedAt(null);
  }, []);

  const goToStep = useCallback((next: AppStep) => {
    setPreviousStepStack((prev) => [...prev, step]);
    setStep(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const goBack = useCallback(() => {
    setPreviousStepStack((prev) => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const prevStep = newStack.pop()!;
      setStep(prevStep);
      if (prevStep !== 'produtos') setSelectedCategory(null);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return newStack;
    });
  }, []);

  const handleCancelConfirm = useCallback(() => {
    resetAll();
    setStep('inicial');
    setCancelModalOpen(false);
  }, [resetAll]);

  const handleSelectCategory = useCallback(
    (cat: ProductCategory) => {
      setSelectedCategory(cat);
      goToStep('produtos');
    },
    [goToStep]
  );

  const handleSelectProductFromList = useCallback((product: Product) => {
    setEditingItemId(null);
    setSelectedProduct(product);
    setModalInitialQuantity(1);
    setModalInitialObservations('');
  }, []);

  const handleEditItemFromCart = useCallback((item: OrderItem) => {
    setEditingItemId(item.id);
    setSelectedProduct(item.product);
    setModalInitialQuantity(item.quantity);
    setModalInitialObservations(item.observations ?? '');
  }, []);

  const handleAddOrUpdateFromModal = useCallback(
    (product: Product, quantity: number, observations: string | string[]) => {
      if (editingItemId) {
        const obsForEdit = Array.isArray(observations) ? (observations[0] ?? '') : (observations as string);
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItemId
              ? { ...it, product, quantity, observations: obsForEdit || undefined }
              : it
          )
        );
        setEditingItemId(null);
        return;
      }
      if (quantity > 1) {
        const now = Date.now();
        const obsArr = (Array.isArray(observations)
          ? observations
          : Array.from({ length: quantity }, () => (observations as string) || '')) as string[];
        const created = obsArr.map((obs, idx) => ({
          id: `${product.id}-${now}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
          product,
          quantity: 1,
          observations: obs && obs.trim() ? obs.trim() : undefined,
        }));
        setItems((prev) => [...prev, ...created]);
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            product,
            quantity,
            observations: typeof observations === 'string' && observations ? observations : undefined,
          },
        ]);
      }
    },
    [editingItemId]
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  }, []);

  const handleUpdateQty = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity } : it)));
  }, [handleRemoveItem]);

  const handleViewCart = useCallback(() => {
    goToStep('carrinho');
  }, [goToStep]);

  const handleAddMoreItems = useCallback(() => {
    setSelectedCategory(null);
    goToStep('categoria');
  }, [goToStep]);

  const handleGoToPayment = useCallback(() => {
    goToStep('pagamento');
  }, [goToStep]);

  const handleAddPayment = useCallback(
    (entry: Omit<PaymentEntry, 'id'>) => {
      setPayments((prev) => [
        ...prev,
        { ...entry, id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ]);
    },
    []
  );

  const handleRemovePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleFinalizeFromPayment = useCallback(() => {
    setCreatedAt(new Date());
    goToStep('finalizacao');
  }, [goToStep]);

  const handleConfirmPrint = useCallback(() => {
    // Get payment method from payments (use first one or a default)
    const paymentMethod = payments.length > 0 ? payments[0].method : 'dinheiro';

    // Prepare order data for printing
    const orderData: OrderToPrint = {
      orderNumber,
      items: items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
      total: roundedTotal,
      paymentMethod,
    };

    setPrintingOrderData(orderData);
    setPrintingModalOpen(true);
    setPrintingAutoCompleteKey((prev) => prev + 1);
  }, [orderNumber, items, roundedTotal, payments]);

  const handlePrintingDone = useCallback(() => {
    setPrintingModalOpen(false);
    setPrintingOrderData(undefined);
    resetAll();
    setStep('inicial');
  }, [resetAll]);

  const productsByCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return menuProducts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, menuProducts]);

  const canGoBack = step !== 'inicial';
  const canCancel = step !== 'inicial' && (items.length > 0 || payments.length > 0);

  const renderStepContent = () => {
    switch (step) {
      case 'inicial':
      case 'categoria':
        return (
          <CategoryStep
            onSelectCategory={handleSelectCategory}
            onViewCart={handleViewCart}
            cartItems={items}
          />
        );
      case 'produtos':
        return selectedCategory ? (
          <ProductListStep
            category={selectedCategory}
            products={productsByCategory}
            cartItems={items}
            onSelectProduct={handleSelectProductFromList}
            onViewCart={handleViewCart}
          />
        ) : null;
      case 'carrinho':
        return (
          <CartStep
            items={items}
            onUpdateQuantity={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onEditItem={handleEditItemFromCart}
            onAddMore={handleAddMoreItems}
            onGoToPayment={handleGoToPayment}
          />
        );
      case 'pagamento':
        return (
          <PaymentStep
            totalAmount={roundedTotal}
            items={items}
            payments={payments}
            onAddPayment={handleAddPayment}
            onRemovePayment={handleRemovePayment}
            onBack={() => goToStep('carrinho')}
            onFinalize={handleFinalizeFromPayment}
          />
        );
      case 'finalizacao':
        return createdAt ? (
          <FinalizeStep
            items={items}
            payments={payments}
            totalAmount={roundedTotal}
            orderNumber={orderNumber}
            createdAt={createdAt}
            onBackToPayment={() => goToStep('pagamento')}
            onConfirmPrint={handleConfirmPrint}
          />
        ) : null;
    }
    return null;
  };

  const productForModal = editingItemId
    ? items.find((i) => i.id === editingItemId)?.product ?? selectedProduct
    : selectedProduct;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        step={step}
        cartItems={items}
        onBack={goBack}
        onCancel={() => setCancelModalOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        canGoBack={canGoBack}
        canCancel={canCancel}
        totalAmount={roundedTotal}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 pb-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
          <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 min-h-[600px] flex flex-col shadow-sm">
            {renderStepContent()}
          </div>

          <aside className="mt-5 lg:mt-0">
            <div className="lg:sticky lg:top-24 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pedido</h2>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} itens
                </span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                  <p className="text-3xl mb-2">🧾</p>
                  <p className="text-sm font-medium text-gray-600">Nenhum item no pedido</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.product.emoji}</span>
                          <p className="font-bold text-gray-900 text-sm truncate">{item.product.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity}x • {formatCurrency(item.product.price)} cada
                        </p>
                      </div>
                      <span className="font-black text-sm text-blue-700 whitespace-nowrap">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Total</span>
                      <span className="text-xl font-black text-blue-700">
                        {formatCurrency(roundedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <ProductModal
        open={!!selectedProduct}
        product={productForModal ?? null}
        initialQuantity={modalInitialQuantity}
        initialObservations={modalInitialObservations}
        onClose={() => {
          setSelectedProduct(null);
          setEditingItemId(null);
          setModalInitialQuantity(1);
          setModalInitialObservations('');
        }}
        onAdd={handleAddOrUpdateFromModal}
      />

      <MenuSettingsModal
        open={menuOpen}
        products={menuProducts}
        onClose={() => setMenuOpen(false)}
        onSave={(p: Product[]) => setMenuProducts(p)}
      />

      <CancelOrderModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
      />

      <PrintingModal
        key={`printing-modal-${printingAutoCompleteKey}`}
        open={printingModalOpen}
        onClose={() => {}}
        onDone={handlePrintingDone}
        orderData={printingOrderData}
        autoCompleteKey={printingAutoCompleteKey}
      />

      <PrinterStatusWidget />
    </div>
  );
}
