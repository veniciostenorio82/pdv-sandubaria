import express from 'express';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LAUNCHER_PORT = process.env.LAUNCHER_PORT ? Number(process.env.LAUNCHER_PORT) : 9101;
const LAUNCHER_BIND = process.env.LAUNCHER_BIND || '127.0.0.1';
const PRINT_AGENT_PORT = process.env.PRINT_AGENT_PORT ? Number(process.env.PRINT_AGENT_PORT) : 9100;
const PRINT_AGENT_HOST = process.env.PRINT_AGENT_HOST || '127.0.0.1';
const PRINT_AGENT_PATH = process.env.PRINT_AGENT_PATH || '../print-agent';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const app = express();
app.use(express.json());
// Simple CORS for PDV
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin === CORS_ORIGIN || origin === 'http://localhost:3000' || origin === 'http://localhost:5173' || origin === 'http://localhost:3001') {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS')
        return res.sendStatus(204);
    next();
});
// Health check - indicates launcher is active
app.get('/launcher/health', (_req, res) => {
    res.json({ status: 'ok', service: 'launcher' });
});
let printAgentProcess = null;
// Check if Print Agent is already running
async function checkPrintAgentHealth() {
    try {
        const response = await fetch(`http://${PRINT_AGENT_HOST}:${PRINT_AGENT_PORT}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
// Start Print Agent in background
function startPrintAgent() {
    return new Promise((resolve) => {
        // Check if already running
        checkPrintAgentHealth().then((isRunning) => {
            if (isRunning) {
                resolve({ success: true, message: 'Print Agent já está em execução' });
                return;
            }
            // If process is still alive but health check failed, kill it
            if (printAgentProcess) {
                printAgentProcess.kill();
                printAgentProcess = null;
            }
            // Start Print Agent
            const agentPath = path.resolve(__dirname, PRINT_AGENT_PATH);
            console.log(`[Launcher] Iniciando Print Agent em: ${agentPath}`);
            const child = spawn('npm', ['run', 'start'], {
                cwd: agentPath,
                detached: true, // Allow process to live independently
                stdio: ['ignore', 'pipe', 'pipe'], // Capture output
                shell: true,
            });
            printAgentProcess = child;
            let startTimeout;
            // Capture output for logging
            child.stdout?.on('data', (data) => {
                console.log(`[Print Agent] ${data.toString().trim()}`);
            });
            child.stderr?.on('data', (data) => {
                console.error(`[Print Agent] ${data.toString().trim()}`);
            });
            child.on('error', (err) => {
                clearTimeout(startTimeout);
                console.error('[Launcher] Erro ao iniciar Print Agent:', err);
                resolve({ success: false, message: `Erro ao iniciar: ${err.message}` });
            });
            // Wait for Print Agent to start (check health)
            startTimeout = setTimeout(() => {
                checkPrintAgentHealth().then((isRunning) => {
                    if (isRunning) {
                        console.log('[Launcher] Print Agent iniciado com sucesso');
                        resolve({ success: true, message: 'Print Agent iniciado com sucesso' });
                    }
                    else {
                        console.error('[Launcher] Print Agent falhou ao iniciar');
                        child.kill();
                        resolve({ success: false, message: 'Print Agent falhou ao iniciar. Verifique se o dispositivo /dev/usb/lp0 está disponível.' });
                    }
                });
            }, 5000); // Wait 5 seconds for startup
        });
    });
}
// Endpoint para iniciar Print Agent
app.post('/launcher/start', async (_req, res) => {
    try {
        const result = await startPrintAgent();
        if (result.success) {
            res.json({ status: 'success', message: result.message });
        }
        else {
            res.status(500).json({ status: 'error', message: result.message });
        }
    }
    catch (err) {
        console.error('[Launcher] Erro no endpoint /launcher/start:', err);
        res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
    }
});
// Endpoint para parar Print Agent
app.post('/launcher/stop', (_req, res) => {
    if (printAgentProcess) {
        printAgentProcess.kill();
        printAgentProcess = null;
        res.json({ status: 'success', message: 'Print Agent parado' });
    }
    else {
        res.json({ status: 'info', message: 'Print Agent não estava em execução' });
    }
});
app.listen(LAUNCHER_PORT, LAUNCHER_BIND, () => {
    console.log(`Print Launcher iniciado em ${LAUNCHER_BIND}:${LAUNCHER_PORT}`);
    console.log(`Aguardando comandos para iniciação do Print Agent (porta ${PRINT_AGENT_PORT})`);
});
