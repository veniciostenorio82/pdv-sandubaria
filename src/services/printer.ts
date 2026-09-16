/**
 * Printer Service
 * Encapsulates all communication with the Print Agent and Print Launcher
 */

const PRINT_AGENT_URL = 'http://localhost:9100';
const PRINT_LAUNCHER_URL = 'http://localhost:9101';

export interface PrinterStatus {
  connected: boolean;
  available: boolean;
  message?: string;
  lastChecked?: Date;
}

export interface PrintError {
  code: string;
  message: string;
  details?: string;
}

/**
 * Check if Print Agent is responding
 */
export async function checkPrinterStatus(): Promise<PrinterStatus> {
  try {
    const response = await fetch(`${PRINT_AGENT_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      return {
        connected: true,
        available: true,
        message: 'Impressora conectada e pronta',
        lastChecked: new Date(),
      };
    }

    return {
      connected: false,
      available: false,
      message: 'Print Agent respondeu com erro',
      lastChecked: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    return {
      connected: false,
      available: false,
      message: `Impressora desconectada: ${message}`,
      lastChecked: new Date(),
    };
  }
}

/**
 * Try to connect by starting the Print Agent via Launcher
 */
export async function connectPrinter(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${PRINT_LAUNCHER_URL}/launcher/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as any;

    if (response.ok && data.status === 'success') {
      // Wait a moment for Print Agent to fully start
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        success: true,
        message: data.message || 'Impressora conectada com sucesso',
      };
    }

    return {
      success: false,
      message: data.message || 'Falha ao conectar impressora',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    return {
      success: false,
      message: `Erro ao conectar: ${message}. Verifique se o Print Launcher está rodando.`,
    };
  }
}

export interface OrderToPrint {
  orderNumber: string | number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  paymentMethod: string;
}

/**
 * Send order to print
 */
export async function printOrder(order: OrderToPrint): Promise<{ success: boolean; error?: PrintError }> {
  try {
    const response = await fetch(`${PRINT_AGENT_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errData = (await response.json()) as any;
        return {
          success: false,
          error: {
            code: 'PRINT_FAILED',
            message: errData.error || 'Falha ao imprimir',
          },
        };
      } else {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Print Agent retornou resposta inválida',
            details: `Status ${response.status}. Pode estar offline ou indisponível.`,
          },
        };
      }
    }

    const data = (await response.json()) as any;
    if (data.status === 'printed') {
      return { success: true };
    }

    return {
      success: false,
      error: {
        code: 'PRINT_FAILED',
        message: 'Impressão falhou',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    if (message.includes('timeout')) {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Impressora não respondeu a tempo',
          details: 'Verifique se o dispositivo está conectado',
        },
      };
    }

    if (message.includes('Failed to fetch') || message.includes('connect')) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: 'Não foi possível conectar com a impressora',
          details: 'Print Agent pode não estar rodando. Clique "Conectar impressora" na interface.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: `Erro ao conectar com impressora: ${message}`,
      },
    };
  }
}

/**
 * Send test print to verify printer is working
 */
export async function testPrinter(): Promise<{ success: boolean; error?: PrintError }> {
  try {
    const response = await fetch(`${PRINT_AGENT_URL}/test-print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errData = (await response.json()) as any;
        return {
          success: false,
          error: {
            code: 'TEST_FAILED',
            message: errData.error || 'Falha no teste de impressão',
          },
        };
      } else {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Print Agent retornou resposta inválida',
            details: `Status ${response.status}. Pode estar offline ou indisponível.`,
          },
        };
      }
    }

    const data = (await response.json()) as any;
    if (data.status === 'printed') {
      return { success: true };
    }

    return {
      success: false,
      error: {
        code: 'TEST_FAILED',
        message: 'Teste de impressão falhou',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    if (message.includes('timeout')) {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Impressora não respondeu a tempo',
          details: 'Verifique a conexão USB',
        },
      };
    }

    if (message.includes('Failed to fetch') || message.includes('connect')) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: 'Não foi possível conectar com a impressora',
          details: 'Print Agent pode não estar rodando. Clique "Conectar impressora" na interface.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: `Erro ao testar impressora: ${message}`,
      },
    };
  }
}
