import { spawn, execFileSync } from 'node:child_process';
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const HEALTH_URL = 'http://127.0.0.1:9100/health';
const HEALTH_TIMEOUT_MS = 20_000;
const HEALTH_INTERVAL_MS = 300;
const LOCK_STALE_MS = 20_000;
const PLACEHOLDER_URL = /SEU-DOMINIO-DA-VERCEL|CHANGE_ME/i;

function resolveAppDir(): string {
  if (process.env.PDV_APP_DIR) return process.env.PDV_APP_DIR;
  return resolve(__dirname, '..');
}

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function dataDir(): string {
  const dir = join(homedir(), '.local', 'share', 'pdv-sandubaria');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    appendFileSync(join(dataDir(), 'launcher.log'), line);
  } catch {
    // Logging must never break the launcher.
  }
}

function commandExists(command: string): boolean {
  try {
    execFileSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function showDialog(kind: 'error' | 'warning' | 'info', title: string, text: string): void {
  if (process.env.PDV_NO_DIALOG === '1') return;
  if (commandExists('zenity')) {
    const dialogFlag = kind === 'error' ? '--error' : kind === 'warning' ? '--warning' : '--info';
    spawn('zenity', [dialogFlag, `--title=${title}`, `--text=${text}`, '--no-wrap'], {
      stdio: 'ignore',
      detached: true,
    }).unref();
    return;
  }
  if (commandExists('notify-send')) {
    spawn('notify-send', [title, text], { stdio: 'ignore', detached: true }).unref();
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { status?: string };
    return body.status === 'ok';
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs: number): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await checkHealth()) return true;
    await sleep(HEALTH_INTERVAL_MS);
  }
  return checkHealth();
}

function acquireStartLock(lockPath: string): boolean {
  try {
    if (existsSync(lockPath)) {
      const ageMs = Date.now() - statSync(lockPath).mtimeMs;
      if (ageMs < LOCK_STALE_MS) return false;
      unlinkSync(lockPath);
    }
    writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

function releaseStartLock(lockPath: string): void {
  try {
    if (existsSync(lockPath)) unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

function startPrintAgent(appDir: string): { ok: boolean; message: string } {
  const nodePath = join(appDir, 'lib', 'node');
  const agentPath = join(appDir, 'lib', 'print-agent.js');
  if (!existsSync(nodePath) || !existsSync(agentPath)) {
    return {
      ok: false,
      message: 'Pacote do Print Agent incompleto. Gere a distribuição novamente com npm run build:launcher.',
    };
  }

  const logs = dataDir();
  const logFile = join(logs, 'print-agent.log');
  const logFd = openSync(logFile, 'a');

  const child = spawn(nodePath, [agentPath], {
    cwd: appDir,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: {
      ...process.env,
      HOST: process.env.HOST || '127.0.0.1',
      PORT: process.env.PORT || '9100',
      PRINTER_DEVICE: process.env.PRINTER_DEVICE || '/dev/usb/lp0',
      PDV_ORIGIN: process.env.PDV_ORIGIN || process.env.PDV_URL || 'http://localhost:3000',
    },
  });

  child.unref();
  try {
    closeSync(logFd);
  } catch {
    // ignore
  }

  if (child.pid) {
    writeFileSync(join(logs, 'print-agent.pid'), String(child.pid));
    log(`Print Agent iniciado com PID ${child.pid}`);
    return { ok: true, message: `Print Agent iniciado (pid ${child.pid})` };
  }

  return { ok: false, message: 'Falha ao criar o processo do Print Agent.' };
}

function openPwa(url: string): void {
  const child = spawn('xdg-open', [url], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  log(`PWA aberta: ${url}`);
}

async function main(): Promise<number> {
  const appDir = resolveAppDir();
  loadEnvFile(join(appDir, 'pdv.env'));

  const pdvUrl = (process.env.PDV_URL || '').trim();
  const lockPath = join(dataDir(), 'print-agent.lock');

  log(`Launcher iniciado a partir de ${appDir}`);

  if (await checkHealth()) {
    log('Print Agent já estava disponível em 127.0.0.1:9100');
    if (!pdvUrl || PLACEHOLDER_URL.test(pdvUrl)) {
      showDialog(
        'warning',
        'PDV Sandubaria',
        'O Print Agent já está em execução, mas a URL da PWA ainda não foi configurada.\n\nEdite o arquivo pdv.env e preencha PDV_URL.'
      );
      return 0;
    }
    openPwa(pdvUrl);
    return 0;
  }

  const gotLock = acquireStartLock(lockPath);
  if (!gotLock) {
    log('Outro launcher já está iniciando o Print Agent; aguardando health.');
  } else {
    const started = startPrintAgent(appDir);
    if (!started.ok) {
      releaseStartLock(lockPath);
      log(started.message);
      showDialog('error', 'PDV Sandubaria', started.message);
      return 1;
    }
  }

  const ready = await waitForHealth(HEALTH_TIMEOUT_MS);
  releaseStartLock(lockPath);

  if (!ready) {
    const message =
      'Não foi possível iniciar o Print Agent.\n\n' +
      'O PDV Sandubaria não conseguiu disponibilizar a impressora em localhost:9100.\n\n' +
      'Verifique os logs em ~/.local/share/pdv-sandubaria/print-agent.log';
    log('Timeout aguardando /health');
    showDialog('error', 'PDV Sandubaria', message);
    return 1;
  }

  log('Print Agent disponível em 127.0.0.1:9100/health');

  if (!pdvUrl || PLACEHOLDER_URL.test(pdvUrl)) {
    showDialog(
      'warning',
      'PDV Sandubaria',
      'O Print Agent está disponível, mas a URL da PWA ainda não foi configurada.\n\nEdite o arquivo pdv.env e preencha PDV_URL.'
    );
    return 0;
  }

  openPwa(pdvUrl);
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    log(`Erro inesperado: ${message}`);
    showDialog('error', 'PDV Sandubaria', `Erro inesperado no launcher:\n${message}`);
    process.exitCode = 1;
  });
