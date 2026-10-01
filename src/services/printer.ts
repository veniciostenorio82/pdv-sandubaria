/**
 * Adaptador da tela para o agente local Sandubaria Print (print-conect).
 */
import { checkAgent, printOrder as sendOrder, testPrint, type PrintResult } from '../lib/printAgent';
import type { Order } from '../lib/types';

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

export async function checkPrinterStatus(): Promise<PrinterStatus> {
  const status = await checkAgent();
  const lastChecked = new Date();

  if (!status.agent) {
    return {
      connected: false,
      available: false,
      message: 'Abra o Sandubaria Print neste computador.',
      lastChecked,
    };
  }

  if (!status.printer) {
    return {
      connected: true,
      available: false,
      message: 'Agente no ar. Impressora não encontrada.',
      lastChecked,
    };
  }

  return {
    connected: true,
    available: true,
    message: 'Impressora pronta',
    lastChecked,
  };
}

function toPrintResponse(result: PrintResult): { success: boolean; error?: PrintError } {
  if (result.ok) return { success: true };
  return {
    success: false,
    error: { code: result.reason, message: result.message },
  };
}

export async function printOrder(order: Order): Promise<{ success: boolean; error?: PrintError }> {
  return toPrintResponse(await sendOrder(order));
}

export async function testPrinter(): Promise<{ success: boolean; error?: PrintError }> {
  return toPrintResponse(await testPrint());
}
