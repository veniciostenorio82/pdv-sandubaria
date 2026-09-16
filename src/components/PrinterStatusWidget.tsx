'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkPrinterStatus, connectPrinter, testPrinter, type PrinterStatus } from '../services/printer';

export default function PrinterStatusWidget() {
  const [status, setStatus] = useState<PrinterStatus>({
    connected: false,
    available: false,
    message: 'Verificando...',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(true);

  // Initial status check
  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkPrinterStatus();
      setStatus(result);
    };

    checkStatus();

    // Recheck every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await connectPrinter();

    if (result.success) {
      // Recheck status after connection attempt
      const newStatus = await checkPrinterStatus();
      setStatus(newStatus);
      setError(null);
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  }, []);

  const handleTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await testPrinter();

    if (result.success) {
      setError(null);
    } else {
      setError(result.error?.message || 'Erro desconhecido');
    }

    setIsLoading(false);
  }, []);

  if (!showMessage) {
    return (
      <button
        onClick={() => setShowMessage(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-xl hover:bg-blue-700 transition-colors"
        title="Mostrar status da impressora"
      >
        🖨️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🖨️</span>
          <span className="font-bold text-gray-900">Impressora</span>
        </div>
        <button
          onClick={() => setShowMessage(false)}
          className="text-gray-400 hover:text-gray-600 text-lg font-bold"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-bold text-sm text-gray-900">
            {status.connected ? '🟢 Impressora conectada' : '🔴 Impressora desconectada'}
          </span>
        </div>
        {status.message && (
          <p className="text-xs text-gray-600 ml-5">{status.message}</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!status.connected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Conectando...' : 'Conectar'}
          </button>
        ) : (
          <>
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Testando...' : 'Testar'}
            </button>
            <button
              onClick={() => setShowMessage(false)}
              className="py-2 px-3 rounded-lg bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 active:bg-gray-400 transition-colors"
            >
              OK
            </button>
          </>
        )}
      </div>

      {/* Last checked */}
      {status.lastChecked && (
        <p className="text-xs text-gray-400 mt-2">
          Verificado: {status.lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  );
}
