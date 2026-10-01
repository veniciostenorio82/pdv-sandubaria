import type { Order } from './types';

const AGENT_URL =
  process.env.NEXT_PUBLIC_PRINT_AGENT_URL ?? 'http://localhost:8000';

export type AgentStatus = { agent: boolean; printer: boolean };

export type PrintResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'agent_offline' | 'printer_unavailable' | 'error';
      message: string;
    };

async function request(path: string, init?: RequestInit, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${AGENT_URL}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function readDetail(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : ''))
        .filter(Boolean);
      return messages.length > 0 ? messages.join('; ') : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function failure(res: Response): Promise<PrintResult> {
  if (res.status === 503) {
    const detail = await readDetail(res);
    return {
      ok: false,
      reason: 'printer_unavailable',
      message: detail ?? 'Impressora desligada ou desconectada.',
    };
  }
  if (res.status === 422) {
    const detail = await readDetail(res);
    return {
      ok: false,
      reason: 'error',
      message: detail ?? 'Pedido recusado pelo agente de impressão.',
    };
  }
  return { ok: false, reason: 'error', message: `Erro do agente (${res.status}).` };
}

function offline(error: unknown): PrintResult {
  if (isAbort(error)) {
    return { ok: false, reason: 'error', message: 'O agente de impressão não respondeu a tempo.' };
  }
  return {
    ok: false,
    reason: 'agent_offline',
    message: 'Agente de impressão não está rodando neste computador.',
  };
}

export async function checkAgent(): Promise<AgentStatus> {
  try {
    const res = await request('/status', undefined, 2000);
    if (!res.ok) return { agent: false, printer: false };
    const data = (await res.json()) as Partial<AgentStatus>;
    return { agent: Boolean(data.agent), printer: Boolean(data.printer) };
  } catch {
    return { agent: false, printer: false };
  }
}

export async function printOrder(order: Order): Promise<PrintResult> {
  try {
    const res = await request(
      '/print/order',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      },
      8000,
    );
    if (res.ok) return { ok: true };
    return failure(res);
  } catch (error) {
    return offline(error);
  }
}

export async function testPrint(): Promise<PrintResult> {
  try {
    const res = await request('/print/test', { method: 'POST' }, 8000);
    if (res.ok) return { ok: true };
    return failure(res);
  } catch (error) {
    return offline(error);
  }
}
